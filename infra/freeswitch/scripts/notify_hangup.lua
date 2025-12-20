-- FreeSWITCH Lua script to notify backend when call hangs up
local uuid = argv[1]
local location_id = argv[2] or "default"
local agent_id = argv[3] or "default"

-- Use PUBLIC_BASE_URL or BACKEND_URL environment variable, fallback to Render URL
local backend_url = os.getenv("PUBLIC_BASE_URL") or os.getenv("BACKEND_URL") or "https://real-aidevelo-ai.onrender.com"
local http = require("socket.http")
local ltn12 = require("ltn12")

local url = string.format("%s/api/v1/freeswitch/call/hangup", backend_url)
local body = "call_sid=" .. uuid .. "&location_id=" .. location_id .. "&agent_id=" .. agent_id

local response_body = {}
http.request{
  url = url,
  method = "POST",
  headers = {
    ["Content-Type"] = "application/x-www-form-urlencoded",
    ["Content-Length"] = string.len(body)
  },
  source = ltn12.source.string(body),
  sink = ltn12.sink.table(response_body)
}

freeswitch.consoleLog("INFO", string.format("[NotifyHangup] Notified backend: %s\n", uuid))

