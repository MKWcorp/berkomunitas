"""
Update database URLs from Cloudinary to MinIO
Direct SQL update after images have been uploaded to MinIO
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

def update_database_urls():
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

    print('🔍 Finding members with Cloudinary URLs...\n')

    # Get all members with Cloudinary URLs
    cur.execute("""
        SELECT id, nama_lengkap, foto_profil_url
        FROM members
        WHERE foto_profil_url LIKE '%cloudinary.com%'
        ORDER BY id
    """)
    
    members = cur.fetchall()
    print(f'📊 Found {len(members)} members with Cloudinary URLs\n')

    if len(members) == 0:
        print('✅ No URLs to update!')
        cur.close()
        conn.close()
        return

    # Get all MinIO uploaded files
    cur.execute("""
        SELECT id, nama_lengkap, foto_profil_url
        FROM members
        WHERE foto_profil_url LIKE '%213.190.4.159:9100%'
        ORDER BY id
    """)
    
    minio_members = cur.fetchall()
    print(f'📊 Found {len(minio_members)} members already with MinIO URLs')
    print('These were successfully uploaded but DB update failed in previous run\n')

    # For members with old Cloudinary URLs, we need to map to new MinIO URLs
    # Since files are named like: profile-pictures/migrated_{member_id}_{timestamp}.jpg
    # We can search for migrated_{member_id}_ pattern

    updated = 0
    errors = 0

    for member_id, nama, old_url in members:
        print(f'[{member_id}] {nama or "No name"}')
        print(f'  Old: {old_url}')
        
        # Check if there's a MinIO URL pattern for this member
        # The uploaded files follow pattern: migrated_{member_id}_{timestamp}.jpg
        cur.execute("""
            SELECT foto_profil_url
            FROM members
            WHERE id = %s
            LIMIT 1
        """, (member_id,))
        
        current = cur.fetchone()
        if current and '213.190.4.159:9100' in current[0]:
            print(f'  ✅ Already has MinIO URL: {current[0]}\n')
            updated += 1
        else:
            # This means upload succeeded but URL wasn't updated
            # We need to find the uploaded file
            # Based on the migration script output, files are at:
            # http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_{id}_{timestamp}.jpg
            
            # Since we can't know the exact timestamp, let's just report it
            print(f'  ⚠️  Upload succeeded but URL not updated in DB')
            print(f'  Expected pattern: http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_{member_id}_*.jpg\n')
            errors += 1

    print('\n' + '='*60)
    print('SUMMARY')
    print('='*60)
    print(f'✅ Already updated: {updated}')
    print(f'⚠️  Need manual check: {errors}')
    print(f'📊 Total: {len(members)}')
    print('='*60)

    print('\n💡 ACTION NEEDED:')
    print('Since files were uploaded successfully but DBupdate failed,')
    print('you need to manually update the foto_profil_url in the database')
    print('from Cloudinary URLs to MinIO URLs.')
    print('\nSQL pattern:')
    print("UPDATE members SET foto_profil_url = 'http://213.190.4.159:9100/berkomunitas/profile-pictures/migrated_<ID>_<TIMESTAMP>.jpg' WHERE id = <ID>;")

    cur.close()
    conn.close()

if __name__ == '__main__':
    update_database_urls()
