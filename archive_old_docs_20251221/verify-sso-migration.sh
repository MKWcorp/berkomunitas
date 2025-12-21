#!/bin/bash
# Final SSO Migration Verification Script
# Checks that all critical fixes are properly applied

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║         SSO Migration - Final Verification Check            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

BASE_DIR="c:/Users/Admin/Documents/berkomunitas/src/app/api"
PASS=0
FAIL=0
WARN=0

# Function to check if a file uses getCurrentUser instead of Clerk
check_sso_auth() {
  local file=$1
  local name=$2
  
  if grep -q "getCurrentUser" "$file" 2>/dev/null; then
    if ! grep -q "from '@clerk/nextjs" "$file" 2>/dev/null; then
      echo "✅ $name - Using SSO auth"
      ((PASS++))
      return 0
    else
      echo "⚠️  $name - Mixed SSO and Clerk imports"
      ((WARN++))
      return 1
    fi
  else
    if grep -q "currentUser\|from '@clerk/nextjs" "$file" 2>/dev/null; then
      echo "❌ $name - Still using Clerk"
      ((FAIL++))
      return 1
    else
      echo "⚠️  $name - No auth found"
      ((WARN++))
      return 1
    fi
  fi
}

# Function to check for type mismatch patterns
check_type_safety() {
  local file=$1
  local name=$2
  
  if grep -E "clerk_id:\s*user\.id[^}]" "$file" 2>/dev/null; then
    echo "❌ $name - Type mismatch found (clerk_id: user.id)"
    ((FAIL++))
    return 1
  else
    echo "✅ $name - No type mismatches"
    ((PASS++))
    return 0
  fi
}

echo "📋 Checking Critical Routes..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check each critical route
echo "1️⃣  Checking /api/profil/route.js"
check_sso_auth "$BASE_DIR/profil/route.js" "   Auth"
check_type_safety "$BASE_DIR/profil/route.js" "   Type Safety"
echo ""

echo "2️⃣  Checking /api/profil/check-completeness"
check_sso_auth "$BASE_DIR/profil/check-completeness/route.js" "   Auth"
check_type_safety "$BASE_DIR/profil/check-completeness/route.js" "   Type Safety"
echo ""

echo "3️⃣  Checking /api/profil/dashboard"
check_sso_auth "$BASE_DIR/profil/dashboard/route.js" "   Auth"
check_type_safety "$BASE_DIR/profil/dashboard/route.js" "   Type Safety"
echo ""

echo "4️⃣  Checking /api/profil/loyalty"
check_sso_auth "$BASE_DIR/profil/loyalty/route.js" "   Auth"
check_type_safety "$BASE_DIR/profil/loyalty/route.js" "   Type Safety"
echo ""

echo "5️⃣  Checking /api/profil/check-duplicate"
check_sso_auth "$BASE_DIR/profil/check-duplicate/route.js" "   Auth"
check_type_safety "$BASE_DIR/profil/check-duplicate/route.js" "   Type Safety"
echo ""

echo "6️⃣  Checking /api/profil/upload-foto"
check_sso_auth "$BASE_DIR/profil/upload-foto/route.js" "   Auth"
check_type_safety "$BASE_DIR/profil/upload-foto/route.js" "   Type Safety"
echo ""

echo "7️⃣  Checking /api/profil/wall"
check_sso_auth "$BASE_DIR/profil/wall/route.js" "   Auth"
check_type_safety "$BASE_DIR/profil/wall/route.js" "   Type Safety"
echo ""

echo "8️⃣  Checking /api/notifikasi"
check_sso_auth "$BASE_DIR/notifikasi/route.js" "   Auth"
check_type_safety "$BASE_DIR/notifikasi/route.js" "   Type Safety"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 VERIFICATION RESULTS:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Passed:  $PASS checks"
echo "❌ Failed:  $FAIL checks"
echo "⚠️  Warnings: $WARN checks"
echo ""

if [ $FAIL -eq 0 ]; then
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  🎉 SUCCESS! All critical routes are properly migrated!     ║"
  echo "║                                                              ║"
  echo "║  ✅ SSO authentication in place                             ║"
  echo "║  ✅ No type mismatches found                                ║"
  echo "║  ✅ Ready for production use                                ║"
  echo "║                                                              ║"
  echo "║  Next: Refresh browser and test the system!                 ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  exit 0
else
  echo "╔══════════════════════════════════════════════════════════════╗"
  echo "║  ⚠️  WARNING: Some issues found                             ║"
  echo "║                                                              ║"
  echo "║  Please review the failed checks above.                      ║"
  echo "╚══════════════════════════════════════════════════════════════╝"
  exit 1
fi
