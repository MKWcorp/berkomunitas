#!/usr/bin/env python3
"""
Standardize all Prisma imports to use @/lib/prisma alias.
This fixes Module not found errors and ensures singleton pattern.
"""

import os
import re
from pathlib import Path

def fix_prisma_imports(content):
    """Replace all relative prisma imports with @/lib/prisma alias."""
    
    # Pattern 1: import prisma from '../../../../../utils/prisma';
    # Pattern 2: import prisma from '../../../../lib/prisma';
    # Pattern 3: Any relative path to prisma
    patterns = [
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/utils\/prisma['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/utils\/prisma['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/\.\.\/utils\/prisma['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/utils\/prisma['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/prisma(\.js)?['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/lib\/prisma(\.js)?['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/\.\.\/lib\/prisma(\.js)?['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/\.\.\/lib\/prisma(\.js)?['\"];?",
        r"import\s+prisma\s+from\s+['\"]\.\.\/\.\.\/lib\/prisma(\.js)?['\"];?",
    ]
    
    replacement = "import prisma from '@/lib/prisma';"
    
    for pattern in patterns:
        content = re.sub(pattern, replacement, content)
    
    return content

def process_file(filepath):
    """Process a single file."""
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        # Check if needs fixing
        if 'prisma' not in original.lower():
            return False
        
        # Apply fixes
        fixed = fix_prisma_imports(original)
        
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
    print("STANDARDIZE PRISMA IMPORTS TO @/lib/prisma")
    print("=" * 80)
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    src_dir = base_dir / 'src' / 'app' / 'api'
    
    fixed_count = 0
    
    # Process all JS files in src/app/api
    for filepath in src_dir.rglob('*.js'):
        if process_file(filepath):
            fixed_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS! All Prisma imports now use @/lib/prisma alias!")
        print()
        print("NEXT STEPS:")
        print("1. Delete duplicate prisma.js: src/utils/prisma.js")
        print("2. Restart dev server")
        print("3. Test all API routes")
    else:
        print("⚠️  No files modified.")

if __name__ == "__main__":
    main()
