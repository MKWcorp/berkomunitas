#!/usr/bin/env python3
"""
Debug script untuk menganalisis kenapa list tugas tidak muncul di admin panel.
Checks:
1. API endpoint response
2. Database query
3. User privileges
"""

import os
import sys
from pathlib import Path

def check_api_file():
    """Check API route file for potential issues."""
    print("=" * 80)
    print("CHECKING: /api/admin/tugas/route.js")
    print("=" * 80)
    print()
    
    api_file = Path(__file__).parent.parent / 'src/app/api/admin/tugas/route.js'
    
    if not api_file.exists():
        print("❌ File not found!")
        return
    
    with open(api_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # Check 1: Has getCurrentUser?
    if 'getCurrentUser' not in content:
        issues.append("❌ Missing getCurrentUser import/call")
    else:
        print("✅ Has getCurrentUser")
    
    # Check 2: Has admin privilege check?
    if 'user_privileges' not in content:
        issues.append("❌ Missing admin privilege check")
    elif 'member_id: user.id' not in content:
        issues.append("⚠️  Using wrong field for user_privileges (should be member_id)")
    else:
        print("✅ Has admin privilege check with member_id")
    
    # Check 3: Has prisma query?
    if 'prisma.tugas' not in content:
        issues.append("❌ Missing prisma.tugas query")
    else:
        print("✅ Has prisma.tugas query")
    
    # Check 4: Returns correct response?
    if 'NextResponse.json' not in content:
        issues.append("❌ Missing NextResponse.json")
    else:
        print("✅ Returns NextResponse.json")
    
    # Check 5: Has pagination?
    if 'page' not in content or 'limit' not in content:
        issues.append("⚠️  Missing pagination params")
    else:
        print("✅ Has pagination")
    
    print()
    if issues:
        print("⚠️  ISSUES FOUND:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("✅ API file looks good!")
    
    print()

def check_frontend_file():
    """Check frontend TasksTab file."""
    print("=" * 80)
    print("CHECKING: /admin/tabs/TasksTab.js")
    print("=" * 80)
    print()
    
    tab_file = Path(__file__).parent.parent / 'src/app/admin/tabs/TasksTab.js'
    
    if not tab_file.exists():
        print("❌ File not found!")
        return
    
    with open(tab_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    issues = []
    
    # Check 1: Has useSSOUser?
    if 'useSSOUser' not in content:
        issues.append("❌ Not using useSSOUser")
    else:
        print("✅ Using useSSOUser")
    
    # Check 2: Fetches from correct API?
    if '/api/admin/tugas' not in content:
        issues.append("❌ Not fetching from /api/admin/tugas")
    else:
        print("✅ Fetching from /api/admin/tugas")
    
    # Check 3: Has error handling?
    if 'catch' not in content:
        issues.append("⚠️  No error handling in fetch")
    else:
        print("✅ Has error handling")
    
    # Check 4: Sets items state?
    if 'setItems' not in content:
        issues.append("❌ Missing setItems")
    else:
        print("✅ Has setItems state")
    
    # Check 5: Has loading state?
    if 'setLoading' not in content:
        issues.append("⚠️  Missing loading state")
    else:
        print("✅ Has loading state")
    
    print()
    if issues:
        print("⚠️  ISSUES FOUND:")
        for issue in issues:
            print(f"   {issue}")
    else:
        print("✅ Frontend file looks good!")
    
    print()

def print_debug_tips():
    """Print debugging tips."""
    print("=" * 80)
    print("DEBUGGING TIPS")
    print("=" * 80)
    print()
    print("1. 🔍 Check Browser Console:")
    print("   - Open DevTools (F12)")
    print("   - Go to Console tab")
    print("   - Look for errors or failed API calls")
    print()
    print("2. 🌐 Check Network Tab:")
    print("   - Open DevTools Network tab")
    print("   - Reload /admin page")
    print("   - Look for /api/admin/tugas request")
    print("   - Check response status and data")
    print()
    print("3. 📊 Check Server Terminal:")
    print("   - Look for errors in Next.js dev server")
    print("   - Check for 401/403/500 errors")
    print("   - Look for Prisma errors")
    print()
    print("4. 🔐 Check Authentication:")
    print("   - Make sure you're logged in")
    print("   - Make sure your account has admin privilege")
    print("   - Check if SSO token is valid")
    print()
    print("5. 🗄️  Check Database:")
    print("   - Make sure tugas table has data")
    print("   - Check user_privileges table for admin entry")
    print("   - Verify member_id matches your user.id")
    print()
    print("6. 🧪 Test API Directly:")
    print("   Run: node scripts/test-admin-tugas-api.js")
    print()

def main():
    print()
    print("🔍 DEBUGGING: Admin Kelola Tugas - List tidak muncul")
    print()
    
    check_api_file()
    check_frontend_file()
    print_debug_tips()
    
    print("=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print()
    print("1. Open browser and go to: http://localhost:3000/admin")
    print("2. Open DevTools (F12) and check Console + Network tabs")
    print("3. Look at the terminal where Next.js is running")
    print("4. Share any error messages you see")
    print()

if __name__ == "__main__":
    main()
