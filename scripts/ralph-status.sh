#!/bin/bash
# Ralph Status Script
# Displays current Ralph session status

set -e

SESSION_FILE="${1:-.ralph_session}"
OUTPUT_FORMAT="${2:-text}"

if [ ! -f "$SESSION_FILE" ]; then
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        echo '{"error": "No active session found", "session_file": "'"$SESSION_FILE"'"}'
    else
        echo "No active Ralph session found."
        echo "Session file: $SESSION_FILE"
        echo ""
        echo "To start a session, use the autonomous-loop skill in Cursor."
    fi
    exit 1
fi

# Parse session file
LOOP_COUNT=$(jq -r '.loop_count // 0' "$SESSION_FILE" 2>/dev/null || echo "0")
API_CALLS=$(jq -r '.api_calls // 0' "$SESSION_FILE" 2>/dev/null || echo "0")
START_TIME=$(jq -r '.start_time // "unknown"' "$SESSION_FILE" 2>/dev/null || echo "unknown")
LAST_ACTIVITY=$(jq -r '.last_activity // "unknown"' "$SESSION_FILE" 2>/dev/null || echo "unknown")
CIRCUIT_BREAKER=$(jq -r '.circuit_breaker // "closed"' "$SESSION_FILE" 2>/dev/null || echo "closed")
FAILURES=$(jq -r '.failures // 0' "$SESSION_FILE" 2>/dev/null || echo "0")
EXIT_SIGNAL=$(jq -r '.exit_signal // false' "$SESSION_FILE" 2>/dev/null || echo "false")
COMPLETED_TASKS=$(jq -r '.completed_tasks // []' "$SESSION_FILE" 2>/dev/null || echo "[]")
CURRENT_TASK=$(jq -r '.current_task // "none"' "$SESSION_FILE" 2>/dev/null || echo "none")

# Calculate runtime
if [ "$START_TIME" != "unknown" ]; then
    START_EPOCH=$(date -d "$START_TIME" +%s 2>/dev/null || echo "0")
    NOW_EPOCH=$(date +%s)
    RUNTIME_SEC=$((NOW_EPOCH - START_EPOCH))
    RUNTIME_HOURS=$((RUNTIME_SEC / 3600))
    RUNTIME_MINS=$(((RUNTIME_SEC % 3600) / 60))
fi

# Get rate limit info
RATE_LIMIT_CALLS=$(jq -r '.rate_limit.calls_this_hour // 0' "$SESSION_FILE" 2>/dev/null || echo "0")
RATE_LIMIT_MAX=$(jq -r '.rate_limit.max_per_hour // 100' "$SESSION_FILE" 2>/dev/null || echo "100")

if [ "$OUTPUT_FORMAT" = "json" ]; then
    # JSON output
    jq -n \
        --arg loop_count "$LOOP_COUNT" \
        --arg api_calls "$API_CALLS" \
        --arg start_time "$START_TIME" \
        --arg last_activity "$LAST_ACTIVITY" \
        --arg circuit_breaker "$CIRCUIT_BREAKER" \
        --arg failures "$FAILURES" \
        --arg exit_signal "$EXIT_SIGNAL" \
        --arg current_task "$CURRENT_TASK" \
        --arg runtime_hours "$RUNTIME_HOURS" \
        --arg runtime_mins "$RUNTIME_MINS" \
        --arg rate_limit_calls "$RATE_LIMIT_CALLS" \
        --arg rate_limit_max "$RATE_LIMIT_MAX" \
        '{
            loop_count: ($loop_count | tonumber),
            api_calls: ($api_calls | tonumber),
            start_time: $start_time,
            last_activity: $last_activity,
            circuit_breaker: $circuit_breaker,
            failures: ($failures | tonumber),
            exit_signal: ($exit_signal == "true"),
            current_task: $current_task,
            runtime: {
                hours: ($runtime_hours | tonumber),
                minutes: ($runtime_mins | tonumber)
            },
            rate_limit: {
                calls_this_hour: ($rate_limit_calls | tonumber),
                max_per_hour: ($rate_limit_max | tonumber),
                remaining: (($rate_limit_max | tonumber) - ($rate_limit_calls | tonumber))
            }
        }'
else
    # Text output
    echo "Ralph Session Status"
    echo "==================="
    echo ""
    echo "Session File: $SESSION_FILE"
    echo ""
    echo "Loop Count: $LOOP_COUNT"
    echo "API Calls: $API_CALLS"
    echo "Start Time: $START_TIME"
    echo "Last Activity: $LAST_ACTIVITY"
    if [ "$RUNTIME_HOURS" != "" ]; then
        echo "Runtime: ${RUNTIME_HOURS}h ${RUNTIME_MINS}m"
    fi
    echo ""
    echo "Circuit Breaker: $CIRCUIT_BREAKER"
    echo "Failures: $FAILURES"
    echo "Exit Signal: $EXIT_SIGNAL"
    echo ""
    echo "Current Task: $CURRENT_TASK"
    echo ""
    echo "Rate Limit: $RATE_LIMIT_CALLS / $RATE_LIMIT_MAX calls per hour"
    echo "Remaining: $((RATE_LIMIT_MAX - RATE_LIMIT_CALLS)) calls"
    echo ""
    
    if [ "$COMPLETED_TASKS" != "[]" ]; then
        echo "Completed Tasks:"
        echo "$COMPLETED_TASKS" | jq -r '.[]' 2>/dev/null | sed 's/^/  - /' || echo "  (unable to parse)"
        echo ""
    fi
    
    # Check log file
    if [ -f "logs/ralph.log" ]; then
        echo "Recent Log Entries (last 5):"
        tail -n 5 logs/ralph.log | sed 's/^/  /'
    fi
fi
