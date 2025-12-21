#!/usr/bin/env python3
"""
Bulk Fix Clerk auth() to SSO getCurrentUser()
Fixes all API routes that still use Clerk authentication
"""

import os
import re
from pathlib import Path

# Files to fix (from grep results)
FILES_TO_FIX = [
    "src/app/api/user-privileges/route.js",
    "src/app/api/task-submissions/timeout/route.js",
    "src/app/api/task-submissions/route.js",
    "src/app/api/rewards/redeem/route.js",
    "src/app/api/reward-categories/route.js",
    "src/app/api/profil/rewards-history/route.js",
    "src/app/api/profil/rewards-history/[id]/confirm/route.js",
    "src/app/api/privileges/route.js",
    "src/app/api/plus/verified-data/route.js",
    "src/app/api/members/current/route.js",
    "src/app/api/debug/admin/route.js",
    "src/app/api/debug/profile-data/route.js",
    "src/app/api/debug/loyalty/route.js",
    "src/app/api/debug-db/route.js",
]

BASE_DIR = Path("c:/Users/Admin/Documents/berkomunitas")

def fix_file(filepath):
    """Fix a single file"""
    full_path = BASE_DIR / filepath
    
    if not full_path.exists():
        print(f"⚠️  Skipping {filepath} - File not found")
        return False
    
    print(f"\n📝 Processing: {filepath}")
    
    try:
        # Read file
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        changes_made = []
        
        # 1. Replace Clerk imports
        if "import { auth" in content or "import { currentUser" in content:
            # Remove Clerk imports
            content = re.sub(
                r"import\s+{\s*auth(?:,\s*currentUser)?\s*}\s+from\s+['\"]@clerk/nextjs/server['\"];?\s*\n?",
                "",
                content
            )
            content = re.sub(
                r"import\s+{\s*currentUser(?:,\s*auth)?\s*}\s+from\s+['\"]@clerk/nextjs/server['\"];?\s*\n?",
                "",
                content
            )
            changes_made.append("Removed Clerk imports")
        
        # 2. Add SSO import if not present
        if "getCurrentUser" not in content:
            # Find the first import statement
            import_match = re.search(r"^import\s+.*?;?\s*$", content, re.MULTILINE)
            if import_match:
                insert_pos = import_match.end()
                content = (
                    content[:insert_pos] + 
                    "\nimport { getCurrentUser } from '@/lib/ssoAuth';" +
                    content[insert_pos:]
                )
                changes_made.append("Added SSO import")
        
        # 3. Replace await auth() patterns
        
        # Pattern 1: const { userId } = await auth();
        if "const { userId } = await auth()" in content:
            content = re.sub(
                r"const\s+{\s*userId\s*}\s*=\s*await\s+auth\(\);",
                "const user = await getCurrentUser(request);",
                content
            )
            changes_made.append("Replaced: { userId } = await auth()")
        
        # Pattern 2: const user = await currentUser();
        if "await currentUser()" in content:
            content = re.sub(
                r"const\s+(\w+)\s*=\s*await\s+currentUser\(\);",
                r"const \1 = await getCurrentUser(request);",
                content
            )
            changes_made.append("Replaced: await currentUser()")
        
        # 4. Replace userId checks with user checks
        if "if (!userId)" in content:
            content = re.sub(
                r"if\s*\(\s*!userId\s*\)",
                "if (!user)",
                content
            )
            changes_made.append("Replaced: !userId checks")
        
        # 5. Replace clerk_id: userId with member lookup
        if "clerk_id: userId" in content:
            # This is more complex, needs context-aware replacement
            # For now, just flag it
            changes_made.append("⚠️  Found clerk_id: userId - needs manual review")
        
        # 6. Add function parameter if missing
        # Check if function has 'request' parameter
        function_patterns = [
            r"export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(\s*\)",
            r"async\s+function\s+\w+\s*\(\s*\)"
        ]
        
        for pattern in function_patterns:
            if re.search(pattern, content):
                content = re.sub(
                    pattern,
                    lambda m: m.group(0).replace("()", "(request)"),
                    content
                )
                changes_made.append("Added 'request' parameter to function")
        
        # Write back if changes were made
        if content != original_content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"✅ Fixed: {filepath}")
            for change in changes_made:
                print(f"   - {change}")
            return True
        else:
            print(f"ℹ️  No changes needed: {filepath}")
            return False
            
    except Exception as e:
        print(f"❌ Error processing {filepath}: {e}")
        return False

def main():
    print("="*80)
    print("🔧 BULK FIX: Clerk auth() → SSO getCurrentUser()")
    print("="*80)
    print(f"\nTotal files to process: {len(FILES_TO_FIX)}\n")
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for filepath in FILES_TO_FIX:
        try:
            if fix_file(filepath):
                fixed_count += 1
            else:
                skipped_count += 1
        except Exception as e:
            print(f"❌ Failed: {filepath} - {e}")
            error_count += 1
    
    print("\n" + "="*80)
    print("📊 SUMMARY")
    print("="*80)
    print(f"✅ Fixed: {fixed_count} files")
    print(f"ℹ️  Skipped: {skipped_count} files")
    print(f"❌ Errors: {error_count} files")
    print(f"📝 Total: {len(FILES_TO_FIX)} files")
    print("\n" + "="*80)
    print("\n⚠️  IMPORTANT: Manual review needed for:")
    print("   1. clerk_id: userId references")
    print("   2. Complex authentication logic")
    print("   3. Member lookup patterns")
    print("\n📝 Next steps:")
    print("   1. Review changed files")
    print("   2. Add member lookup logic where needed")
    print("   3. Test each API endpoint")
    print("   4. Run: npm run dev")
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()
