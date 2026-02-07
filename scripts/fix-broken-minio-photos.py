#!/usr/bin/env python3
"""
Fix 5 members with broken MinIO URLs
Replace with DiceBear avatars
"""

import psycopg2

DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

# Members with broken MinIO URLs
BROKEN_MEMBERS = [12, 14, 16, 31, 175]

def generate_dicebear_url(member_id):
    """Generate DiceBear avatar URL"""
    seed = f"member-{member_id}"
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"

def fix_broken_minio():
    """Replace broken MinIO URLs with DiceBear avatars"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("\n🔧 Fixing Broken MinIO URLs")
    print("="*80)
    
    for member_id in BROKEN_MEMBERS:
        # Get member info
        cur.execute("""
            SELECT nama_lengkap, foto_profil_url
            FROM members
            WHERE id = %s
        """, (member_id,))
        
        result = cur.fetchone()
        if not result:
            print(f"⚠️  [{member_id}] Member not found")
            continue
        
        nama, old_url = result
        
        # Generate DiceBear URL
        new_url = generate_dicebear_url(member_id)
        
        # Update database
        cur.execute("""
            UPDATE members
            SET foto_profil_url = %s
            WHERE id = %s
        """, (new_url, member_id))
        
        print(f"✅ [{member_id}] {nama}")
        print(f"   Old: {old_url}")
        print(f"   New: {new_url}\n")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("="*80)
    print(f"✅ Fixed {len(BROKEN_MEMBERS)} members with DiceBear avatars")
    print("="*80)

if __name__ == "__main__":
    fix_broken_minio()
