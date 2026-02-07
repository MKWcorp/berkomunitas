#!/usr/bin/env python3
"""
Fix 3 members with broken Cloudinary URLs (404)
Generate DiceBear avatars for Member 17, 37, 61
"""

import psycopg2

DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

# Members with broken Cloudinary photos (404)
BROKEN_MEMBERS = {
    17: 'Eri',
    37: 'Deni Kristanto',
    61: 'Raishyad Ari Lantara'
}

def generate_dicebear_url(member_id, name):
    """Generate DiceBear avatar URL"""
    # Using member ID as seed for consistency
    seed = f"member-{member_id}"
    return f"https://api.dicebear.com/7.x/avataaars/svg?seed={seed}"

def fix_broken_cloudinary():
    """Replace broken Cloudinary URLs with DiceBear avatars"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    print("\n🔧 Fixing Broken Cloudinary URLs")
    print("="*60)
    
    fixed_count = 0
    
    for member_id, name in BROKEN_MEMBERS.items():
        # Generate DiceBear URL
        dicebear_url = generate_dicebear_url(member_id, name)
        
        # Update database
        cur.execute("""
            UPDATE members
            SET foto_profil_url = %s
            WHERE id = %s
        """, (dicebear_url, member_id))
        
        print(f"✅ [{member_id}] {name}")
        print(f"   New URL: {dicebear_url}\n")
        
        fixed_count += 1
    
    conn.commit()
    cur.close()
    conn.close()
    
    print("="*60)
    print(f"✅ Fixed {fixed_count} members with DiceBear avatars")
    print("="*60)

if __name__ == "__main__":
    fix_broken_cloudinary()
