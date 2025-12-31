#!/usr/bin/env python3
"""
Complete migration script: Replace all clerk_id references with google_id
This fixes Prisma errors after SSO Google migration.

Author: GitHub Copilot
Date: 2025-01-21
"""

import os
import re
from pathlib import Path
from typing import List, Tuple

class ClerkIdMigrator:
    def __init__(self, base_dir: Path):
        self.base_dir = base_dir
        self.stats = {
            'files_scanned': 0,
            'files_modified': 0,
            'clerk_id_where': 0,
            'clerk_id_select': 0,
            'clerk_id_include': 0,
            'clerk_id_orderBy': 0,
            'clerk_id_data': 0,
            'clerk_id_create': 0,
            'clerk_id_update': 0,
        }
        
        # File patterns to scan
        self.include_patterns = [
            '**/*.js',
            '**/*.jsx',
            '**/*.ts',
            '**/*.tsx',
        ]
        
        # Directories to skip
        self.skip_dirs = {
            'node_modules',
            '.next',
            '.git',
            'backup',
            'dist',
            'build',
            '__pycache__',
        }
    
    def should_skip_file(self, filepath: Path) -> bool:
        """Check if file should be skipped."""
        # Skip if in excluded directory
        for part in filepath.parts:
            if part in self.skip_dirs:
                return True
        
        # Skip backup files
        if any(pattern in filepath.name for pattern in [
            '-backup',
            '.backup',
            '-old',
            '.old',
            '-original',
        ]):
            return True
        
        return False
    
    def find_files(self) -> List[Path]:
        """Find all files to process."""
        files = []
        for pattern in self.include_patterns:
            for filepath in self.base_dir.rglob(pattern):
                if filepath.is_file() and not self.should_skip_file(filepath):
                    files.append(filepath)
        return files
    
    def fix_clerk_id_patterns(self, content: str) -> Tuple[str, bool]:
        """Replace all clerk_id patterns with google_id."""
        modified = False
        original_content = content
        
        # Pattern 1: where: { clerk_id: ... }
        pattern1 = r'\bwhere:\s*{\s*clerk_id:'
        if re.search(pattern1, content):
            content = re.sub(pattern1, 'where: { google_id:', content)
            count = len(re.findall(pattern1, original_content))
            self.stats['clerk_id_where'] += count
            modified = True
        
        # Pattern 2: select: { clerk_id: true }
        pattern2 = r'(select:\s*{[^}]*)\bclerk_id:'
        if re.search(pattern2, content):
            content = re.sub(r'\bclerk_id:', 'google_id:', content)
            count = len(re.findall(r'\bclerk_id:', original_content))
            self.stats['clerk_id_select'] += count
            modified = True
        
        # Pattern 3: include: { clerk_id: true }
        pattern3 = r'(include:\s*{[^}]*)\bclerk_id:'
        if re.search(pattern3, content):
            content = re.sub(r'\bclerk_id:', 'google_id:', content)
            modified = True
        
        # Pattern 4: orderBy: { clerk_id: 'asc' }
        pattern4 = r'orderBy:\s*{\s*clerk_id:'
        if re.search(pattern4, content):
            content = re.sub(pattern4, 'orderBy: { google_id:', content)
            self.stats['clerk_id_orderBy'] += 1
            modified = True
        
        # Pattern 5: data: { clerk_id: ... }
        pattern5 = r'data:\s*{\s*clerk_id:'
        if re.search(pattern5, content):
            content = re.sub(pattern5, 'data: { google_id:', content)
            self.stats['clerk_id_data'] += 1
            modified = True
        
        # Pattern 6: create: { clerk_id: ... }
        pattern6 = r'create:\s*{\s*clerk_id:'
        if re.search(pattern6, content):
            content = re.sub(pattern6, 'create: { google_id:', content)
            self.stats['clerk_id_create'] += 1
            modified = True
        
        # Pattern 7: update: { clerk_id: ... }
        pattern7 = r'update:\s*{\s*clerk_id:'
        if re.search(pattern7, content):
            content = re.sub(pattern7, 'update: { google_id:', content)
            self.stats['clerk_id_update'] += 1
            modified = True
        
        # Pattern 8: clerk_id in any object property
        # This is more aggressive - replace clerk_id: anywhere
        pattern8 = r'\bclerk_id\s*:'
        if re.search(pattern8, content):
            content = re.sub(pattern8, 'google_id:', content)
            modified = True
        
        # Pattern 9: Variable names like clerkId or clerk_id
        pattern9 = r'\bconst\s+clerkId\s*='
        if re.search(pattern9, content):
            content = re.sub(pattern9, 'const googleId =', content)
            # Also replace usages
            content = re.sub(r'\bclerkId\b', 'googleId', content)
            modified = True
        
        return content, modified
    
    def process_file(self, filepath: Path) -> bool:
        """Process a single file."""
        try:
            # Read file
            with open(filepath, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            self.stats['files_scanned'] += 1
            
            # Check if file contains clerk_id
            if 'clerk_id' not in original_content.lower():
                return False
            
            # Apply fixes
            fixed_content, modified = self.fix_clerk_id_patterns(original_content)
            
            if not modified:
                return False
            
            # Write back
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(fixed_content)
            
            self.stats['files_modified'] += 1
            print(f"✅ FIXED: {filepath.relative_to(self.base_dir)}")
            return True
            
        except Exception as e:
            print(f"❌ ERROR processing {filepath.relative_to(self.base_dir)}: {e}")
            return False
    
    def run(self):
        """Run the migration."""
        print("=" * 80)
        print("CLERK_ID → GOOGLE_ID MIGRATION")
        print("=" * 80)
        print()
        
        # Find all files
        print("🔍 Scanning for files...")
        files = self.find_files()
        print(f"Found {len(files)} files to scan")
        print()
        
        # Process files
        print("🔧 Processing files...")
        for filepath in files:
            self.process_file(filepath)
        
        # Print summary
        print()
        print("=" * 80)
        print("MIGRATION SUMMARY")
        print("=" * 80)
        print(f"📊 Files scanned:     {self.stats['files_scanned']}")
        print(f"✅ Files modified:    {self.stats['files_modified']}")
        print()
        print("Pattern replacements:")
        print(f"  • where clauses:    {self.stats['clerk_id_where']}")
        print(f"  • select clauses:   {self.stats['clerk_id_select']}")
        print(f"  • include clauses:  {self.stats['clerk_id_include']}")
        print(f"  • orderBy clauses:  {self.stats['clerk_id_orderBy']}")
        print(f"  • data clauses:     {self.stats['clerk_id_data']}")
        print(f"  • create clauses:   {self.stats['clerk_id_create']}")
        print(f"  • update clauses:   {self.stats['clerk_id_update']}")
        print()
        
        if self.stats['files_modified'] > 0:
            print("✅ SUCCESS: All clerk_id references migrated to google_id!")
            print()
            print("NEXT STEPS:")
            print("1. Restart Next.js dev server")
            print("2. Test all affected pages")
            print("3. Check Prisma queries work correctly")
            print("4. Verify no more 'clerk_id' errors in console")
        else:
            print("ℹ️  No files needed modification")

def main():
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    
    migrator = ClerkIdMigrator(base_dir)
    migrator.run()

if __name__ == "__main__":
    main()
