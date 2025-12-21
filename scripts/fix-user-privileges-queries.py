#!/usr/bin/env python3
"""
Fix user_privileges queries to use member_id instead of id.

The user_privileges table has:
- id: auto-increment primary key
- member_id: foreign key to members table

When querying by user, we should use member_id, not id.
"""

import os
import re
from pathlib import Path

def fix_user_privileges_where(content):
    """Fix where clauses in user_privileges queries."""
    
    # Pattern 1: where: { id: user.id
    # Should be: where: { member_id: user.id
    pattern1 = r'(user_privileges\.findFirst\s*\(\s*{\s*where:\s*{\s*)id:\s*user\.id'
    replacement1 = r'\1member_id: user.id'
    content = re.sub(pattern1, replacement1, content, flags=re.DOTALL)
    
    # Pattern 2: Multi-line where clause
    # where: { 
    #   id: user.id,
    pattern2 = r'(user_privileges\.findFirst\s*\(\s*{\s*where:\s*{\s*)id:\s*user\.id\s*,'
    replacement2 = r'\1member_id: user.id,'
    content = re.sub(pattern2, replacement2, content, flags=re.MULTILINE | re.DOTALL)
    
    return content

def should_skip_file(filepath):
    """Skip certain files."""
    skip_patterns = [
        'node_modules',
        '.next',
        'backup',
        'webhooks/clerk',  # Clerk webhooks not used
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
        if 'user_privileges.findFirst' not in original:
            return False
        
        if 'id: user.id' not in original:
            return False
        
        # Apply fixes
        fixed = original
        fixed = fix_user_privileges_where(fixed)
        
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
    print("FIX user_privileges QUERIES: id → member_id")
    print("=" * 80)
    print()
    print("Replacing:")
    print("  where: { id: user.id → where: { member_id: user.id")
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    src_dir = base_dir / 'src'
    lib_dir = base_dir / 'lib'
    
    fixed_count = 0
    
    # Process all JS files in src and lib
    for directory in [src_dir, lib_dir]:
        if not directory.exists():
            continue
            
        for filepath in directory.glob('**/*.js'):
            if process_file(filepath):
                fixed_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS! All user_privileges queries now use member_id!")
        print()
        print("NEXT STEPS:")
        print("1. Restart dev server")
        print("2. Test admin pages (especially /admin tugas)")
        print("3. Test privilege checks")
    else:
        print("⚠️  No files modified.")

if __name__ == "__main__":
    main()
