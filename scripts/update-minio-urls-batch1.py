"""
Direct SQL Update: Cloudinary URLs to MinIO URLs
Maps the uploaded MinIO files to database records
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

# Manual mapping from migration output - COMPLETE LIST (28 members)
# Format: member_id: new_minio_url
MIGRATION_MAP = {
    138: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_138_1770440630220.jpg',
    222: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_222_1770440631009.jpg',
    59: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_59_1770440631851.jpg',
    90: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_90_1770440632635.jpg',
    183: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_183_1770440633444.jpg',
    79: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_79_1770440634214.jpg',
    82: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_82_1770440635024.jpg',
    197: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_197_1770440635839.jpg',
    108: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_108_1770440636650.jpg',
    99: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_99_1770440630759.jpg',
    129: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_129_1770440631428.jpg',
    46: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_46_1770440632120.jpg',
    11: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_11_1770440599212.png',
    186: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_186_1770440599828.jpg',
    18: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_18_1770440600491.jpg',
    175: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_175_1770440601122.jpg',
    16: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_16_1770440601754.jpg',
    31: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_31_1770440602376.jpg',
    12: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_12_1770440602997.jpg',
    14: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_14_1770440603627.jpg',
    42: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_42_1770440604255.jpg',
    37: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_37_1770440604908.jpg',
    126: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_126_1770440605572.jpg',
    187: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_187_1770440606190.png',
    97: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_97_1770440606851.jpg',
    95: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_95_1770440607497.jpg',
    15: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_15_1770440608112.png',
    9: 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_9_1770440608731.jpg',
}

def update_database():
    url = os.getenv('DATABASE_URL')
    u = urlparse(url)

    conn = psycopg2.connect(
        host=u.hostname,
        port=u.port,
        user=u.username,
        password=u.password,
        database=u.path[1:]
    )
    cur = conn.cursor()

    print('🔄 Starting database URL update...\n')

    updated = 0
    errors = 0

    for member_id, minio_url in MIGRATION_MAP.items():
        try:
            # Get current URL
            cur.execute("SELECT nama_lengkap, foto_profil_url FROM members WHERE id = %s", (member_id,))
            result = cur.fetchone()
            
            if not result:
                print(f'❌ Member {member_id}: Not found in database')
                errors += 1
                continue
            
            nama, old_url = result
            print(f'[{member_id}] {nama or "No name"}')
            print(f'  Old: {old_url}')
            print(f'  New: {minio_url}')
            
            # Update URL
            cur.execute(
                "UPDATE members SET foto_profil_url = %s WHERE id = %s",
                (minio_url, member_id)
            )
            conn.commit()
            
            print(f'  ✅ Updated!\n')
            updated += 1
            
        except Exception as e:
            print(f'  ❌ Error: {e}\n')
            conn.rollback()
            errors += 1

    print('='*60)
    print('SUMMARY')
    print('='*60)
    print(f'✅ Updated: {updated}')
    print(f'❌ Errors: {errors}')
    print(f'📊 Total: {len(MIGRATION_MAP)}')
    print('='*60)

    # Check remaining Cloudinary URLs
    cur.execute("SELECT COUNT(*) FROM members WHERE foto_profil_url LIKE '%cloudinary.com%'")
    remaining = cur.fetchone()[0]
    print(f'\n📊 Remaining Cloudinary URLs: {remaining}')

    if remaining > 0:
        print('\n⚠️  There are more Cloudinary URLs that need manual mapping.')
        print('Run the full migration script again after fixing Prisma schema sync.')

    cur.close()
    conn.close()

if __name__ == '__main__':
    update_database()
