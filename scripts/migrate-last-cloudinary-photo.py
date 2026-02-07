#!/usr/bin/env python3
"""
Migrate Remaining Cloudinary Photo to MinIO

Migrate the last remaining Cloudinary photo (Member 11) to MinIO storage
This script should be run ON THE SERVER for direct MinIO access
"""

import sys
import os
import time
import requests
import psycopg2
import boto3
from botocore.client import Config

# Configuration
MINIO_CONFIG = {
    'endpoint': 'drw-minio:9000',
    'access_key': 'drwcorp',
    'secret_key': 'Rahasiakita.88',
    'bucket': 'berkomunitas',
    'region': 'us-east-1',
    'public_url': 'http://storage.berkomunitas.com/berkomunitas'
}

DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

DRY_RUN = '--dry-run' in sys.argv

print('🔄 Migrate Cloudinary Photo to MinIO')
print('=' * 60)
print(f'Mode: {"🧪 DRY RUN" if DRY_RUN else "✅ LIVE MODE"}')
print()

def create_minio_client():
    """Initialize MinIO S3 client"""
    return boto3.client(
        's3',
        endpoint_url=f'http://{MINIO_CONFIG["endpoint"]}',
        aws_access_key_id=MINIO_CONFIG['access_key'],
        aws_secret_access_key=MINIO_CONFIG['secret_key'],
        region_name=MINIO_CONFIG['region'],
        config=Config(signature_version='s3v4')
    )

def download_from_cloudinary(url):
    """Download image from Cloudinary"""
    print(f'  ⬇️  Downloading from Cloudinary...')
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    print(f'  ✅ Downloaded ({len(response.content)} bytes)')
    return response.content

def upload_to_minio(image_data, member_id):
    """Upload image to MinIO"""
    print(f'  ⬆️  Uploading to MinIO...')
    
    s3_client = create_minio_client()
    
    # Determine file extension from data
    # Simple magic number detection
    if image_data.startswith(b'\x89PNG'):
        ext = 'png'
    elif image_data.startswith(b'\xff\xd8\xff'):
        ext = 'jpg'
    elif image_data.startswith(b'GIF'):
        ext = 'gif'
    else:
        ext = 'jpg'  # default
    
    # Generate filename
    timestamp = int(time.time() * 1000)
    filename = f'profile-pictures/migrated_{member_id}_{timestamp}.{ext}'
    content_type = f'image/{ext if ext != "jpg" else "jpeg"}'
    
    # Upload
    s3_client.put_object(
        Bucket=MINIO_CONFIG['bucket'],
        Key=filename,
        Body=image_data,
        ContentType=content_type
    )
    
    # Build public URL
    public_url = f'{MINIO_CONFIG["public_url"]}/{filename}'
    
    print(f'  ✅ Uploaded to MinIO')
    print(f'  📎 {public_url}')
    
    return public_url

def migrate_member_photo(member_id, nama, email, cloudinary_url):
    """Migrate single member photo"""
    print(f'\n📸 Migrating Member {member_id}: {nama}')
    print(f'  Old URL: {cloudinary_url[:70]}...')
    
    if DRY_RUN:
        print(f'  🧪 DRY RUN - Skipping actual migration')
        return None
    
    try:
        # Download from Cloudinary
        image_data = download_from_cloudinary(cloudinary_url)
        
        # Upload to MinIO
        new_url = upload_to_minio(image_data, member_id)
        
        print(f'  ✅ Migration successful!')
        return new_url
        
    except Exception as e:
        print(f'  ❌ Migration failed: {e}')
        raise

def update_database(member_id, new_url):
    """Update member's photo URL in database"""
    print(f'\n💾 Updating database...')
    
    if DRY_RUN:
        print(f'  🧪 DRY RUN - Would update member {member_id}')
        print(f'  New URL: {new_url}')
        return
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute(
        "UPDATE members SET foto_profil_url = %s WHERE id = %s",
        (new_url, member_id)
    )
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f'  ✅ Database updated')

def main():
    # Get members using Cloudinary
    print('📊 Finding members using Cloudinary...\n')
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, nama_lengkap, email, foto_profil_url
        FROM members
        WHERE foto_profil_url LIKE '%cloudinary.com%'
        ORDER BY id
    """)
    
    cloudinary_members = cursor.fetchall()
    cursor.close()
    conn.close()
    
    if not cloudinary_members:
        print('✅ No members using Cloudinary!')
        print('All photos already migrated to MinIO or other storage.')
        return
    
    print(f'Found {len(cloudinary_members)} member(s) using Cloudinary\n')
    print('=' * 60)
    
    # Migrate each member
    success_count = 0
    error_count = 0
    
    for member_id, nama, email, cloudinary_url in cloudinary_members:
        try:
            new_url = migrate_member_photo(member_id, nama, email, cloudinary_url)
            
            if new_url:
                update_database(member_id, new_url)
                success_count += 1
            elif DRY_RUN:
                success_count += 1
                
        except Exception as e:
            print(f'❌ Error: {e}')
            error_count += 1
    
    # Summary
    print()
    print('=' * 60)
    print('📊 Migration Summary')
    print('=' * 60)
    print(f'Total members: {len(cloudinary_members)}')
    
    if DRY_RUN:
        print(f'Would migrate: {success_count}')
        print()
        print('💡 Run without --dry-run to perform actual migration')
    else:
        print(f'✅ Migrated: {success_count}')
        print(f'❌ Failed: {error_count}')
        
        if success_count > 0:
            print()
            print('🎉 Migration complete!')
            print()
            print('Verify uploaded files:')
            print(f'  ssh root@213.190.4.159')
            print(f'  docker exec drw-minio mc ls local/berkomunitas/profile-pictures/')
            print()
            print('Test public access:')
            print(f'  curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_*')

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Migration interrupted')
        sys.exit(1)
    except Exception as e:
        print(f'\n\n❌ Fatal error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
