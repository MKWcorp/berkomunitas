#!/bin/bash
# MinIO Setup Verification for Berkomunitas
# Run this script on server: ssh root@213.190.4.159

echo "🔍 MinIO Setup Verification for Berkomunitas"
echo "=============================================="
echo ""

# 1. Check bucket policy
echo "1️⃣ Checking bucket policy..."
POLICY=$(docker exec drw-minio mc anonymous get local/berkomunitas 2>&1)
echo "$POLICY"
if [[ "$POLICY" == *"download"* ]]; then
  echo "✅ Bucket policy: PUBLIC (download enabled)"
else
  echo "❌ Bucket policy: NOT PUBLIC - Setting now..."
  docker exec drw-minio mc anonymous set download local/berkomunitas
fi
echo ""

# 2. List files
echo "2️⃣ Listing files in bucket..."
FILE_COUNT=$(docker exec drw-minio mc ls --recursive local/berkomunitas/ | wc -l)
echo "Total files: $FILE_COUNT"
echo ""
echo "Recent files in profile-pictures:"
docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | head -10
echo ""

# 3. Upload test file
echo "3️⃣ Uploading test file..."
TEST_CONTENT="Test file uploaded at $(date)"
echo "$TEST_CONTENT" | docker exec -i drw-minio mc pipe local/berkomunitas/profile-pictures/verify-test-$(date +%s).txt
echo "✅ Test file uploaded"
echo ""

# 4. Test subdomain access
echo "4️⃣ Testing subdomain access..."
TEST_FILE=$(docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | grep "verify-test-" | tail -1 | awk '{print $NF}')
if [ -n "$TEST_FILE" ]; then
  TEST_URL="http://storage.berkomunitas.com/berkomunitas/profile-pictures/$TEST_FILE"
  echo "Testing: $TEST_URL"
  
  RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$TEST_URL")
  HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
  
  if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Subdomain access: WORKING (200 OK)"
  else
    echo "❌ Subdomain access: FAILED (HTTP $HTTP_CODE)"
    echo "Response: $(echo "$RESPONSE" | grep -v "HTTP_CODE:")"
  fi
else
  echo "⚠️ Could not find test file to verify"
fi
echo ""

# 5. Test direct MinIO access
echo "5️⃣ Testing direct MinIO access..."
if [ -n "$TEST_FILE" ]; then
  curl -s -I "http://localhost:9000/berkomunitas/profile-pictures/$TEST_FILE" | head -5
else
  echo "⚠️ Skipping (no test file)"
fi
echo ""

# 6. Check DNS
echo "6️⃣ Checking DNS for storage.berkomunitas.com..."
nslookup storage.berkomunitas.com 2>&1 | grep -A1 "Name:" | tail -1 || nslookup storage.berkomunitas.com | grep "Address:"
echo ""

# 7. Check Nginx config
echo "7️⃣ Checking Nginx config..."
if docker exec nginx-proxy test -f /etc/nginx/conf.d/storage.berkomunitas.com.conf 2>/dev/null; then
  echo "✅ Nginx config exists"
  docker exec nginx-proxy nginx -t 2>&1 | grep -E "successful|failed"
  echo ""
  echo "Nginx proxy_pass configuration:"
  docker exec nginx-proxy cat /etc/nginx/conf.d/storage.berkomunitas.com.conf | grep -A2 "location /"
else
  echo "❌ Nginx config NOT found"
fi
echo ""

# 8. Check network connectivity
echo "8️⃣ Checking Docker network connectivity..."
echo "Containers in 'webproxy' network:"
docker network inspect webproxy 2>/dev/null | grep -E "drw-minio|nginx-proxy" | grep "Name" | cut -d'"' -f4
echo ""

# 9. Check a real migrated file
echo "9️⃣ Testing real migrated file..."
REAL_FILE=$(docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | grep "migrated_" | head -1 | awk '{print $NF}')
if [ -n "$REAL_FILE" ]; then
  REAL_URL="http://storage.berkomunitas.com/berkomunitas/profile-pictures/$REAL_FILE"
  echo "Testing: $REAL_URL"
  
  curl -s -I "$REAL_URL" | head -5
  
  # Also test direct MinIO
  echo ""
  echo "Direct MinIO access:"
  curl -s -I "http://localhost:9000/berkomunitas/profile-pictures/$REAL_FILE" | head -5
else
  echo "⚠️ No migrated files found"
fi
echo ""

echo "=============================================="
echo "✅ Verification Complete!"
echo ""
echo "Summary:"
echo "- Bucket policy: $POLICY"
echo "- Total files: $FILE_COUNT"
echo "- Test file URL: ${TEST_URL:-N/A}"
echo ""
echo "If subdomain access failed but direct MinIO works,"
echo "the issue is with Nginx proxy configuration."
echo ""
echo "If both failed, check bucket policy or file paths."
