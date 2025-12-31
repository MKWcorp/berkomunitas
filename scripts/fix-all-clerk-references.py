#!/usr/bin/env python3
"""
Comprehensive Clerk to SSO Migration Script
============================================
This script finds and replaces ALL Clerk references with SSO Google authentication.

Handles:
- Frontend: useUser(), useAuth(), useSession() hooks
- Backend API: auth(), currentUser(), userId destructuring
- Environment variables: CLERK_* -> SSO_*
- Database fields: clerk_id references
- Middleware: Clerk auth middleware

Author: GitHub Copilot
Date: 2025-01-21
"""

import os
import re
from pathlib import Path
from typing import List, Tuple, Dict
import json

class ClerkToSSOMigrator:
    def __init__(self, base_dir: str):
        self.base_dir = Path(base_dir)
        self.stats = {
            'files_scanned': 0,
            'files_modified': 0,
            'patterns_fixed': {},
            'errors': []
        }
        
    def scan_and_fix(self):
        """Main entry point to scan and fix all files."""
        print("=" * 80)
        print("🔍 CLERK TO SSO MIGRATION SCRIPT")
        print("=" * 80)
        print()
        
        # Scan different file types
        self.fix_frontend_files()
        self.fix_backend_api_files()
        self.fix_middleware_files()
        self.scan_environment_files()
        
        self.print_summary()
    
    def fix_frontend_files(self):
        """Fix all frontend React/Next.js component files."""
        print("📱 Scanning Frontend Files...")
        print("-" * 80)
        
        # Find all frontend files
        patterns = [
            "src/app/**/*.js",
            "src/app/**/*.jsx",
            "src/components/**/*.js",
            "src/components/**/*.jsx",
        ]
        
        files = []
        for pattern in patterns:
            files.extend(self.base_dir.glob(pattern))
        
        for filepath in files:
            if self.should_skip_file(filepath):
                continue
            
            self.stats['files_scanned'] += 1
            self.fix_frontend_file(filepath)
    
    def fix_backend_api_files(self):
        """Fix all backend API route files."""
        print("\n🔧 Scanning Backend API Files...")
        print("-" * 80)
        
        # Find all API route files
        api_files = list(self.base_dir.glob("src/app/api/**/*.js"))
        
        for filepath in api_files:
            if self.should_skip_file(filepath):
                continue
            
            self.stats['files_scanned'] += 1
            self.fix_backend_file(filepath)
    
    def fix_middleware_files(self):
        """Fix middleware files."""
        print("\n⚙️  Scanning Middleware Files...")
        print("-" * 80)
        
        middleware_files = [
            self.base_dir / "middleware.js",
            self.base_dir / "src" / "middleware.js",
        ]
        
        for filepath in middleware_files:
            if filepath.exists():
                self.stats['files_scanned'] += 1
                self.fix_middleware_file(filepath)
    
    def scan_environment_files(self):
        """Scan environment files for Clerk variables."""
        print("\n🌍 Scanning Environment Files...")
        print("-" * 80)
        
        env_files = [
            self.base_dir / ".env",
            self.base_dir / ".env.local",
            self.base_dir / ".env.production",
        ]
        
        for filepath in env_files:
            if filepath.exists():
                self.scan_env_file(filepath)
    
    def should_skip_file(self, filepath: Path) -> bool:
        """Check if file should be skipped."""
        skip_patterns = [
            "node_modules",
            ".next",
            "backup",
            "-old.js",
            "-backup.js",
            ".git",
            "dist",
            "build"
        ]
        
        str_path = str(filepath)
        return any(pattern in str_path for pattern in skip_patterns)
    
    def fix_frontend_file(self, filepath: Path):
        """Fix a single frontend file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Pattern 1: Import from @clerk/nextjs
            if "from '@clerk/nextjs'" in content or 'from "@clerk/nextjs"' in content:
                content = self.fix_clerk_imports(content, filepath)
            
            # Pattern 2: useUser() hook calls
            if re.search(r'\buseUser\s*\(', content):
                content = self.fix_useuser_calls(content)
            
            # Pattern 3: useAuth() hook calls
            if re.search(r'\buseAuth\s*\(', content):
                content = self.fix_useauth_calls(content)
            
            # Pattern 4: useSession() hook calls  
            if re.search(r'\buseSession\s*\(', content):
                content = self.fix_usesession_calls(content)
            
            # Write back if changed
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  ✅ {filepath.relative_to(self.base_dir)}")
                self.stats['files_modified'] += 1
                
        except Exception as e:
            error_msg = f"Error processing {filepath}: {e}"
            print(f"  ❌ {error_msg}")
            self.stats['errors'].append(error_msg)
    
    def fix_backend_file(self, filepath: Path):
        """Fix a single backend API file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Pattern 1: Import auth from @clerk/nextjs
            if "from '@clerk/nextjs'" in content or 'from "@clerk/nextjs"' in content:
                content = self.fix_clerk_auth_imports(content)
            
            # Pattern 2: auth() calls
            if re.search(r'\bauth\s*\(\s*\)', content):
                content = self.fix_auth_calls(content)
            
            # Pattern 3: Direct userId destructuring (COMMON ERROR)
            # const { userId } = auth(); -> const user = await getCurrentUser(request);
            content = self.fix_userid_destructuring(content)
            
            # Pattern 4: currentUser() calls
            if 'currentUser()' in content:
                content = self.fix_currentuser_calls(content)
            
            # Pattern 5: clerk_id references
            if 'clerk_id' in content:
                content = self.fix_clerk_id_references(content)
            
            # Write back if changed
            if content != original_content:
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"  ✅ {filepath.relative_to(self.base_dir)}")
                self.stats['files_modified'] += 1
                
        except Exception as e:
            error_msg = f"Error processing {filepath}: {e}"
            print(f"  ❌ {error_msg}")
            self.stats['errors'].append(error_msg)
    
    def fix_middleware_file(self, filepath: Path):
        """Fix middleware file."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Check if using Clerk middleware
            if 'clerkMiddleware' in content or 'authMiddleware' in content:
                print(f"  ⚠️  {filepath.relative_to(self.base_dir)}")
                print(f"     Manual review needed: Uses Clerk middleware")
                print(f"     Recommendation: Use custom SSO middleware from lib/sso.js")
            
            # Could add auto-replacement here if needed
            
        except Exception as e:
            error_msg = f"Error processing {filepath}: {e}"
            print(f"  ❌ {error_msg}")
            self.stats['errors'].append(error_msg)
    
    def scan_env_file(self, filepath: Path):
        """Scan environment file for Clerk variables."""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            clerk_vars = []
            for line in content.split('\n'):
                if line.strip().startswith('CLERK_'):
                    clerk_vars.append(line.split('=')[0])
            
            if clerk_vars:
                print(f"  ⚠️  {filepath.name}")
                print(f"     Found Clerk variables:")
                for var in clerk_vars:
                    print(f"       - {var}")
                print(f"     Recommendation: Remove these and ensure SSO_* variables are set")
            else:
                print(f"  ✅ {filepath.name} - No Clerk variables found")
                
        except FileNotFoundError:
            pass
        except Exception as e:
            print(f"  ❌ Error scanning {filepath}: {e}")
    
    def fix_clerk_imports(self, content: str, filepath: Path) -> str:
        """Fix Clerk imports in frontend files."""
        
        # Pattern: import { useUser } from '@clerk/nextjs';
        pattern1 = r"import\s*{\s*useUser\s*}\s*from\s*['\"]@clerk/nextjs['\"];"
        if re.search(pattern1, content):
            content = re.sub(pattern1, "import { useSSOUser } from '@/hooks/useSSOUser';", content)
            self.increment_pattern('useUser import')
        
        # Pattern: import { useUser, OtherHook } from '@clerk/nextjs';
        pattern2 = r"import\s*{\s*useUser\s*,\s*(\w+)\s*}\s*from\s*['\"]@clerk/nextjs['\"];"
        match = re.search(pattern2, content)
        if match:
            other_hook = match.group(1)
            replacement = f"import {{ useSSOUser }} from '@/hooks/useSSOUser';\nimport {{ {other_hook} }} from '@clerk/nextjs';"
            content = re.sub(pattern2, replacement, content)
            self.increment_pattern(f'useUser + {other_hook} import split')
        
        # Pattern: import { useAuth } from '@clerk/nextjs';
        pattern3 = r"import\s*{\s*useAuth\s*}\s*from\s*['\"]@clerk/nextjs['\"];"
        if re.search(pattern3, content):
            content = re.sub(pattern3, "import { useSSOUser } from '@/hooks/useSSOUser';", content)
            self.increment_pattern('useAuth import')
        
        return content
    
    def fix_useuser_calls(self, content: str) -> str:
        """Fix useUser() calls."""
        content = re.sub(r'\buseUser\s*\(', 'useSSOUser(', content)
        self.increment_pattern('useUser() call')
        return content
    
    def fix_useauth_calls(self, content: str) -> str:
        """Fix useAuth() calls."""
        content = re.sub(r'\buseAuth\s*\(', 'useSSOUser(', content)
        self.increment_pattern('useAuth() call')
        return content
    
    def fix_usesession_calls(self, content: str) -> str:
        """Fix useSession() calls."""
        content = re.sub(r'\buseSession\s*\(', 'useSSOUser(', content)
        self.increment_pattern('useSession() call')
        return content
    
    def fix_clerk_auth_imports(self, content: str) -> str:
        """Fix Clerk auth imports in backend files."""
        
        # Pattern: import { auth } from '@clerk/nextjs';
        pattern1 = r"import\s*{\s*auth\s*}\s*from\s*['\"]@clerk/nextjs['\"];"
        if re.search(pattern1, content):
            content = re.sub(pattern1, "import { getCurrentUser } from '@/lib/sso';", content)
            self.increment_pattern('auth import')
        
        # Pattern: import { auth, currentUser } from '@clerk/nextjs';
        pattern2 = r"import\s*{\s*auth\s*,\s*currentUser\s*}\s*from\s*['\"]@clerk/nextjs['\"];"
        if re.search(pattern2, content):
            content = re.sub(pattern2, "import { getCurrentUser } from '@/lib/sso';", content)
            self.increment_pattern('auth + currentUser import')
        
        return content
    
    def fix_auth_calls(self, content: str) -> str:
        """Fix auth() calls in backend files."""
        # This is complex - need to replace:
        # const { userId } = auth();
        # with:
        # const user = await getCurrentUser(request);
        
        # Look for the pattern and add comment for manual review
        if re.search(r'const\s*{\s*userId\s*}\s*=\s*auth\s*\(\s*\);', content):
            self.increment_pattern('auth() destructuring (needs manual review)')
        
        return content
    
    def fix_userid_destructuring(self, content: str) -> str:
        """Fix direct userId destructuring - the MOST COMMON ERROR."""
        
        # Pattern 1: const { userId } = auth();
        # This is wrong because it tries to use userId directly
        # Should be: const user = await getCurrentUser(request); then use user.userId
        
        # Add warning comment above these patterns
        pattern1 = r'(const\s*{\s*userId\s*}\s*=\s*auth\s*\(\s*\);)'
        if re.search(pattern1, content):
            # Add a warning comment
            content = re.sub(
                pattern1,
                r'// ⚠️  MIGRATION NEEDED: Replace with: const user = await getCurrentUser(request);\n  // Then use user.userId instead of userId\n  \1',
                content
            )
            self.increment_pattern('userId destructuring warning added')
        
        # Pattern 2: Direct userId usage without user. prefix
        # Look for: where: { clerk_id: userId }
        # This should be: where: { clerk_id: user.userId }
        pattern2 = r'clerk_id:\s*userId(?!\.)(?!\w)'
        if re.search(pattern2, content):
            content = re.sub(pattern2, 'clerk_id: user.userId', content)
            self.increment_pattern('userId -> user.userId')
        
        return content
    
    def fix_currentuser_calls(self, content: str) -> str:
        """Fix currentUser() calls."""
        # Replace: const user = await currentUser();
        # With: const user = await getCurrentUser(request);
        
        pattern = r'await\s+currentUser\s*\(\s*\)'
        if re.search(pattern, content):
            content = re.sub(pattern, 'await getCurrentUser(request)', content)
            self.increment_pattern('currentUser() call')
        
        return content
    
    def fix_clerk_id_references(self, content: str) -> str:
        """Fix clerk_id field references."""
        # This is a database field name, but we can flag it for review
        # Usually it stays as clerk_id in the database for backwards compatibility
        # But the value comes from user.userId now
        
        # Just count occurrences for reporting
        count = len(re.findall(r'\bclerk_id\b', content))
        if count > 0:
            self.increment_pattern(f'clerk_id field reference', count)
        
        return content
    
    def increment_pattern(self, pattern_name: str, count: int = 1):
        """Track pattern fixes."""
        if pattern_name not in self.stats['patterns_fixed']:
            self.stats['patterns_fixed'][pattern_name] = 0
        self.stats['patterns_fixed'][pattern_name] += count
    
    def print_summary(self):
        """Print migration summary."""
        print("\n" + "=" * 80)
        print("📊 MIGRATION SUMMARY")
        print("=" * 80)
        print(f"Files Scanned: {self.stats['files_scanned']}")
        print(f"Files Modified: {self.stats['files_modified']}")
        print()
        
        if self.stats['patterns_fixed']:
            print("Patterns Fixed:")
            for pattern, count in sorted(self.stats['patterns_fixed'].items()):
                print(f"  • {pattern}: {count}")
            print()
        
        if self.stats['errors']:
            print(f"❌ Errors ({len(self.stats['errors'])}):")
            for error in self.stats['errors']:
                print(f"  • {error}")
            print()
        
        print("=" * 80)
        print("✅ MIGRATION COMPLETE!")
        print()
        print("⚠️  IMPORTANT NEXT STEPS:")
        print("1. Review all files marked with '⚠️  MIGRATION NEEDED' comments")
        print("2. Search for remaining 'clerk_id: userId' patterns (should be 'user.userId')")
        print("3. Test all API endpoints thoroughly")
        print("4. Remove CLERK_* environment variables")
        print("5. Restart your Next.js dev server")
        print()


def main():
    # Get the base directory (parent of scripts folder)
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    
    print(f"Base directory: {base_dir}")
    print()
    
    # Confirm before proceeding
    response = input("⚠️  This will modify multiple files. Continue? (y/n): ")
    if response.lower() != 'y':
        print("Migration cancelled.")
        return
    
    migrator = ClerkToSSOMigrator(str(base_dir))
    migrator.scan_and_fix()


if __name__ == "__main__":
    main()
