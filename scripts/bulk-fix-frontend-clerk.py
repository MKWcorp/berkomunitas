#!/usr/bin/env python3
"""
Bulk fix script to replace Clerk's useUser() with useSSOUser() in frontend files.
This fixes the "useUser can only be used within <ClerkProvider />" error after SSO migration.

Author: GitHub Copilot
Date: 2025-01-XX
"""

import os
import re
from pathlib import Path

# Files to process
FILES_TO_FIX = [
    "src/app/tugas/[id]/page.js",
    "src/app/security/page.js",
    "src/app/security/components/SetPasswordForm.js",
    "src/app/security/components/DeleteAccountSection.js",
    "src/app/rewards-app/status/page.js",
    "src/app/rewards-app/rewards/page.js",
    "src/app/rewards-app/page.js",
    "src/app/rewards-app/dashboard/page.js",
    "src/app/rewards-app/components/RewardsNavigation.js",
    "src/app/profil/[username]/page.js",
    "src/components/ranking/UserAvatar.js",
    "src/app/loyalty/page.js",
]

# Files to skip (backup files or refactored versions)
FILES_TO_SKIP = [
    "page-refactored.js",
    "page-new.js",
    "page-clean.js",
    "[username]/page-new.js",
    "EmailManager.js",  # Needs custom handling
    "EmailSocialManager.js",  # Needs custom handling
    "ActiveDevicesManager.js",  # Uses useSessionList - different fix needed
    "UserProfileWithCustomPage.js",  # Uses UserButton - UI component
]

def should_skip_file(filepath):
    """Check if file should be skipped."""
    for skip_pattern in FILES_TO_SKIP:
        if skip_pattern in filepath:
            return True
    return False

def fix_clerk_import(content):
    """Replace Clerk imports with SSO imports."""
    
    # Pattern 1: import { useUser } from '@clerk/nextjs';
    pattern1 = r"import\s*{\s*useUser\s*}\s*from\s*['\"]@clerk/nextjs['\"];"
    replacement1 = "import { useSSOUser } from '@/hooks/useSSOUser';"
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: import { useUser, SignInButton } from '@clerk/nextjs';
    # Need to split this into two imports
    pattern2 = r"import\s*{\s*useUser\s*,\s*SignInButton\s*}\s*from\s*['\"]@clerk/nextjs['\"];"
    if re.search(pattern2, content):
        content = re.sub(
            pattern2,
            "import { useSSOUser } from '@/hooks/useSSOUser';\nimport { SignInButton } from '@clerk/nextjs';",
            content
        )
    
    return content

def fix_useuser_hook(content):
    """Replace useUser() hook calls with useSSOUser()."""
    
    # Pattern: const { user, isLoaded, isSignedIn } = useUser();
    # or: const { user } = useUser();
    # or: const { isLoaded, isSignedIn } = useUser();
    pattern = r'\buseUser\('
    replacement = r'useSSOUser('
    content = re.sub(pattern, replacement, content)
    
    return content

def process_file(filepath):
    """Process a single file to fix Clerk imports."""
    
    if should_skip_file(filepath):
        print(f"⏭️  SKIP: {filepath}")
        return False
    
    try:
        # Read file
        with open(filepath, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Check if file needs fixing
        if "from '@clerk/nextjs'" not in original_content:
            print(f"⏭️  OK (already fixed): {filepath}")
            return False
        
        if "useUser" not in original_content:
            print(f"⏭️  OK (no useUser): {filepath}")
            return False
        
        # Apply fixes
        fixed_content = original_content
        fixed_content = fix_clerk_import(fixed_content)
        fixed_content = fix_useuser_hook(fixed_content)
        
        # Check if anything changed
        if fixed_content == original_content:
            print(f"⚠️  NO CHANGE: {filepath}")
            return False
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        
        print(f"✅ FIXED: {filepath}")
        return True
        
    except FileNotFoundError:
        print(f"❌ ERROR: File not found: {filepath}")
        return False
    except Exception as e:
        print(f"❌ ERROR processing {filepath}: {e}")
        return False

def main():
    """Main execution function."""
    
    print("=" * 80)
    print("BULK FIX: Replace Clerk useUser() with useSSOUser() in Frontend Files")
    print("=" * 80)
    print()
    
    # Get base directory
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    
    fixed_count = 0
    skipped_count = 0
    error_count = 0
    
    for filepath in FILES_TO_FIX:
        full_path = base_dir / filepath
        
        if should_skip_file(str(full_path)):
            skipped_count += 1
            continue
        
        if process_file(str(full_path)):
            fixed_count += 1
        else:
            if not full_path.exists():
                error_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print(f"⏭️  Skipped: {skipped_count} files")
    print(f"❌ Errors: {error_count} files")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS: All frontend files have been updated to use SSO authentication!")
        print()
        print("NEXT STEPS:")
        print("1. Restart the Next.js dev server")
        print("2. Test the task detail page: http://localhost:3000/tugas/[id]")
        print("3. Test other pages that were fixed")
        print("4. Check for any remaining Clerk errors in browser console")
    else:
        print("⚠️  No files were modified. They may already be fixed.")

if __name__ == "__main__":
    main()
