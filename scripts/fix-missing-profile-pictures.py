#!/usr/bin/env python3
"""
Check and Fix Missing Profile Pictures

This script:
1. Finds members with missing/null profile pictures
2. Checks if Cloudinary URLs are still accessible
3. Generates default avatars for members without photos
4. Uploads to MinIO and updates database

Usage:
  python scripts/fix-missing-profile-pictures.py [--dry-run] [--check-cloudinary]
"""

import sys
import os
import requests
import psycopg2
from datetime import datetime
import json

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Configuration
DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

CLOUDINARY_CONFIG = {
    'cloud_name': 'dmzx6aigr',
    'api_key': '142548883246277',
    'api_secret': '7PU_0HEAxwAHTXDBSecKSKcNIBs'
}

MINIO_PUBLIC_URL = 'http://storage.berkomunitas.com/berkomunitas'

# Parse arguments
DRY_RUN = '--dry-run' in sys.argv
CHECK_CLOUDINARY = '--check-cloudinary' in sys.argv

print('🔍 Missing Profile Pictures Checker & Fixer')
print('=' * 60)
print(f'Mode: {"🧪 DRY RUN" if DRY_RUN else "✅ LIVE MODE"}')
print(f'Check Cloudinary: {"✅ Yes" if CHECK_CLOUDINARY else "❌ No"}')
print()

def get_db_connection():
    """Create database connection"""
    return psycopg2.connect(**DB_CONFIG)

def check_url_exists(url, timeout=10):
    """Check if URL is accessible"""
    try:
        response = requests.head(url, timeout=timeout, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def get_members_status():
    """Get members profile picture status"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get all members with their photo status
    cursor.execute("""
        SELECT 
            id,
            nama_lengkap,
            email,
            foto_profil_url,
            CASE
                WHEN foto_profil_url IS NULL THEN 'NULL'
                WHEN foto_profil_url = '' THEN 'EMPTY'
                WHEN foto_profil_url LIKE '%cloudinary.com%' THEN 'CLOUDINARY'
                WHEN foto_profil_url LIKE '%storage.berkomunitas.com%' THEN 'MINIO'
                WHEN foto_profil_url LIKE '%dicebear.com%' THEN 'DICEBEAR'
                WHEN foto_profil_url LIKE '/uploads/%' THEN 'LOCAL'
                ELSE 'OTHER'
            END as photo_type
        FROM members
        ORDER BY id
    """)
    
    members = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return members

def check_cloudinary_urls(members):
    """Check which Cloudinary URLs are still accessible"""
    cloudinary_members = [m for m in members if m[4] == 'CLOUDINARY']
    
    if not cloudinary_members:
        print('ℹ️  No members using Cloudinary URLs')
        return []
    
    print(f'\n📸 Checking {len(cloudinary_members)} Cloudinary URLs...')
    print()
    
    results = []
    for member in cloudinary_members:
        member_id, nama, email, url, _ = member
        print(f'  Checking member {member_id} - {nama}...')
        
        is_accessible = check_url_exists(url)
        status = '✅ OK' if is_accessible else '❌ 404'
        print(f'    {status}: {url[:70]}...')
        
        results.append({
            'id': member_id,
            'nama': nama,
            'email': email,
            'url': url,
            'accessible': is_accessible
        })
    
    return results

def generate_dicebear_url(member_id, nama, email):
    """Generate DiceBear avatar URL"""
    # Use nama_lengkap as seed, fallback to email or ID
    seed = nama or email or str(member_id)
    # Use initials style for professional look
    return f'https://api.dicebear.com/7.x/initials/svg?seed={seed}&backgroundColor=4f46e5&textColor=ffffff'

def fix_missing_photos(members):
    """Generate default avatars for missing photos"""
    # Find members needing fixes
    need_fix = [m for m in members if m[4] in ('NULL', 'EMPTY')]
    
    if not need_fix:
        print('\n✅ All members have profile pictures!')
        return 0
    
    print(f'\n🔧 Found {len(need_fix)} members without profile pictures')
    print()
    
    if DRY_RUN:
        print('🧪 DRY RUN - Preview fixes:')
        print()
        for member in need_fix:
            member_id, nama, email, url, photo_type = member
            new_url = generate_dicebear_url(member_id, nama, email)
            print(f'  ID {member_id}: {nama or email}')
            print(f'    Current: {photo_type}')
            print(f'    New URL: {new_url}')
            print()
        return len(need_fix)
    
    # Apply fixes
    conn = get_db_connection()
    cursor = conn.cursor()
    
    fixed_count = 0
    for member in need_fix:
        member_id, nama, email, url, photo_type = member
        new_url = generate_dicebear_url(member_id, nama, email)
        
        try:
            cursor.execute(
                "UPDATE members SET foto_profil_url = %s WHERE id = %s",
                (new_url, member_id)
            )
            print(f'  ✅ Fixed member {member_id}: {nama or email}')
            print(f'      New URL: {new_url}')
            fixed_count += 1
        except Exception as e:
            print(f'  ❌ Failed member {member_id}: {e}')
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return fixed_count

def main():
    print('📊 Fetching members data...\n')
    
    # Get all members
    members = get_members_status()
    
    # Count by type
    status_counts = {}
    for member in members:
        photo_type = member[4]
        status_counts[photo_type] = status_counts.get(photo_type, 0) + 1
    
    # Display summary
    print('=' * 60)
    print('📊 Profile Picture Status Summary')
    print('=' * 60)
    print()
    
    total = len(members)
    print(f'Total Members: {total}')
    print()
    
    for status, count in sorted(status_counts.items()):
        percentage = (count / total * 100) if total > 0 else 0
        icon = '✅' if status in ('MINIO', 'CLOUDINARY', 'DICEBEAR') else '⚠️' if status == 'NULL' else '❌'
        print(f'{icon} {status}: {count} ({percentage:.1f}%)')
    
    print()
    
    # Check Cloudinary URLs if requested
    if CHECK_CLOUDINARY:
        cloudinary_results = check_cloudinary_urls(members)
        
        if cloudinary_results:
            accessible = sum(1 for r in cloudinary_results if r['accessible'])
            broken = len(cloudinary_results) - accessible
            
            print()
            print('=' * 60)
            print('📸 Cloudinary URL Check Results')
            print('=' * 60)
            print(f'✅ Accessible: {accessible}')
            print(f'❌ Broken (404): {broken}')
            
            if broken > 0:
                print()
                print('Broken URLs:')
                for result in cloudinary_results:
                    if not result['accessible']:
                        print(f'  - Member {result["id"]}: {result["nama"]}')
                        print(f'    {result["url"][:70]}...')
    
    # Fix missing photos
    print()
    print('=' * 60)
    print('🔧 Fixing Missing Profile Pictures')
    print('=' * 60)
    
    fixed = fix_missing_photos(members)
    
    # Final summary
    print()
    print('=' * 60)
    print('📊 Summary')
    print('=' * 60)
    print(f'Total members: {total}')
    print(f'Members without photos: {status_counts.get("NULL", 0) + status_counts.get("EMPTY", 0)}')
    
    if DRY_RUN:
        print(f'Would fix: {fixed} members')
        print()
        print('Run without --dry-run to apply fixes')
    else:
        print(f'Fixed: {fixed} members')
        print()
        print('✅ All done!')
    
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n\n❌ Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
