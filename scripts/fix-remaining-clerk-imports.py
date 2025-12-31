#!/usr/bin/env python3
"""
Fix remaining Clerk imports in API routes.
Replaces currentUser() from Clerk with getCurrentUser() from SSO.
"""

import os
import re
from pathlib import Path

# Files to fix (from grep results)
FILES_TO_FIX = [
    "src/app/api/profil/sosial-media/[id]/route.js",
    "src/app/api/profil/sosial-media/check-availability/route.js",
    "src/app/api/profil/merge-account/route.js",
    "src/app/api/leaderboard/route.js",
    "src/app/api/debug-privileges/route.js",
    "src/app/api/events/[setting_name]/route.js",
    "src/app/api/beauty-consultant/verified/route.js",
    "src/app/api/admin/tugas/stats/route.js",
    "src/app/api/beauty-consultant/debug/route.js",
]

# Skip these - they are migration/fix scripts, not production code
FILES_TO_SKIP = [
    "route-old.js",
    "route-new.js",
    "fix-missing-emails/route.js",
    "backfill-clerk-ids/route.js",
]

def should_skip(filepath):
    """Check if file should be skipped."""
    for skip_pattern in FILES_TO_SKIP:
        if skip_pattern in filepath:
            return True
    return False

def fix_clerk_import(content):
    """Replace Clerk imports with SSO imports."""
    
    # Pattern: import { currentUser } from '@clerk/nextjs/server';
    pattern = r"import\s*{\s*currentUser\s*}\s*from\s*['\"]@clerk/nextjs/server['\"];"
    replacement = "import { getCurrentUser } from '@/lib/ssoAuth';"
    content = re.sub(pattern, replacement, content)
    
    return content

def fix_currentuser_calls(content):
    """Replace currentUser() calls with getCurrentUser(request)."""
    
    # Pattern 1: const user = await currentUser();
    # Need to add request parameter
    pattern1 = r'const\s+user\s*=\s*await\s+currentUser\(\s*\);'
    replacement1 = 'const user = await getCurrentUser(request);'
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: const clerkUser = await currentUser();
    pattern2 = r'const\s+clerkUser\s*=\s*await\s+currentUser\(\s*\);'
    replacement2 = 'const user = await getCurrentUser(request);'
    content = re.sub(pattern2, replacement2, content)
    
    # Pattern 3: Any other variable = await currentUser()
    pattern3 = r'await\s+currentUser\(\s*\)'
    replacement3 = 'await getCurrentUser(request)'
    content = re.sub(pattern3, replacement3, content)
    
    return content

def fix_user_checks(content):
    """Fix user existence checks."""
    
    # if (!user) instead of if (!clerkUser)
    content = re.sub(r'\bclerkUser\b', 'user', content)
    
    return content

def add_request_param(content):
    """Ensure GET/POST functions have request parameter."""
    
    # Pattern: export async function GET() {
    # Should be: export async function GET(request) {
    content = re.sub(
        r'export\s+async\s+function\s+(GET|POST|PUT|DELETE)\s*\(\s*\)\s*{',
        r'export async function \1(request) {',
        content
    )
    
    return content

def process_file(filepath):
    """Process a single file."""
    
    if should_skip(filepath):
        print(f"⏭️  SKIP: {filepath}")
        return False
    
    if not os.path.exists(filepath):
        print(f"❌ NOT FOUND: {filepath}")
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        # Check if needs fixing
        if "from '@clerk/nextjs" not in original and "from \"@clerk/nextjs" not in original:
            print(f"⏭️  OK (no Clerk): {filepath}")
            return False
        
        # Apply fixes
        fixed = original
        fixed = fix_clerk_import(fixed)
        fixed = fix_currentuser_calls(fixed)
        fixed = fix_user_checks(fixed)
        fixed = add_request_param(fixed)
        
        if fixed == original:
            print(f"⚠️  NO CHANGE: {filepath}")
            return False
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed)
        
        print(f"✅ FIXED: {filepath}")
        return True
        
    except Exception as e:
        print(f"❌ ERROR: {filepath}: {e}")
        return False

def main():
    print("=" * 80)
    print("FIX REMAINING CLERK IMPORTS IN API ROUTES")
    print("=" * 80)
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    
    fixed = 0
    skipped = 0
    errors = 0
    
    for filepath in FILES_TO_FIX:
        full_path = base_dir / filepath
        
        if should_skip(str(full_path)):
            skipped += 1
            continue
        
        if process_file(str(full_path)):
            fixed += 1
        elif not full_path.exists():
            errors += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed}")
    print(f"⏭️  Skipped: {skipped}")
    print(f"❌ Errors: {errors}")
    print()
    
    if fixed > 0:
        print("✅ SUCCESS! All remaining Clerk imports have been replaced with SSO!")

if __name__ == "__main__":
    main()
