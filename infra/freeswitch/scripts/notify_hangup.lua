-- FreeSWITCH Lua script to notify backend when call hangs up
local uuid = argv[1]
local location_id = argv[2] or "default"
local agent_id = argv[3] or "default"

local api = freeswitch.API()

-- Use PUBLIC_BASE_URL or BACKEND_URL environment variable, fallback to Render URL
local backend_url = os.getenv("PUBLIC_BASE_URL") or os.getenv("BACKEND_URL") or "https://real-aidevelo-ai.onrender.com"
local url = string.format("%s/api/v1/freeswitch/call/hangup", backend_url)
local body = "call_sid=" .. uuid .. "&location_id=" .. location_id .. "&agent_id=" .. agent_id

-- Use native FreeSWITCH curl instead of Lua socket.http to avoid module dependency issues
local curl_cmd = string.format("%s POST %s", url, body)
local result = api:execute("curl", curl_cmd)

freeswitch.consoleLog("INFO", string.format("[NotifyHangup] Notified backend: %s. Result: %s\n", uuid, result))
