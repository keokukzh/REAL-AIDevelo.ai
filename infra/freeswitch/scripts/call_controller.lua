-- FreeSWITCH Lua script for AI Agent call controller
-- This script handles the turn-based conversation loop
-- This version uses NATIVE FreeSWITCH commands to avoid Lua module dependencies

local uuid = argv[1]
local location_id = argv[2] or "default"
local agent_id = argv[3] or "default"

local api = freeswitch.API()
local session = nil

-- Try to get session by UUID first
if uuid then
  session = freeswitch.Session(uuid)
end
if not session then
  session = freeswitch.Session()
end

-- Use PUBLIC_BASE_URL or BACKEND_URL environment variable, fallback to Render URL
local backend_url = os.getenv("PUBLIC_BASE_URL") or os.getenv("BACKEND_URL") or "https://real-aidevelo-ai.onrender.com"
local max_turns = 20
local max_utterance_duration = 10 -- seconds

-- Log function
local function log(message)
  freeswitch.consoleLog("INFO", string.format("[CallController] %s: %s\n", uuid or "unknown", message))
end

log(string.format("Starting call controller: location_id=%s, agent_id=%s", location_id, agent_id))

if not session then
  log("ERROR: Could not get session!")
  return
end

-- Native Curl Helper
local function native_curl_post(url, body)
  local curl_cmd = string.format("%s POST %s", url, body)
  return api:execute("curl", curl_cmd)
end

-- Step 1: Notify backend that call started
local function notify_backend(event, data)
  local url = string.format("%s/api/v1/freeswitch/call/%s", backend_url, event)
  local body = string.format("call_sid=%s&location_id=%s&agent_id=%s", uuid, location_id, agent_id)
  return native_curl_post(url, body)
end

-- Step 2: Play greeting
local function play_greeting()
  log("Playing greeting")
  local audio_path = "/tmp/greeting_" .. uuid .. ".wav"
  local greeting_url = string.format("%s/api/v1/freeswitch/greeting?location_id=%s&agent_id=%s", backend_url, location_id, agent_id)
  
  -- Use native curl_download if available, otherwise native curl and local write
  -- Many FS versions have mod_curl's curl_download
  log("Downloading greeting from: " .. greeting_url)
  api:execute("curl_download", greeting_url .. " " .. audio_path)
  
  -- Check if file exists
  local f = io.open(audio_path, "r")
  if f then
    f:close()
    session:streamFile(audio_path)
    os.remove(audio_path)
  else
    log("Greeting download failed or curl_download not available, using fallback TTS")
    session:execute("speak", "flite|kal|Grüezi! Willkommen bei A-I Develo. Wie kann ich Ihnen helfen?")
  end
end

-- Step 3: Record user utterance
local function record_utterance()
  log("Recording user utterance...")
  local record_path = "/tmp/utterance_" .. uuid .. "_" .. os.time() .. ".wav"
  
  -- recordFile(path, max_duration_sec, silence_threshold, silence_duration_sec)
  session:recordFile(record_path, max_utterance_duration, 500, 2)
  
  local f = io.open(record_path, "r")
  if f then
    f:close()
    return record_path
  end
  return nil
end

-- Step 4: Process turn (Native ASR + LLM + TTS)
local function process_turn(audio_path)
  log("Processing turn...")
  
  -- Encode to base64 using native FS command
  local audio_base64 = api:execute("base64", "encode " .. audio_path)
  if not audio_base64 or audio_base64 == "" then
    log("Base64 encoding failed")
    return nil
  end
  
  -- Send to backend via native curl
  -- Important: mod_curl POST with body requires the body as the 3rd argument if we want JSON
  -- But native 'curl' command is simpler: curl <url> [POST|GET] [body] [content-type]
  local url = string.format("%s/api/v1/freeswitch/call/process-turn", backend_url)
  
  -- Construct JSON manually to avoid 'json' dependency
  local request_body = string.format('{"call_sid":"%s","location_id":"%s","agent_id":"%s","audio":"%s"}', 
    uuid, location_id, agent_id, audio_base64)
  
  -- Save request body to temp file to avoid command line length limits for large base64
  local body_path = "/tmp/req_" .. uuid .. ".json"
  local bf = io.open(body_path, "w")
  if bf then
    bf:write(request_body)
    bf:close()
    
    -- Use curl with file body: curl <url> POST @<path> application/json
    local response_text = api:execute("curl", url .. " POST @" .. body_path .. " application/json")
    os.remove(body_path)
    
    if response_text and response_text ~= "" then
      -- Simple JSON extraction for audio_url
      local audio_url = string.match(response_text, '"audio_url"%s*:%s*"([^"]+)"')
      return audio_url
    end
  end
  
  return nil
end

-- Main loop
pcall(function()
  notify_backend("start", "")
  play_greeting()
  
  local turn = 0
  while turn < max_turns and session:ready() do
    turn = turn + 1
    log(string.format("Turn %d", turn))
    
    local audio_path = record_utterance()
    if audio_path then
      local response_url = process_turn(audio_path)
      os.remove(audio_path)
      
      if response_url then
        log("Playing response: " .. response_url)
        local audio_path_resp = "/tmp/resp_" .. uuid .. ".wav"
        
        if string.match(response_url, "^http") then
          api:execute("curl_download", response_url .. " " .. audio_path_resp)
          session:streamFile(audio_path_resp)
          os.remove(audio_path_resp)
        else
          session:streamFile(response_url)
        end
      else
        log("No response URL, playing fallback TTS")
        session:execute("speak", "flite|kal|Entschuldigung, ich habe Sie nicht verstanden.")
      end
    else
      log("Recording failed")
      break
    end
  end
  
  notify_backend("end", "")
end)

log("Call controller finished")
