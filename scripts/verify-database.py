"""
Check which database we're actually connected to and verify MinIO migration
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('DATABASE_URL')
u = urlparse(url)

print('='*60)
print('DATABASE CONNECTION INFO')
print('='*60)
print(f'🔗 DATABASE_URL from .env:')
print(f'   {url}')
print(f'\n📊 Parsed connection details:')
print(f'   Host: {u.hostname}')
print(f'   Port: {u.port}')
print(f'   Database: {u.path[1:]}')
print(f'   User: {u.username}')
print('='*60)

# Connect to verify
try:
    conn = psycopg2.connect(
        host=u.hostname,
        port=u.port,
        user=u.username,
        password=u.password,
        database=u.path[1:]
    )
    conn.autocommit = True  # Auto commit to avoid transaction errors
    cur = conn.cursor()
    
    # Get database name
    cur.execute("SELECT current_database()")
    db_name = cur.fetchone()[0]
    print(f'\n✅ Successfully connected to: {db_name}')
    
    # Check MinIO URLs (use foto_profil_url column)
    cur.execute("""
        SELECT count(*) as total_members,
               count(CASE WHEN foto_profil_url LIKE '%minio%' OR foto_profil_url LIKE '%213.190.4.159:9100%' THEN 1 END) as minio_count,
               count(CASE WHEN foto_profil_url LIKE '%cloudinary%' THEN 1 END) as cloudinary_count,
               count(CASE WHEN foto_profil_url IS NULL OR foto_profil_url = '' THEN 1 END) as no_photo_count
        FROM members
    """)
    
    stats = cur.fetchone()
    total, minio, cloudinary, no_photo = stats
    
    print('\n📸 PHOTO STORAGE STATISTICS')
    print('='*60)
    print(f'👥 Total members: {total}')
    print(f'✅ Using MinIO: {minio}')
    print(f'☁️  Using Cloudinary: {cloudinary}')
    print(f'❌ No photo: {no_photo}')
    print('='*60)
    
    # Show sample MinIO URLs
    if minio > 0:
        cur.execute("""
            SELECT nama_lengkap, foto_profil_url
            FROM members
            WHERE foto_profil_url LIKE '%minio%' OR foto_profil_url LIKE '%213.190.4.159:9100%'
            LIMIT 5
        """)
        print('\n🔍 Sample MinIO URLs:')
        for nama, url in cur.fetchall():
            print(f'   {nama}: {url[:80]}...')
    
    cur.close()
    conn.close()
    
    print(f'\n✅ CONFIRMED: All operations were done on database "{db_name}"')
    
except Exception as e:
    print(f'\n❌ Error: {e}')
