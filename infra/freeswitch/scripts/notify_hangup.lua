-- FreeSWITCH Lua script to notify backend when call hangs up
-- Optimized for zero-dependency and stability
local uuid = argv[1]
local location_id = argv[2] or "default"
local agent_id = argv[3] or "default"

-- Use PUBLIC_BASE_URL or BACKEND_URL environment variable, fallback to Render URL
local backend_url = os.getenv("PUBLIC_BASE_URL") or os.getenv("BACKEND_URL") or "https://real-aidevelo-ai.onrender.com"
local url = string.format("%s/api/v1/freeswitch/call/hangup", backend_url)
local body = string.format("call_sid=%s&location_id=%s&agent_id=%s", uuid, location_id, agent_id)

-- Use os.execute("wget") to ensure zero dependence on Lua modules or FS modules
os.execute(string.format("wget -q --post-data '%s' %s -O /dev/null", body, url))

freeswitch.consoleLog("INFO", string.format("[NotifyHangup] Notified backend of hangup for session %s\n", uuid))
