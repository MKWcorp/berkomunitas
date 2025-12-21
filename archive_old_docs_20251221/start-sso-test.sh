#!/bin/bash
# SSO Quick Start Script

echo "🚀 Starting SSO Testing..."
echo ""
echo "📋 Pre-flight checks:"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules not found. Running npm install..."
  npm install
else
  echo "✅ node_modules found"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
  echo "❌ .env file not found!"
  echo "Please create .env with required variables:"
  echo "  - NEXT_PUBLIC_GOOGLE_CLIENT_ID"
  echo "  - GOOGLE_CLIENT_SECRET"
  echo "  - JWT_SECRET"
  echo "  - JWT_REFRESH_SECRET"
  echo "  - DATABASE_URL"
  exit 1
else
  echo "✅ .env file found"
fi

# Check if jose is installed
if ! npm list jose > /dev/null 2>&1; then
  echo "❌ jose package not found. Installing..."
  npm install jose
else
  echo "✅ jose package installed"
fi

echo ""
echo "✅ All checks passed!"
echo ""
echo "🚀 Starting development server..."
echo ""
echo "📖 Testing Instructions:"
echo "1. Open browser: http://localhost:3000"
echo "2. Click 'Login' button"
echo "3. Login with Google"
echo "4. Check terminal for middleware logs"
echo "5. Try accessing /profil"
echo ""
echo "📚 Full testing guide: See SSO_TESTING_GUIDE.md"
echo ""

# Start dev server
npm run dev
