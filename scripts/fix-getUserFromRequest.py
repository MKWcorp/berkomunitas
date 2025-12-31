#!/usr/bin/env python3
"""
Fix getUserFromRequest → getCurrentUser
Also fix _request parameter to request
"""

import os
import re
from pathlib import Path

def fix_import(content):
    """Replace getUserFromRequest import with getCurrentUser."""
    
    # Pattern: import { getUserFromRequest } from '@/lib/sso';
    pattern = r"import\s*{\s*getUserFromRequest\s*}\s*from\s*['\"]@/lib/sso['\"];"
    replacement = "import { getCurrentUser } from '@/lib/ssoAuth';"
    content = re.sub(pattern, replacement, content)
    
    return content

def fix_function_calls(content):
    """Replace getUserFromRequest() calls with getCurrentUser()."""
    
    pattern = r'\bgetUserFromRequest\('
    replacement = 'getCurrentUser('
    content = re.sub(pattern, replacement, content)
    
    return content

def fix_underscore_request(content):
    """Replace _request parameter with request."""
    
    # Pattern: export async function GET(_request)
    pattern = r'export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\(\s*_request\s*\)'
    replacement = r'export async function \1(request)'
    content = re.sub(pattern, replacement, content)
    
    return content

def process_file(filepath):
    """Process a single file."""
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        # Check if needs fixing
        needs_fix = (
            'getUserFromRequest' in original or
            'function GET(_request)' in original or
            'function POST(_request)' in original
        )
        
        if not needs_fix:
            return False
        
        # Apply fixes
        fixed = original
        fixed = fix_import(fixed)
        fixed = fix_function_calls(fixed)
        fixed = fix_underscore_request(fixed)
        
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
    print("FIX getUserFromRequest → getCurrentUser")
    print("=" * 80)
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    src_dir = base_dir / 'src'
    
    fixed_count = 0
    
    # Process all JS files in src/app/api
    for filepath in src_dir.glob('**/*.js'):
        if process_file(filepath):
            fixed_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS! All getUserFromRequest replaced with getCurrentUser!")

if __name__ == "__main__":
    main()
