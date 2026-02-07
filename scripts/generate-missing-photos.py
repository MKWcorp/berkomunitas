#!/usr/bin/env python3
"""
Generate DiceBear avatars for all members without profile pictures
"""

import psycopg2

DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

def generate_dicebear_url(member_id):
    """Generate DiceBear avatar URL"""
    seed = f"member-{member_id}"
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"

def generate_missing_photos():
    """Generate avatars for members without photos"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    # Find members without photos (NULL or empty)
    cur.execute("""
        SELECT id, nama_lengkap, email
        FROM members
        WHERE foto_profil_url IS NULL 
           OR foto_profil_url = ''
           OR TRIM(foto_profil_url) = ''
        ORDER BY id
    """)
    
    members = cur.fetchall()
    
    print("\n🎨 Generating Profile Pictures")
    print("="*80)
    
    if not members:
        print("✅ All members already have profile pictures!")
        print("="*80)
        cur.close()
        conn.close()
        return
    
    print(f"📊 Found {len(members)} members without photos\n")
    
    fixed_count = 0
    
    for member_id, nama, email in members:
        # Generate DiceBear URL
        avatar_url = generate_dicebear_url(member_id)
        
        # Update database
        cur.execute("""
            UPDATE members
            SET foto_profil_url = %s
            WHERE id = %s
        """, (avatar_url, member_id))
        
        print(f"✅ [{member_id}] {nama} ({email})")
        print(f"   Avatar: {avatar_url}\n")
        
        fixed_count += 1
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("="*80)
    print(f"✅ Generated {fixed_count} profile pictures!")
    print("="*80)

if __name__ == "__main__":
    generate_missing_photos()
