#!/usr/bin/env python3
"""
Check broken/inaccessible profile pictures
"""

import psycopg2
import requests
from urllib.parse import urlparse

DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

def check_url_accessibility(url):
    """Check if URL is accessible"""
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def check_all_photos():
    """Check all profile pictures accessibility"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, nama_lengkap, email, foto_profil_url
        FROM members
        ORDER BY id
    """)
    
    members = cur.fetchall()
    cur.close()
    conn.close()
    
    print("\n🔍 Checking Profile Picture Accessibility")
    print("="*80)
    
    broken = []
    dicebear = []
    minio = []
    google = []
    cloudinary = []
    null_or_empty = []
    
    for member_id, nama, email, url in members:
        if not url or url.strip() == '':
            null_or_empty.append((member_id, nama, email))
            continue
            
        url_lower = url.lower()
        
        if 'dicebear.com' in url_lower:
            dicebear.append((member_id, nama, email, url))
        elif 'storage.berkomunitas.com' in url_lower or '213.190.4.159:9100' in url_lower:
            # Check MinIO accessibility
            if not check_url_accessibility(url):
                broken.append((member_id, nama, email, url, 'MinIO'))
            else:
                minio.append((member_id, nama, email, url))
        elif 'googleusercontent.com' in url_lower:
            google.append((member_id, nama, email, url))
        elif 'cloudinary.com' in url_lower:
            cloudinary.append((member_id, nama, email, url))
        else:
            # Check other URLs
            if not check_url_accessibility(url):
                broken.append((member_id, nama, email, url, 'Other'))
    
    # Print summary
    print(f"\n📊 SUMMARY")
    print("="*80)
    print(f"✅ DiceBear: {len(dicebear)}")
    print(f"✅ MinIO (accessible): {len(minio)}")
    print(f"✅ Google Photos: {len(google)}")
    print(f"❌ Cloudinary: {len(cloudinary)}")
    print(f"❌ Null/Empty: {len(null_or_empty)}")
    print(f"❌ Broken URLs: {len(broken)}")
    print(f"📊 Total: {len(members)}")
    
    # Print broken URLs
    if broken:
        print(f"\n❌ BROKEN/INACCESSIBLE URLs ({len(broken)}):")
        print("="*80)
        for member_id, nama, email, url, source in broken:
            print(f"[{member_id}] {nama} ({email})")
            print(f"    Source: {source}")
            print(f"    URL: {url}\n")
    
    # Print null/empty
    if null_or_empty:
        print(f"\n❌ NULL/EMPTY URLs ({len(null_or_empty)}):")
        print("="*80)
        for member_id, nama, email in null_or_empty:
            print(f"[{member_id}] {nama} ({email})\n")
    
    # Print cloudinary
    if cloudinary:
        print(f"\n⚠️  STILL USING CLOUDINARY ({len(cloudinary)}):")
        print("="*80)
        for member_id, nama, email, url in cloudinary:
            print(f"[{member_id}] {nama} ({email})")
            print(f"    URL: {url}\n")
    
    print("="*80)
    
    # Return IDs that need fixing
    needs_fix = [m[0] for m in broken] + [m[0] for m in null_or_empty]
    return needs_fix

if __name__ == "__main__":
    broken_ids = check_all_photos()
    
    if broken_ids:
        print(f"\n💡 {len(broken_ids)} members need fixing:")
        print(f"   Member IDs: {', '.join(map(str, broken_ids))}")
        print(f"\n   Run: python scripts/fix-broken-profile-pictures.py")
