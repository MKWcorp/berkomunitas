#!/usr/bin/env python3
"""
Validate lib imports across the codebase.
Ensures server/client code separation is maintained.
"""

import os
import re
from pathlib import Path

def check_file_imports(filepath):
    """Check if file has correct imports based on its location."""
    issues = []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Determine if file is server or client
    is_api_route = '/api/' in str(filepath)
    is_middleware = 'middleware.js' in str(filepath)
    is_client_component = "'use client'" in content or '"use client"' in content
    is_server_file = is_api_route or is_middleware or (not is_client_component and '/app/' in str(filepath))
    
    # Check for problematic imports
    
    # Client code importing server-only modules
    if is_client_component:
        if "from '@/lib/ssoAuth'" in content or 'from "@/lib/ssoAuth"' in content:
            issues.append({
                'severity': 'ERROR',
                'message': 'Client component importing server-only module @/lib/ssoAuth',
                'fix': 'Use @/src/lib/sso or @/hooks/useSSOUser instead'
            })
        
        if "from '@/lib/prisma'" in content or 'from "@/lib/prisma"' in content:
            issues.append({
                'severity': 'ERROR',
                'message': 'Client component importing Prisma (server-only)',
                'fix': 'Move database logic to API route'
            })
    
    # Server code with relative imports to lib
    if is_server_file:
        # Check for relative imports like '../../../lib/xxx'
        relative_lib_imports = re.findall(r'from\s+["\'](\.\./)+lib/', content)
        if relative_lib_imports:
            issues.append({
                'severity': 'WARNING',
                'message': f'Using relative imports to lib folder',
                'fix': 'Use @/lib/xxx instead'
            })
        
        # Check for client-side imports
        if "from '@/src/lib/sso'" in content or 'from "@/src/lib/sso"' in content:
            issues.append({
                'severity': 'WARNING',
                'message': 'Server code importing client-side sso.js',
                'fix': 'Use @/lib/ssoAuth for server-side auth'
            })
    
    return issues

def main():
    print("=" * 80)
    print("VALIDATING LIB IMPORTS - Long-term Maintainability Check")
    print("=" * 80)
    print()
    
    base_dir = Path(__file__).parent.parent
    src_dir = base_dir / 'src'
    lib_dir = base_dir / 'lib'
    
    total_files = 0
    files_with_issues = 0
    total_issues = 0
    
    # Check all JS files
    for ext in ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx']:
        for filepath in src_dir.glob(ext):
            if 'node_modules' in str(filepath) or '.next' in str(filepath):
                continue
            
            total_files += 1
            issues = check_file_imports(filepath)
            
            if issues:
                files_with_issues += 1
                total_issues += len(issues)
                
                rel_path = filepath.relative_to(base_dir)
                print(f"📄 {rel_path}")
                
                for issue in issues:
                    icon = "❌" if issue['severity'] == 'ERROR' else "⚠️"
                    print(f"   {icon} {issue['severity']}: {issue['message']}")
                    print(f"      💡 Fix: {issue['fix']}")
                
                print()
    
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    print(f"📊 Total files checked: {total_files}")
    print(f"⚠️  Files with issues: {files_with_issues}")
    print(f"❌ Total issues found: {total_issues}")
    print()
    
    if total_issues == 0:
        print("✅ All imports are correct! Great job maintaining code quality!")
    else:
        print("⚠️  Found issues that need attention.")
        print("    Run the fixes suggested above.")
    
    print()
    print("=" * 80)
    print("BEST PRACTICES:")
    print("=" * 80)
    print("1. Server code (API routes): import from @/lib/xxx")
    print("2. Client code (components): import from @/src/lib/xxx")
    print("3. React hooks: import from @/hooks/xxx")
    print("4. Always use path aliases, never relative paths")
    print()
    
    return 0 if total_issues == 0 else 1

if __name__ == "__main__":
    exit(main())
