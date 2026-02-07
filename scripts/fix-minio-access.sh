#!/bin/bash
# MinIO Auto-Fix Script
# Run on server: ssh root@213.190.4.159 'bash -s' < scripts/fix-minio-access.sh

echo "🔧 MinIO Auto-Fix Script"
echo "════════════════════════════════════════════════"
echo ""

# Step 1: Check & Fix Bucket Policy
echo "1️⃣ Checking bucket policy..."
POLICY=$(docker exec drw-minio mc anonymous get local/berkomunitas 2>&1)
echo "Current policy: $POLICY"

if [[ "$POLICY" != *"download"* ]]; then
  echo "❌ Bucket is NOT public. Fixing..."
  docker exec drw-minio mc anonymous set download local/berkomunitas
  echo "✅ Bucket policy set to PUBLIC (download)"
else
  echo "✅ Bucket policy already PUBLIC"
fi
echo ""

# Step 2: List Actual Files
echo "2️⃣ Listing files in MinIO..."
echo "Files in /berkomunitas/profile-pictures/:"
docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | head -20
echo ""

FILE_COUNT=$(docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | wc -l)
echo "Total files found: $FILE_COUNT"
echo ""

# Step 3: Test Upload & Access
echo "3️⃣ Testing fresh upload..."
TEST_FILENAME="test-$(date +%s).txt"
TEST_CONTENT="Test upload at $(date)"
echo "$TEST_CONTENT" | docker exec -i drw-minio mc pipe local/berkomunitas/profile-pictures/$TEST_FILENAME

echo "✅ Uploaded: $TEST_FILENAME"
echo ""

# Step 4: Test Public Access
echo "4️⃣ Testing public access..."
TEST_URL="http://storage.berkomunitas.com/berkomunitas/profile-pictures/$TEST_FILENAME"
echo "URL: $TEST_URL"
echo ""

sleep 2 # Wait for propagation

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$TEST_URL")
HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d':' -f2)
BODY=$(echo "$RESPONSE" | grep -v "HTTP_CODE:")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ PUBLIC ACCESS WORKING!"
  echo "Response: $BODY"
else
  echo "❌ PUBLIC ACCESS FAILED (HTTP $HTTP_CODE)"
  echo "Response: $BODY"
  
  # Try direct MinIO port
  echo ""
  echo "Testing direct MinIO access (port 9100)..."
  curl -s "http://localhost:9100/berkomunitas/profile-pictures/$TEST_FILENAME"
  echo ""
fi
echo ""

# Step 5: Check Nginx Config
echo "5️⃣ Checking Nginx configuration..."
if docker exec nginx-proxy test -f /etc/nginx/conf.d/storage.berkomunitas.com.conf 2>/dev/null; then
  echo "Nginx config location block:"
  docker exec nginx-proxy cat /etc/nginx/conf.d/storage.berkomunitas.com.conf | grep -A5 "location /"
else
  echo "❌ Nginx config not found!"
fi
echo ""

# Step 6: Verify Migrated Files
echo "6️⃣ Checking migrated files..."
MIGRATED_COUNT=$(docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | grep "migrated_" | wc -l)
echo "Migrated files found: $MIGRATED_COUNT"

if [ "$MIGRATED_COUNT" -gt 0 ]; then
  echo "Sample migrated files:"
  docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | grep "migrated_" | head -5
  echo ""
  
  # Test one migrated file
  FIRST_MIGRATED=$(docker exec drw-minio mc ls local/berkomunitas/profile-pictures/ | grep "migrated_" | head -1 | awk '{print $NF}')
  if [ -n "$FIRST_MIGRATED" ]; then
    MIGRATED_URL="http://storage.berkomunitas.com/berkomunitas/profile-pictures/$FIRST_MIGRATED"
    echo "Testing migrated file: $MIGRATED_URL"
    curl -s -I "$MIGRATED_URL" | head -5
  fi
else
  echo "⚠️ NO migrated files found!"
  echo "Files may have been uploaded to wrong path or bucket."
fi
echo ""

# Summary
echo "════════════════════════════════════════════════"
echo "📊 Summary"
echo "════════════════════════════════════════════════"
echo "Bucket policy: $POLICY"
echo "Total files: $FILE_COUNT"
echo "Migrated files: $MIGRATED_COUNT"
echo "Test file: $TEST_URL"
echo "Test result: HTTP $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ MinIO is FULLY WORKING!"
  echo ""
  echo "Next steps:"
  echo "1. Test upload from your application"
  echo "2. Verify images display correctly"
  echo "3. Deploy to production"
else
  echo "❌ MinIO still has issues"
  echo ""
  echo "Possible solutions:"
  echo "1. Check Nginx proxy_pass configuration"
  echo "2. Verify Docker network connectivity"
  echo "3. Check MinIO container logs: docker logs drw-minio --tail 50"
  echo "4. Check Nginx logs: docker logs nginx-proxy --tail 50 | grep storage"
fi

echo ""
echo "════════════════════════════════════════════════"
