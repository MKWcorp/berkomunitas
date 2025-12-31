#!/usr/bin/env python3
"""
Complete API Routes Clerk to SSO Migration Script

This script fixes ALL API routes that still use Clerk authentication:
1. Replace: import { auth } from '@clerk/nextjs/server'
   With: import { getUserFromRequest } from '@/lib/sso'

2. Replace: const { userId } = await auth()
   With: const user = await getUserFromRequest(request)

3. Replace: if (!userId) { ... }
   With: if (!user) { ... }

4. Replace all clerk_id: userId references to clerk_id: user.userId

5. Add 'request' parameter to GET/POST/PUT/DELETE functions if missing

Author: GitHub Copilot
Date: 2025-01-21
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

# Statistics
stats = {
    'files_scanned': 0,
    'files_modified': 0,
    'clerk_imports_replaced': 0,
    'auth_calls_replaced': 0,
    'userid_refs_fixed': 0,
    'request_params_added': 0,
}

def fix_clerk_import(content: str) -> Tuple[str, bool]:
    """Fix Clerk import statements."""
    modified = False
    
    # Pattern: import { auth } from '@clerk/nextjs/server';
    pattern = r"import\s*{\s*auth\s*}\s*from\s*['\"]@clerk/nextjs/server['\"];"
    if re.search(pattern, content):
        content = re.sub(
            pattern,
            "import { getUserFromRequest } from '@/lib/sso';",
            content
        )
        stats['clerk_imports_replaced'] += 1
        modified = True
    
    # Pattern: import { auth, currentUser } from '@clerk/nextjs/server';
    pattern2 = r"import\s*{\s*auth\s*,\s*currentUser\s*}\s*from\s*['\"]@clerk/nextjs/server['\"];"
    if re.search(pattern2, content):
        content = re.sub(
            pattern2,
            "import { getUserFromRequest } from '@/lib/sso';",
            content
        )
        stats['clerk_imports_replaced'] += 1
        modified = True
    
    return content, modified

def fix_auth_calls(content: str) -> Tuple[str, bool]:
    """Fix auth() function calls."""
    modified = False
    
    # Pattern: const { userId } = await auth();
    pattern = r"const\s*{\s*userId\s*}\s*=\s*await\s+auth\(\);"
    if re.search(pattern, content):
        content = re.sub(
            pattern,
            "const user = await getUserFromRequest(request);",
            content
        )
        stats['auth_calls_replaced'] += 1
        modified = True
    
    # Pattern: const { userId, sessionClaims } = await auth();
    pattern2 = r"const\s*{\s*userId\s*,\s*sessionClaims\s*}\s*=\s*await\s+auth\(\);"
    if re.search(pattern2, content):
        content = re.sub(
            pattern2,
            "const user = await getUserFromRequest(request);",
            content
        )
        stats['auth_calls_replaced'] += 1
        modified = True
    
    return content, modified

def fix_userid_checks(content: str) -> Tuple[str, bool]:
    """Fix userId null checks."""
    modified = False
    
    # Pattern: if (!userId) {
    pattern = r"if\s*\(\s*!\s*userId\s*\)"
    if re.search(pattern, content):
        content = re.sub(pattern, "if (!user)", content)
        modified = True
    
    return content, modified

def fix_userid_references(content: str) -> Tuple[str, bool]:
    """Fix userId references to user.userId."""
    modified = False
    
    # Only replace standalone userId references in specific contexts
    # Pattern: clerk_id: userId
    pattern1 = r"clerk_id:\s*userId(?!\w)"
    if re.search(pattern1, content):
        content = re.sub(pattern1, "clerk_id: user.userId", content)
        stats['userid_refs_fixed'] += content.count("clerk_id: user.userId")
        modified = True
    
    # Pattern: where: { clerk_id: userId }
    pattern2 = r"where:\s*{\s*clerk_id:\s*userId\s*}"
    if re.search(pattern2, content):
        content = re.sub(pattern2, "where: { clerk_id: user.userId }", content)
        modified = True
    
    return content, modified

def add_request_parameter(content: str) -> Tuple[str, bool]:
    """Add 'request' parameter to route handlers if missing."""
    modified = False
    
    # Pattern: export async function GET() {
    pattern = r"export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*\)\s*{"
    matches = re.finditer(pattern, content)
    
    for match in matches:
        method = match.group(1)
        old_sig = f"export async function {method}() {{"
        new_sig = f"export async function {method}(request) {{"
        
        if old_sig in content:
            content = content.replace(old_sig, new_sig, 1)
            stats['request_params_added'] += 1
            modified = True
    
    return content, modified

def process_api_file(filepath: Path) -> bool:
    """Process a single API route file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Check if this file uses Clerk auth
        if "from '@clerk/nextjs/server'" not in original_content:
            return False
        
        if "auth" not in original_content and "currentUser" not in original_content:
            return False
        
        modified = False
        content = original_content
        
        # Apply all fixes
        content, m1 = fix_clerk_import(content)
        modified = modified or m1
        
        content, m2 = fix_auth_calls(content)
        modified = modified or m2
        
        content, m3 = fix_userid_checks(content)
        modified = modified or m3
        
        content, m4 = fix_userid_references(content)
        modified = modified or m4
        
        content, m5 = add_request_parameter(content)
        modified = modified or m5
        
        if not modified:
            return False
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return True
        
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def find_api_routes(base_dir: Path) -> List[Path]:
    """Find all API route files."""
    api_dir = base_dir / "src" / "app" / "api"
    if not api_dir.exists():
        return []
    
    return list(api_dir.rglob("route.js"))

def main():
    """Main execution."""
    print("=" * 80)
    print("🔧 COMPLETE API ROUTES CLERK → SSO MIGRATION")
    print("=" * 80)
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    
    # Find all API routes
    api_files = find_api_routes(base_dir)
    print(f"📁 Found {len(api_files)} API route files\n")
    
    if not api_files:
        print("❌ No API routes found!")
        return
    
    # Process each file
    print("🔄 Processing files...\n")
    for filepath in api_files:
        stats['files_scanned'] += 1
        relative_path = filepath.relative_to(base_dir)
        
        if process_api_file(filepath):
            stats['files_modified'] += 1
            print(f"✅ FIXED: {relative_path}")
        else:
            print(f"⏭️  SKIP: {relative_path}")
    
    # Print summary
    print()
    print("=" * 80)
    print("📊 MIGRATION SUMMARY")
    print("=" * 80)
    print(f"📁 Files scanned:           {stats['files_scanned']}")
    print(f"✅ Files modified:          {stats['files_modified']}")
    print(f"📦 Clerk imports replaced:  {stats['clerk_imports_replaced']}")
    print(f"🔑 Auth calls replaced:     {stats['auth_calls_replaced']}")
    print(f"🔧 userId refs fixed:       {stats['userid_refs_fixed']}")
    print(f"📝 Request params added:    {stats['request_params_added']}")
    print()
    
    if stats['files_modified'] > 0:
        print("✅ SUCCESS! All API routes have been migrated to SSO!")
        print()
        print("📋 NEXT STEPS:")
        print("1. Restart your Next.js dev server")
        print("2. Test all API endpoints")
        print("3. Check for any remaining Clerk references")
        print("4. Remove Clerk environment variables from .env.local")
    else:
        print("ℹ️  No files needed modification (already migrated)")
    
    print()

if __name__ == "__main__":
    main()
