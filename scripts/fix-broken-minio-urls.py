#!/usr/bin/env python3
"""
Fix Broken MinIO URLs

Replace old MinIO URLs (213.190.4.159:9100) with correct subdomain (storage.berkomunitas.com)
"""

import sys
import psycopg2

# Configuration
DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

DRY_RUN = '--dry-run' in sys.argv

print('🔧 Fix Broken MinIO URLs')
print('=' * 60)
print(f'Mode: {"🧪 DRY RUN" if DRY_RUN else "✅ LIVE MODE"}')
print()

def main():
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Find members with broken MinIO URLs
    cursor.execute("""
        SELECT 
            id,
            nama_lengkap,
            email,
            foto_profil_url
        FROM members
        WHERE foto_profil_url LIKE '%213.190.4.159:9100%'
        ORDER BY id
    """)
    
    broken = cursor.fetchall()
    
    if not broken:
        print('✅ No broken URLs found!')
        cursor.close()
        conn.close()
        return
    
    print(f'Found {len(broken)} members with broken URLs\n')
    
    fixed_count = 0
    
    for member_id, nama, email, old_url in broken:
        # Replace old URL with correct subdomain
        new_url = old_url.replace(
            'http://213.190.4.159:9100/berkomunitas',
            'http://storage.berkomunitas.com/berkomunitas'
        )
        
        print(f'Member {member_id}: {nama or email}')
        print(f'  Old: {old_url[:70]}...')
        print(f'  New: {new_url[:70]}...')
        
        if not DRY_RUN:
            try:
                cursor.execute(
                    "UPDATE members SET foto_profil_url = %s WHERE id = %s",
                    (new_url, member_id)
                )
                print(f'  ✅ Updated')
                fixed_count += 1
            except Exception as e:
                print(f'  ❌ Failed: {e}')
        else:
            print(f'  🧪 Would update')
        
        print()
    
    if not DRY_RUN:
        conn.commit()
        print(f'\n✅ Fixed {fixed_count} members')
    else:
        print(f'\n🧪 Would fix {len(broken)} members')
        print('Run without --dry-run to apply fixes')
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted')
        sys.exit(1)
    except Exception as e:
        print(f'\n\n❌ Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
