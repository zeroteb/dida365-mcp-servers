#!/bin/bash
# ====================================================================
# Dida365 Internal V2 API Endpoint Tester
# Usage: chmod +x test-v2-api.sh && ./test-v2-api.sh
# ====================================================================

TOKEN="Bearer tp_09404c6d9ac347ee9c2ec51fe3fadd2d"
BASE="https://api.dida365.com"
V2="$BASE/api/v2"
V1="$BASE/open/v1"

# Date range: last 7 days
END_DATE=$(date -u +"%Y-%m-%dT%H:%M:%S+0000")
START_DATE=$(date -u -d "7 days ago" +"%Y-%m-%dT%H:%M:%S+0000" 2>/dev/null || date -u -v-7d +"%Y-%m-%dT%H:%M:%S+0000")

# For completedInAll endpoint (different date format)
FROM_DATE=$(date -u -d "7 days ago" +"%Y-%m-%dT%H:%M:%S+0000" 2>/dev/null || date -u -v-7d +"%Y-%m-%dT%H:%M:%S+0000")
TO_DATE=$(date -u +"%Y-%m-%dT%H:%M:%S+0000")

echo "=============================================="
echo "Dida365 API V2 Endpoint Test"
echo "Date range: $START_DATE -> $END_DATE"
echo "=============================================="

test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"

    echo ""
    echo "----------------------------------------------"
    echo "[$method] $name"
    echo "URL: $url"
    echo "----------------------------------------------"

    response=$(curl -s -w "\n---HTTP_STATUS:%{http_code}---" \
        -X "$method" \
        "$url" \
        -H "Authorization: $TOKEN" \
        -H "Content-Type: application/json" \
        --connect-timeout 10 \
        --max-time 30 2>&1)

    http_status=$(echo "$response" | grep -o '---HTTP_STATUS:[0-9]*---' | grep -o '[0-9]*')
    body=$(echo "$response" | sed 's/---HTTP_STATUS:[0-9]*---//')

    if [ "$http_status" = "200" ]; then
        echo "STATUS: $http_status ✅"
        # Show first 500 chars of response
        echo "$body" | head -c 500
        echo ""
        if [ ${#body} -gt 500 ]; then
            echo "... (truncated, total ${#body} chars)"
        fi
    else
        echo "STATUS: $http_status ❌"
        echo "$body" | head -c 300
        echo ""
    fi
}

echo ""
echo "=============================================="
echo "PART 1: Official Open API V1 (baseline)"
echo "=============================================="

test_endpoint "V1 - Get Projects" "$V1/project"
test_endpoint "V1 - Get All Tasks" "$V1/task"

echo ""
echo "=============================================="
echo "PART 2: Internal V2 - Task Endpoints"
echo "=============================================="

test_endpoint "V2 - Batch Check (full sync)" "$V2/batch/check/0"
test_endpoint "V2 - Completed Tasks (all projects, last 7 days)" "$V2/project/all/completedInAll/?from=$FROM_DATE&to=$TO_DATE"
test_endpoint "V2 - All Tasks" "$V2/task"
test_endpoint "V2 - Projects" "$V2/projects"

echo ""
echo "=============================================="
echo "PART 3: Internal V2 - Pomodoro / Focus"
echo "=============================================="

test_endpoint "V2 - Pomodoros" "$V2/pomodoros"
test_endpoint "V2 - Focus Records" "$V2/focus/records"
test_endpoint "V2 - Focus Summary" "$V2/focus/summary"
test_endpoint "V2 - Focus Heatmap" "$V2/focus/heatmap"
test_endpoint "V2 - Focus Duration" "$V2/focus/duration"
test_endpoint "V2 - Focus Statistics" "$V2/focus/statistics"
test_endpoint "V2 - Pomo Statistics" "$V2/pomodoro/statistics"

echo ""
echo "=============================================="
echo "PART 4: Internal V2 - Habits"
echo "=============================================="

test_endpoint "V2 - Habits" "$V2/habits"
test_endpoint "V2 - Habit Records" "$V2/habitCheckins"
test_endpoint "V2 - Habit Sections" "$V2/habitSections"

echo ""
echo "=============================================="
echo "PART 5: Internal V2 - User / Settings / Tags"
echo "=============================================="

test_endpoint "V2 - User Status" "$V2/user/status"
test_endpoint "V2 - User Profile" "$V2/user/profile"
test_endpoint "V2 - User Preferences" "$V2/user/preferences/settings"
test_endpoint "V2 - Tags" "$V2/tags"
test_endpoint "V2 - Project Groups" "$V2/projectGroup"
test_endpoint "V2 - Columns" "$V2/column"

echo ""
echo "=============================================="
echo "PART 6: Additional Possible V2 Endpoints"
echo "=============================================="

test_endpoint "V2 - Task Summary" "$V2/task/summary"
test_endpoint "V2 - Statistics" "$V2/statistics"
test_endpoint "V2 - User Statistics" "$V2/user/statistics"
test_endpoint "V2 - Inbox" "$V2/inbox"
test_endpoint "V2 - Notification" "$V2/notification"
test_endpoint "V2 - Calendar Events" "$V2/calendarEvents"
test_endpoint "V2 - User Points" "$V2/user/points"

echo ""
echo "=============================================="
echo "DONE! Check results above."
echo "=============================================="
