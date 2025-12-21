#!/usr/bin/env python3
"""
Consolidate lib folder - ensure all lib files are in /lib (root) not /src/lib
This provides long-term maintainability and consistency.
"""

import os
import shutil
from pathlib import Path

def main():
    print("=" * 80)
    print("CONSOLIDATE LIB FOLDER - Long-term Solution")
    print("=" * 80)
    print()
    
    base_dir = Path(__file__).parent.parent
    src_lib = base_dir / 'src' / 'lib'
    root_lib = base_dir / 'lib'
    
    # Check if src/lib exists
    if not src_lib.exists():
        print("✅ src/lib folder does not exist - already clean!")
        print()
        return
    
    print(f"📁 Found src/lib folder: {src_lib}")
    print()
    
    # List files in src/lib
    files = list(src_lib.glob('*.js'))
    
    if not files:
        print("✅ src/lib is empty")
        print("🗑️  Removing empty src/lib folder...")
        try:
            src_lib.rmdir()
            print("✅ Removed empty src/lib folder")
        except Exception as e:
            print(f"⚠️  Could not remove src/lib: {e}")
        print()
        return
    
    print(f"📝 Files in src/lib: {len(files)}")
    for f in files:
        print(f"   - {f.name}")
    print()
    
    # Ask user what to do
    print("🤔 What should we do with these files?")
    print("   1. Move to /lib (root) - RECOMMENDED for long-term")
    print("   2. Keep in src/lib and update imports")
    print("   3. Skip (manual decision)")
    print()
    
    choice = input("Choose option (1/2/3): ").strip()
    
    if choice == '1':
        print()
        print("📦 Moving files to /lib (root)...")
        moved = 0
        skipped = 0
        
        for src_file in files:
            dest_file = root_lib / src_file.name
            
            if dest_file.exists():
                print(f"⚠️  SKIP: {src_file.name} (already exists in /lib)")
                skipped += 1
            else:
                try:
                    shutil.move(str(src_file), str(dest_file))
                    print(f"✅ Moved: {src_file.name} → /lib/")
                    moved += 1
                except Exception as e:
                    print(f"❌ ERROR moving {src_file.name}: {e}")
        
        print()
        print(f"✅ Moved: {moved} files")
        print(f"⚠️  Skipped: {skipped} files")
        
        # Try to remove src/lib if empty
        try:
            if not list(src_lib.glob('*')):
                src_lib.rmdir()
                print("✅ Removed empty src/lib folder")
        except:
            pass
        
    elif choice == '2':
        print()
        print("📝 Keeping files in src/lib")
        print("⚠️  You'll need to update jsconfig.json paths")
        
    else:
        print()
        print("⏭️  Skipped - no changes made")
    
    print()
    print("=" * 80)
    print("NEXT STEPS:")
    print("=" * 80)
    print("1. Restart Next.js dev server")
    print("2. Run: rm -rf .next  (clear cache)")
    print("3. Test imports")
    print()

if __name__ == "__main__":
    main()
