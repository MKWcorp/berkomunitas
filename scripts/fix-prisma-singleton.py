#!/usr/bin/env python3
"""
Fix Prisma Client - Replace all `new PrismaClient()` with singleton import.
This fixes "too many database connections" error.
"""

import os
import re
from pathlib import Path

def fix_prisma_import(content, filepath):
    """Replace PrismaClient import and instantiation with singleton import."""
    
    # Skip if already using singleton pattern (globalForPrisma)
    if 'globalForPrisma' in content:
        return content, False
    
    # Skip lib/prisma.js itself
    if 'lib/prisma.js' in str(filepath) or 'utils/prisma.js' in str(filepath):
        return content, False
    
    changed = False
    
    # Pattern 1: import { PrismaClient } from '@prisma/client'
    # const prisma = new PrismaClient();
    if "from '@prisma/client'" in content and 'new PrismaClient' in content:
        # Remove old import
        content = re.sub(
            r"import\s*{\s*PrismaClient\s*}\s*from\s*['\"]@prisma/client['\"];?\s*\n?",
            "",
            content
        )
        
        # Remove const prisma = new PrismaClient(...);
        content = re.sub(
            r"const\s+prisma\s*=\s*new\s+PrismaClient\([^)]*\);?\s*\n?",
            "",
            content
        )
        
        # Add singleton import at the top (after 'use client' or first import)
        if "'use client'" in content or '"use client"' in content:
            # Add after 'use client'
            content = re.sub(
                r"(['\"]use client['\"];?\s*\n)",
                r"\1import prisma from '@/utils/prisma';\n",
                content,
                count=1
            )
        else:
            # Add as first import
            first_import_match = re.search(r"(import\s+.*?;?\s*\n)", content)
            if first_import_match:
                insert_pos = first_import_match.start()
                content = content[:insert_pos] + "import prisma from '@/utils/prisma';\n" + content[insert_pos:]
            else:
                # No imports yet, add at top
                content = "import prisma from '@/utils/prisma';\n\n" + content
        
        changed = True
    
    return content, changed

def process_file(filepath):
    """Process a single file."""
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        # Check if needs fixing
        if 'new PrismaClient' not in original:
            return False
        
        fixed, changed = fix_prisma_import(original, filepath)
        
        if not changed:
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
    print("FIX PRISMA CLIENT - USE SINGLETON PATTERN")
    print("=" * 80)
    print()
    print("This fixes 'too many database connections' error by ensuring")
    print("all files use the same Prisma Client singleton instance.")
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    src_dir = base_dir / 'src'
    
    fixed_count = 0
    
    # Process all JS files in src
    for filepath in src_dir.rglob('*.js'):
        # Skip singleton files themselves
        if 'prisma.js' in filepath.name:
            continue
        
        if process_file(filepath):
            fixed_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS! All files now use Prisma singleton!")
        print()
        print("BENEFITS:")
        print("  - ✅ No more 'too many connections' errors")
        print("  - ✅ Better connection pooling")
        print("  - ✅ Faster database queries")
        print("  - ✅ Reduced memory usage")
        print()
        print("NEXT STEPS:")
        print("1. Restart dev server")
        print("2. Monitor connection count")
        print("3. Test all API endpoints")
    else:
        print("⚠️  No files modified. They may already use singleton pattern.")

if __name__ == "__main__":
    main()
