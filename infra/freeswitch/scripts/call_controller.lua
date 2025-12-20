-- FreeSWITCH Lua script for AI Agent call controller
-- This script handles the turn-based conversation loop

local uuid = argv[1]
local location_id = argv[2] or "default"
local agent_id = argv[3] or "default"

local api = freeswitch.API()
-- Use PUBLIC_BASE_URL or BACKEND_URL environment variable, fallback to Render URL
local backend_url = os.getenv("PUBLIC_BASE_URL") or os.getenv("BACKEND_URL") or "https://real-aidevelo-ai.onrender.com"
local max_turns = 20
local max_utterance_duration = 10 -- seconds

-- Log function
local function log(message)
  freeswitch.consoleLog("INFO", string.format("[CallController] %s: %s\n", uuid, message))
end

log(string.format("Starting call controller: location_id=%s, agent_id=%s", location_id, agent_id))

-- Step 1: Notify backend that call started
local function notify_backend(event, data)
  local http = require("socket.http")
  local ltn12 = require("ltn12")
  local url = string.format("%s/api/v1/freeswitch/call/%s", backend_url, event)
  
  local response_body = {}
  local body = "call_sid=" .. uuid .. "&location_id=" .. location_id .. "&agent_id=" .. agent_id
  if data then
    for k, v in pairs(data) do
      body = body .. "&" .. k .. "=" .. v
    end
  end
  
  local result, status = http.request{
    url = url,
    method = "POST",
    headers = {
      ["Content-Type"] = "application/x-www-form-urlencoded",
      ["Content-Length"] = string.len(body)
    },
    source = ltn12.source.string(body),
    sink = ltn12.sink.table(response_body)
  }
  
  if status == 200 then
    return table.concat(response_body)
  else
    log(string.format("Backend notification failed: %s (status: %s)", url, status))
    return nil
  end
end

-- Step 2: Play greeting (from backend TTS)
local function play_greeting()
  log("Playing greeting")
  
  -- Request greeting audio from backend
  local greeting_url = string.format("%s/api/v1/freeswitch/greeting?location_id=%s&agent_id=%s", backend_url, location_id, agent_id)
  
  -- Download greeting audio
  local http = require("socket.http")
  local ltn12 = require("ltn12")
  local response_body = {}
  
  local result, status = http.request{
    url = greeting_url,
    method = "GET",
    sink = ltn12.sink.table(response_body)
  }
  
  if status == 200 then
    local audio_path = "/tmp/greeting_" .. uuid .. ".wav"
    local file = io.open(audio_path, "wb")
    if file then
      file:write(table.concat(response_body))
      file:close()
      
      -- Play audio
      api:execute("playback", audio_path)
      
      -- Cleanup
      os.remove(audio_path)
    end
  else
    -- Fallback: Use FreeSWITCH text-to-speech
    api:execute("speak", "flite|kal|Grüezi, wie kann ich Ihnen helfen?")
  end
end

-- Step 3: Record user utterance
local function record_utterance()
  log("Recording utterance")
  
  local record_path = "/tmp/utterance_" .. uuid .. "_" .. os.time() .. ".wav"
  
  -- Record with silence detection
  api:execute("record_session", record_path .. " " .. max_utterance_duration .. " 200 500")
  
  -- Wait a bit for recording to start
  freeswitch.msleep(500)
  
  -- Wait for recording to complete or timeout
  local timeout = max_utterance_duration * 1000
  local elapsed = 0
  while elapsed < timeout do
    freeswitch.msleep(100)
    elapsed = elapsed + 100
    -- Check if file exists and has content
    local file = io.open(record_path, "rb")
    if file then
      file:close()
      -- Check file size (if > 0, recording might be done)
      -- For now, just wait for timeout or use silence detection
    end
  end
  
  return record_path
end

-- Step 4: Send audio to backend for ASR + LLM + TTS
local function process_turn(audio_path)
  log("Processing turn")
  
  -- Read audio file
  local file = io.open(audio_path, "rb")
  if not file then
    log("Failed to read audio file: " .. audio_path)
    return nil
  end
  
  local audio_data = file:read("*all")
  file:close()
  
  -- Encode to base64
  local base64 = require("base64")
  local audio_base64 = base64.encode(audio_data)
  
  -- Send to backend
  local http = require("socket.http")
  local ltn12 = require("ltn12")
  local json = require("json")
  
  local request_body = json.encode({
    call_sid = uuid,
    location_id = location_id,
    agent_id = agent_id,
    audio = audio_base64
  })
  
  local response_body = {}
  local url = string.format("%s/api/v1/freeswitch/call/process-turn", backend_url)
  
  local result, status = http.request{
    url = url,
    method = "POST",
    headers = {
      ["Content-Type"] = "application/json",
      ["Content-Length"] = string.len(request_body)
    },
    source = ltn12.source.string(request_body),
    sink = ltn12.sink.table(response_body)
  }
  
  if status == 200 then
    local response_text = table.concat(response_body)
    local response_data = json.decode(response_text)
    
    if response_data and response_data.audio_url then
      return response_data.audio_url
    end
  end
  
  return nil
end

-- Step 5: Play response audio
local function play_response(audio_url)
  log("Playing response: " .. audio_url)
  
  -- Download audio if URL
  if string.match(audio_url, "http") then
    local http = require("socket.http")
    local ltn12 = require("ltn12")
    local response_body = {}
    
    local result, status = http.request{
      url = audio_url,
      method = "GET",
      sink = ltn12.sink.table(response_body)
    }
    
    if status == 200 then
      local audio_path = "/tmp/response_" .. uuid .. "_" .. os.time() .. ".wav"
      local file = io.open(audio_path, "wb")
      if file then
        file:write(table.concat(response_body))
        file:close()
        api:execute("playback", audio_path)
        os.remove(audio_path)
        return true
      end
    end
  else
    -- Local file path
    api:execute("playback", audio_url)
    return true
  end
  
  return false
end

-- Main conversation loop
notify_backend("start", {})

play_greeting()

local turn = 0
while turn < max_turns do
  turn = turn + 1
  log(string.format("Turn %d/%d", turn, max_turns))
  
  -- Record utterance
  local audio_path = record_utterance()
  if not audio_path then
    log("Failed to record utterance")
    break
  end
  
  -- Process turn (ASR + LLM + TTS)
  local response_audio_url = process_turn(audio_path)
  
  -- Cleanup utterance file
  os.remove(audio_path)
  
  if not response_audio_url then
    log("Failed to process turn, playing fallback")
    api:execute("speak", "flite|kal|Entschuldigung, ich habe Sie nicht verstanden. Bitte wiederholen Sie.")
  else
    -- Play response
    if not play_response(response_audio_url) then
      log("Failed to play response")
      break
    end
  end
  
  -- Small pause between turns
  freeswitch.msleep(500)
end

-- Notify backend that call ended
notify_backend("end", { turns = turn })

log("Call controller finished")

