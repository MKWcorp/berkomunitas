#!/bin/bash
# SSO API Quick Test Script
# Tests if the critical API routes are now working

echo "🧪 Testing SSO API Routes..."
echo "================================"
echo ""

BASE_URL="http://localhost:3000"

# Test routes (should return 401 if not authenticated, not 500)
routes=(
  "/api/profil/check-completeness"
  "/api/notifikasi?limit=10"
  "/api/profil/dashboard"
  "/api/profil/loyalty"
  "/api/profil"
)

passed=0
failed=0

for route in "${routes[@]}"; do
  echo "Testing: $route"
  
  # Make request and capture status code
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
  
  if [ "$status" = "401" ] || [ "$status" = "200" ]; then
    echo "✅ PASS - Status: $status (Expected: 401 or 200)"
    ((passed++))
  elif [ "$status" = "500" ]; then
    echo "❌ FAIL - Status: 500 (Server Error - type mismatch still present)"
    ((failed++))
  else
    echo "⚠️  WARN - Status: $status (Unexpected status)"
    ((failed++))
  fi
  
  echo ""
done

echo "================================"
echo "📊 Test Results:"
echo "✅ Passed: $passed/${#routes[@]}"
echo "❌ Failed: $failed/${#routes[@]}"
echo ""

if [ $failed -eq 0 ]; then
  echo "🎉 All tests passed! Type mismatch is fixed."
  echo "Next: Test login flow in browser"
else
  echo "⚠️  Some tests failed. Check server logs for details."
fi
