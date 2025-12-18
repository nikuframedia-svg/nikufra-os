#!/bin/bash
# Verify runtime: health endpoint and smartinventory endpoints
# Exit code 0 = PASS, 1 = FAIL

set -e

API_URL="${API_URL:-http://localhost:8000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:5174}"

echo "=== Runtime Verification ==="
echo "Backend: $API_URL"
echo "Frontend: $FRONTEND_URL"
echo ""

# 1. Check /api/health
echo "1. Checking /api/health..."
HEALTH_RESPONSE=$(curl -s "$API_URL/api/health" || echo "{}")
DB_CONNECTED=$(echo "$HEALTH_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('db_connected', False))" 2>/dev/null || echo "false")

if [ "$DB_CONNECTED" = "True" ] || [ "$DB_CONNECTED" = "true" ]; then
    echo "✅ DB connected: true"
else
    echo "❌ DB connected: false"
    echo "   Response: $HEALTH_RESPONSE" | head -3
    exit 1
fi

# 2. Check /api/smartinventory/wip
echo ""
echo "2. Checking /api/smartinventory/wip..."
WIP_RESPONSE=$(curl -s -w "\n%{http_code}" "$API_URL/api/smartinventory/wip" || echo -e "\n000")
HTTP_CODE=$(echo "$WIP_RESPONSE" | tail -1)
BODY=$(echo "$WIP_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "503" ]; then
    STATUS=$(echo "$BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('detail', {}).get('status', 'unknown'))" 2>/dev/null || echo "unknown")
    if [ "$STATUS" = "BACKEND_DEPENDENCY_DOWN" ]; then
        echo "❌ Status: BACKEND_DEPENDENCY_DOWN"
        echo "   Response: $BODY" | head -3
        exit 1
    fi
fi

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Status: 200 OK"
elif [ "$HTTP_CODE" = "503" ]; then
    echo "❌ Status: 503 Service Unavailable"
    echo "   Response: $BODY" | head -3
    exit 1
else
    echo "⚠️  Status: $HTTP_CODE"
    echo "   Response: $BODY" | head -3
fi

echo ""
echo "=== PASS ==="
exit 0

