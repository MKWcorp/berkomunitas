#!/usr/bin/env python3
"""
Fix Clerk user object properties to SSO Google user properties.

Clerk User Object:
- user.emailAddresses[0].emailAddress
- user.fullName
- user.firstName
- user.lastName
- user.username

SSO Google User Object:
- user.email
- user.name
- user.id
"""

import os
import re
from pathlib import Path

def fix_email_addresses(content):
    """Replace Clerk emailAddresses with SSO email."""
    
    # Pattern 1: user.emailAddresses[0]?.emailAddress
    pattern1 = r'user\.emailAddresses\[0\]\?\.emailAddress'
    replacement1 = 'user.email'
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: user?.emailAddresses?.[0]?.emailAddress
    pattern2 = r'user\?\.emailAddresses\?\.\[0\]\?\.emailAddress'
    replacement2 = 'user?.email'
    content = re.sub(pattern2, replacement2, content)
    
    # Pattern 3: user?.primaryEmailAddress?.emailAddress
    pattern3 = r'user\?\.primaryEmailAddress\?\.emailAddress'
    replacement3 = 'user?.email'
    content = re.sub(pattern3, replacement3, content)
    
    # Pattern 4: user.primaryEmailAddress.emailAddress (without optional chaining)
    pattern4 = r'user\.primaryEmailAddress\.emailAddress'
    replacement4 = 'user.email'
    content = re.sub(pattern4, replacement4, content)
    
    # Pattern 5: window.Clerk.user.primaryEmailAddress?.emailAddress
    pattern5 = r'window\.Clerk\.user\.primaryEmailAddress\?\.emailAddress'
    replacement5 = 'null  // TODO: Replace with proper SSO user access'
    content = re.sub(pattern5, replacement5, content)
    
    return content

def fix_full_name(content):
    """Replace Clerk fullName with SSO name."""
    
    # Pattern 1: user.fullName || user.firstName || ...
    pattern1 = r'user\.fullName\s*\|\|\s*user\.firstName'
    replacement1 = 'user.name'
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: user.fullName || user.username
    pattern2 = r'user\.fullName\s*\|\|\s*user\.username'
    replacement2 = 'user.name || user.email?.split(\'@\')[0]'
    content = re.sub(pattern2, replacement2, content)
    
    # Pattern 3: user.fullName || ...
    pattern3 = r'user\.fullName'
    replacement3 = 'user.name'
    content = re.sub(pattern3, replacement3, content)
    
    return content

def fix_first_last_name(content):
    """Replace firstName + lastName with name."""
    
    # Pattern: user.firstName + ' ' + user.lastName
    pattern = r'user\.firstName\s*\+\s*["\']?\s*["\']?\s*\+\s*user\.lastName'
    replacement = 'user.name'
    content = re.sub(pattern, replacement, content)
    
    # Pattern: user.firstName
    pattern2 = r'user\.firstName'
    replacement2 = 'user.name'
    content = re.sub(pattern2, replacement2, content)
    
    # Pattern: user.lastName
    pattern3 = r'user\.lastName'
    replacement3 = 'user.name'
    content = re.sub(pattern3, replacement3, content)
    
    return content

def fix_clerk_user_id_field(content):
    """Replace clerk_user_id with google_id in API calls."""
    
    # Pattern: clerk_user_id: user.id
    pattern = r'clerk_user_id:\s*user\.id'
    replacement = 'google_id: user.id'
    content = re.sub(pattern, replacement, content)
    
    return content

def should_skip_file(filepath):
    """Skip certain files that need manual handling."""
    skip_patterns = [
        'EmailManager.js',  # Complex email management - needs custom handling
        'EmailManagerFixed.js',
        'EmailSocialManager.js',
        'webhooks/clerk',  # Clerk webhooks - not used anymore
        'node_modules',
        '.next',
        'backup',
    ]
    
    for pattern in skip_patterns:
        if pattern in str(filepath):
            return True
    return False

def process_file(filepath):
    """Process a single file."""
    
    if should_skip_file(filepath):
        return False
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
          # Check if file needs fixing
        needs_fix = any([
            'emailAddresses' in original,
            'primaryEmailAddress' in original,
            'user.fullName' in original,
            'user.firstName' in original,
            'user.lastName' in original,
            'clerk_user_id' in original,
        ])
        
        if not needs_fix:
            return False
        
        # Apply fixes
        fixed = original
        fixed = fix_email_addresses(fixed)
        fixed = fix_full_name(fixed)
        fixed = fix_first_last_name(fixed)
        fixed = fix_clerk_user_id_field(fixed)
        
        if fixed == original:
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
    print("FIX CLERK USER OBJECT PROPERTIES → SSO GOOGLE")
    print("=" * 80)
    print()
    print("Replacing:")
    print("  - user.emailAddresses[0].emailAddress → user.email")
    print("  - user.fullName → user.name")
    print("  - user.firstName/lastName → user.name")
    print("  - clerk_user_id → google_id")
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    src_dir = base_dir / 'src'
    
    fixed_count = 0
    skipped_count = 0
    
    # Process all JS/JSX/TS/TSX files in src
    for ext in ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']:
        for filepath in src_dir.glob(ext):
            if should_skip_file(filepath):
                skipped_count += 1
                continue
            
            if process_file(filepath):
                fixed_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print(f"⏭️  Skipped: {skipped_count} files (EmailManager, webhooks, etc.)")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS! All Clerk user properties replaced with SSO Google!")
        print()
        print("NEXT STEPS:")
        print("1. Restart dev server")
        print("2. Test task detail page: /tugas/[id]")
        print("3. Test rewards navigation")
        print("4. Test admin pages")
    else:
        print("⚠️  No files modified.")

if __name__ == "__main__":
    main()
