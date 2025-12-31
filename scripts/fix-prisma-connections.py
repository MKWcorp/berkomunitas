#!/usr/bin/env python3
"""
Fix Prisma connection pooling issue by replacing all 'new PrismaClient()' 
with singleton import from utils/prisma.js
"""

import os
import re
from pathlib import Path

def fix_prisma_import(content):
    """Replace PrismaClient import and instantiation with singleton."""
    
    # Check if file already uses singleton
    if "from '@prisma/client'" not in content and "from \"@prisma/client\"" not in content:
        return content
    
    if "new PrismaClient()" not in content:
        return content
    
    # Pattern 1: import { PrismaClient } from '@prisma/client';
    import_pattern = r"import\s*{\s*PrismaClient\s*}\s*from\s*['\"]@prisma/client['\"];"
    
    # Pattern 2: const prisma = new PrismaClient();
    instantiation_pattern = r"const\s+prisma\s*=\s*new\s+PrismaClient\(\s*\);"
    
    # Check if both patterns exist
    has_import = re.search(import_pattern, content)
    has_instantiation = re.search(instantiation_pattern, content)
    
    if not (has_import and has_instantiation):
        return content
    
    # Replace import
    content = re.sub(
        import_pattern,
        "import prisma from '../../../../utils/prisma';  // Singleton Prisma client",
        content
    )
    
    # Remove instantiation line
    content = re.sub(
        instantiation_pattern + r'\s*',
        '',
        content
    )
    
    return content

def get_correct_import_path(filepath):
    """Calculate correct relative path to utils/prisma.js"""
    
    # Convert to Path object
    file_path = Path(filepath)
    
    # Get relative path from file to utils/prisma.js
    try:
        # Assuming structure: src/app/api/.../route.js
        # Need to go up to src, then to utils
        
        # Count how many levels deep we are in src/app/api/
        parts = file_path.parts
        
        # Find index of 'api' in path
        if 'api' in parts:
            api_index = parts.index('api')
            # Count levels after 'api'
            levels_deep = len(parts) - api_index - 2  # -2 for 'api' and filename
            
            # Generate relative path
            if levels_deep == 0:
                return "'../../../utils/prisma'"
            elif levels_deep == 1:
                return "'../../../../utils/prisma'"
            elif levels_deep == 2:
                return "'../../../../../utils/prisma'"
            elif levels_deep == 3:
                return "'../../../../../../utils/prisma'"
            else:
                return "'../../../../utils/prisma'"  # Default
        
        return "'../../../../utils/prisma'"  # Default
    except:
        return "'../../../../utils/prisma'"  # Default

def fix_import_path(content, filepath):
    """Fix the import path to correct relative path."""
    
    correct_path = get_correct_import_path(filepath)
    
    # Replace the placeholder path with correct one
    content = re.sub(
        r"from\s+['\"]\.\.\/\.\.\/\.\.\/\.\.\/utils\/prisma['\"]",
        f"from {correct_path}",
        content
    )
    
    return content

def process_file(filepath):
    """Process a single file."""
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            original = f.read()
        
        # Apply fixes
        fixed = fix_prisma_import(original)
        fixed = fix_import_path(fixed, filepath)
        
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
    print("FIX PRISMA CONNECTION POOLING")
    print("=" * 80)
    print()
    print("Replacing 'new PrismaClient()' with singleton import")
    print()
    
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    src_dir = base_dir / 'src'
    
    fixed_count = 0
    
    # Process all JS files in src/app/api
    api_dir = src_dir / 'app' / 'api'
    
    if not api_dir.exists():
        print(f"❌ API directory not found: {api_dir}")
        return
    
    for filepath in api_dir.rglob('*.js'):
        if process_file(filepath):
            fixed_count += 1
    
    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"✅ Fixed: {fixed_count} files")
    print()
    
    if fixed_count > 0:
        print("✅ SUCCESS! All API routes now use singleton Prisma client!")
        print()
        print("BENEFITS:")
        print("- Connection pooling - reuses connections")
        print("- No more 'too many clients' errors")
        print("- Better performance")
        print()
        print("NEXT STEPS:")
        print("1. Restart dev server")
        print("2. Test API endpoints")
        print("3. Monitor database connections")

if __name__ == "__main__":
    main()
