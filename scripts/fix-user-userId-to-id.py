#!/usr/bin/env python3
"""
Fix user.userId to user.id in SSO migration
After getCurrentUser() or getUserFromRequest(), the user object has:
- user.id (member ID in database)
- user.email
- user.google_id
NOT user.userId!
"""

import os
import re
from pathlib import Path

def fix_user_userid_references(content, filepath):
    """
    Fix all user.userId references to use correct properties.
    
    After SSO migration:
    - getCurrentUser() returns { id, email, google_id, ... }
    - getUserFromRequest() returns { userId: user.id, email, ... }
    
    Common patterns to fix:
    1. where: { google_id: user.userId } → where: { id: user.id }
    2. where: { clerk_id: user.userId } → where: { id: user.id }
    3. google_id: user.userId → google_id: user.google_id (in create/update)
    """
    
    changes = []
    original = content
    
    # Pattern 1: where: { google_id: user.userId } → where: { id: user.id }
    # This is the most efficient - use member ID directly
    pattern1 = r'where:\s*\{\s*google_id:\s*user\.userId\s*\}'
    if re.search(pattern1, content):
        content = re.sub(pattern1, 'where: { id: user.id }', content)
        changes.append("where: { google_id: user.userId } → where: { id: user.id }")
    
    # Pattern 2: where: { clerk_id: user.userId } → where: { id: user.id }
    pattern2 = r'where:\s*\{\s*clerk_id:\s*user\.userId\s*\}'
    if re.search(pattern2, content):
        content = re.sub(pattern2, 'where: { id: user.id }', content)
        changes.append("where: { clerk_id: user.userId } → where: { id: user.id }")
    
    # Pattern 3: More complex where with google_id: user.userId
    pattern3 = r'(where:\s*\{[^}]*?)google_id:\s*user\.userId([^}]*?\})'
    if re.search(pattern3, content):
        content = re.sub(pattern3, r'\1id: user.id\2', content)
        changes.append("Complex where: google_id: user.userId → id: user.id")
    
    # Pattern 4: More complex where with clerk_id: user.userId  
    pattern4 = r'(where:\s*\{[^}]*?)clerk_id:\s*user\.userId([^}]*?\})'
    if re.search(pattern4, content):
        content = re.sub(pattern4, r'\1id: user.id\2', content)
        changes.append("Complex where: clerk_id: user.userId → id: user.id")
    
    # Pattern 5: In data/create: google_id: user.userId → google_id: user.google_id
    pattern5 = r'(data:\s*\{[^}]*?)google_id:\s*user\.userId([^}]*?\})'
    if re.search(pattern5, content):
        content = re.sub(pattern5, r'\1google_id: user.google_id\2', content)
        changes.append("data: { google_id: user.userId } → google_id: user.google_id")
    
    # Pattern 6: Simple assignment: google_id: user.userId (without context)
    # Be careful with this one - only in create/update contexts
    if 'create:' in content or 'update:' in content or 'data:' in content:
        pattern6 = r'google_id:\s*user\.userId(?![.\w])'
        if re.search(pattern6, content):
            content = re.sub(pattern6, 'google_id: user.google_id', content)
            changes.append("google_id: user.userId → google_id: user.google_id")
    
    # Pattern 7: member_id: user.userId in various contexts
    pattern7 = r'member_id:\s*user\.userId(?![.\w])'
    if re.search(pattern7, content):
        content = re.sub(pattern7, 'member_id: user.id', content)
        changes.append("member_id: user.userId → member_id: user.id")
    
    # Pattern 8: memberId: user.userId
    pattern8 = r'memberId:\s*user\.userId(?![.\w])'
    if re.search(pattern8, content):
        content = re.sub(pattern8, 'memberId: user.id', content)
        changes.append("memberId: user.userId → memberId: user.id")
    
    return content, changes

def process_file(filepath):
    """Process a single file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Skip if doesn't have user.userId
        if 'user.userId' not in content:
            return None
        
        # Apply fixes
        new_content, changes = fix_user_userid_references(content, filepath)
        
        if new_content == content:
            return None
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        return changes
        
    except Exception as e:
        print(f"❌ ERROR: {filepath}: {e}")
        return None

def main():
    """Main function."""
    print("=" * 80)
    print("FIX: user.userId → user.id in SSO Migration")
    print("=" * 80)
    print()
    
    base_dir = Path(__file__).parent.parent
    
    # Target directories
    targets = [
        base_dir / 'src' / 'app' / 'api',
        base_dir / 'src' / 'lib',
        base_dir / 'lib',
    ]
    
    files_to_process = []
    for target in targets:
        if target.exists():
            files_to_process.extend(target.rglob('*.js'))
    
    print(f"📁 Scanning {len(files_to_process)} files...")
    print()
    
    modified = []
    
    for filepath in files_to_process:
        changes = process_file(filepath)
        if changes:
            modified.append((filepath, changes))
            rel_path = filepath.relative_to(base_dir)
            print(f"✅ {rel_path}")
            for change in changes:
                print(f"   → {change}")
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"📁 Files scanned: {len(files_to_process)}")
    print(f"✅ Files modified: {len(modified)}")
    print()
    
    if modified:
        print("✅ SUCCESS! Fixed user.userId references.")
        print()
        print("CHANGES:")
        for filepath, changes in modified:
            rel_path = filepath.relative_to(base_dir)
            print(f"  • {rel_path}")
            for change in changes:
                print(f"    - {change}")
        print()
        print("NEXT STEPS:")
        print("1. Restart Next.js dev server")
        print("2. Test affected API endpoints")
        print("3. Check for any remaining errors")
    else:
        print("ℹ️  No files needed modification")

if __name__ == '__main__':
    main()
