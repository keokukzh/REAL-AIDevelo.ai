-- FreeSWITCH Lua script for AI Agent call controller
-- Optimized for stability and zero external dependencies

local uuid = argv[1]
local location_id = argv[2] or "default"
local agent_id = argv[3] or "default"

local api = freeswitch.API()
local session = nil

if uuid then
  session = freeswitch.Session(uuid)
end
if not session then
  session = freeswitch.Session()
end

-- Use PUBLIC_BASE_URL or BACKEND_URL environment variable, fallback to Render URL
local backend_url = os.getenv("PUBLIC_BASE_URL") or os.getenv("BACKEND_URL") or "https://real-aidevelo-ai.onrender.com"
local max_turns = 20
local max_utterance_duration = 7 -- seconds (shorter is better for response time)

local function log(message)
  freeswitch.consoleLog("INFO", string.format("[CallController] %s: %s\n", uuid or "unknown", message))
end

-- Simple Base64 implementation (Optimized)
local b='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
local function base64_encode(data)
    return ((data:gsub('.', function(x) 
        local r,b='',x:byte()
        for i=8,1,-1 do r=r..(b%2^i-b%2^(i-1)>0 and '1' or '0') end
        return r;
    end)..'0000'):gsub('%d%d%d?%d?%d?%d?', function(x)
        if (#x < 6) then return '' end
        local c=0
        for i=1,6 do c=c+(x:sub(i,i)=='1' and 2^(6-i) or 0) end
        return b:sub(c+1,c+1)
    end)..({ '', '==', '=' })[#data%3+1])
end

log(string.format("Started: loc=%s, agent=%s, backend=%s", location_id, agent_id, backend_url))

if not session then
  log("ERROR: Session not found")
  return
end

-- Step 1: Notify backend
local function notify_backend(event)
  local url = string.format("%s/api/v1/freeswitch/call/%s", backend_url, event)
  local body = string.format("call_sid=%s&location_id=%s&agent_id=%s", uuid, location_id, agent_id)
  -- Use wget for notification too if mod_curl is shaky
  os.execute(string.format("wget -q --post-data '%s' %s -O /dev/null", body, url))
end

-- Step 2: Download and Play (Atomic)
local function download_and_play(url, label)
  log("Downloading " .. label .. " from " .. url)
  local audio_path = "/tmp/" .. label .. "_" .. uuid .. "_" .. os.time() .. ".wav"
  
  -- Use wget with timeout and retries
  local cmd = string.format("wget -q -T 10 -t 2 -O %s '%s'", audio_path, url)
  local res = os.execute(cmd)
  
  local f = io.open(audio_path, "r")
  if f then
    f:close()
    log("Playing " .. label)
    session:streamFile(audio_path)
    os.remove(audio_path)
    return true
  else
    log("FAILED to download " .. label .. " (res: " .. tostring(res) .. ")")
    return false
  end
end

-- Step 3: Conversation Loop
local function main()
  notify_backend("start")
  
  -- Play Greeting
  local greeting_url = string.format("%s/api/v1/freeswitch/greeting?location_id=%s&agent_id=%s", backend_url, location_id, agent_id)
  if not download_and_play(greeting_url, "greeting") then
    session:execute("speak", "flite|kal|Hallo! Ich bin Ihr KI-Assistent. Wie kann ich helfen?")
  end
  
  local turn = 0
  while turn < max_turns and session:ready() do
    turn = turn + 1
    log(string.format("Turn %d", turn))
    
    -- Record
    local record_path = "/tmp/utt_" .. uuid .. "_" .. os.time() .. ".wav"
    session:recordFile(record_path, max_utterance_duration, 500, 2)
    
    local f = io.open(record_path, "r")
    if f then
      f:close()
      
      -- Process
      log("Processing speech...")
      local audio_data = ""
      local rf = io.open(record_path, "rb")
      if rf then audio_data = rf:read("*all"); rf:close() end
      os.remove(record_path)
      
      local audio_base64 = base64_encode(audio_data)
      local turn_url = backend_url .. "/api/v1/freeswitch/call/process-turn"
      local request_body = string.format('{"call_sid":"%s","location_id":"%s","agent_id":"%s","audio":"%s"}', 
                                      uuid, location_id, agent_id, audio_base64)
                                      
      local body_file = "/tmp/req_" .. uuid .. ".json"
      local bf = io.open(body_file, "w")
      if bf then
        bf:write(request_body)
        bf:close()
        
        -- Use wget to POST the JSON and get response
        local resp_file = "/tmp/resp_" .. uuid .. ".json"
        local wget_post = string.format("wget -q -T 30 --header='Content-Type: application/json' --post-file=%s %s -O %s", 
                                       body_file, turn_url, resp_file)
        os.execute(wget_post)
        os.remove(body_file)
        
        local rf2 = io.open(resp_file, "r")
        if rf2 then
          local response_text = rf2:read("*all")
          rf2:close()
          os.remove(resp_file)
          
          local audio_url = string.match(response_text, '"audio_url"%s*:%s*"([^"]+)"')
          if audio_url then
            download_and_play(audio_url, "response")
          else
            log("No audio_url in response")
            session:execute("speak", "flite|kal|Entschuldigung, ich konnte das nicht verarbeiten.")
          end
        else
          log("Backend timed out or failed")
          session:execute("speak", "flite|kal|Entschuldigung, die Verbindung zum Server ist unterbrochen.")
        end
      end
    else
      log("Silence or recording failed")
      break
    end
  end
  
  notify_backend("end")
end

local status, err = pcall(main)
if not status then log("CRASH: " .. tostring(err)) end
log("Finished")
