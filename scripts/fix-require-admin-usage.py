#!/usr/bin/env python3
"""
Fix requireAdmin usage pattern.
OLD: if (!await requireAdmin(request))
NEW: const authCheck = await requireAdmin(request); if (!authCheck.success)
"""

import os
import re
from pathlib import Path

def fix_require_admin_usage(content, filename):
    """Fix requireAdmin usage to properly check .success property."""
    
    # Pattern 1: Simple if check in one line
    # if (!await requireAdmin(request)) return NextResponse...
    pattern1 = r'if\s*\(\s*!\s*await\s+requireAdmin\(([^)]+)\)\s*\)\s+return\s+NextResponse\.json\(\s*{\s*error:\s*["\']([^"\']+)["\']\s*}\s*,\s*{\s*status:\s*(\d+)\s*}\s*\);'
    
    def replacement1(match):
        param = match.group(1)
        error_msg = match.group(2)
        status_code = match.group(3)
        
        return f'''const authCheck = await requireAdmin({param});
  if (!authCheck.success) {{
    return NextResponse.json(
      {{ error: authCheck.error || '{error_msg}' }},
      {{ status: authCheck.status || {status_code} }}
    );
  }}'''
    
    content = re.sub(pattern1, replacement1, content)
    
    # Pattern 2: Multi-line if check
    # if (!await requireAdmin(request)) {
    #   return NextResponse...
    # }
    pattern2 = r'if\s*\(\s*!\s*await\s+requireAdmin\(([^)]+)\)\s*\)\s*{\s*return\s+NextResponse\.json\([^}]+}\s*,\s*{\s*status:\s*\d+\s*}\s*\);\s*}'
    
    def replacement2(match):
        param = match.group(1)
        
        return f'''const authCheck = await requireAdmin({param});
  if (!authCheck.success) {{
    return NextResponse.json(
      {{ error: authCheck.error || 'Forbidden' }},
      {{ status: authCheck.status || 403 }}
    );
  }}'''
    
    content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)
    
    return content

def process_file(filepath):
    """Process a single file."""
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        # Check if needs fixing
        if 'requireAdmin' not in original:
            return False
        
        if '!await requireAdmin' not in original:
            # Already fixed or using correct pattern
            return False
        
        # Apply fixes
        fixed = fix_require_admin_usage(original, filepath.name)
        
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
    print("FIX requireAdmin USAGE PATTERN")
    print("=" * 80)
    print()
    print("Changing:")
    print("  if (!await requireAdmin(request))")
    print("To:")
    print("  const authCheck = await requireAdmin(request);")
    print("  if (!authCheck.success)")
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    admin_api_dir = base_dir / 'src' / 'app' / 'api' / 'admin'
    
    fixed_count = 0
    
    # Process all admin API files
    for filepath in admin_api_dir.rglob('*.js'):
        if process_file(filepath):
            fixed_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS! All requireAdmin usage patterns fixed!")
    else:
        print("⚠️  No files needed fixing (already correct).")

if __name__ == "__main__":
    main()
