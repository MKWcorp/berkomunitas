#!/usr/bin/env python3
"""
Migration Script: Cloudinary to MinIO (Server-Side)

Run this script ON THE SERVER where drw-minio container is running.
This script can access drw-minio:9000 via internal Docker network.

Usage:
  # Upload to server
  scp scripts/migrate-cloudinary-to-minio-server.py root@213.190.4.159:/root/

  # SSH and install dependencies
  ssh root@213.190.4.159
  pip3 install boto3 requests psycopg2-binary python-dotenv

  # Run migration
  python3 /root/migrate-cloudinary-to-minio-server.py

  # Or with dry-run
  python3 /root/migrate-cloudinary-to-minio-server.py --dry-run
"""

import sys
import os
import time
import requests
import psycopg2
from datetime import datetime
from pathlib import Path
import boto3
from botocore.client import Config

# MinIO Configuration (Internal Docker Network)
MINIO_ENDPOINT = 'drw-minio:9000'  # Internal hostname
MINIO_ACCESS_KEY = 'drwcorp'
MINIO_SECRET_KEY = 'Rahasiakita.88'
MINIO_BUCKET = 'berkomunitas'
MINIO_REGION = 'us-east-1'
MINIO_PUBLIC_URL = 'http://storage.berkomunitas.com/berkomunitas'

# Database Configuration
DB_HOST = '213.190.4.159'
DB_PORT = '5432'
DB_NAME = 'berkomunitas_db'
DB_USER = 'berkomunitas'
DB_PASSWORD = 'berkomunitas688'

# Dry run mode
DRY_RUN = '--dry-run' in sys.argv

print('🚀 Starting Cloudinary to MinIO Migration (Server-Side)')
print(f'Mode: {"🧪 DRY RUN (no changes)" if DRY_RUN else "✅ LIVE MODE"}')
print('')
print(f'📡 MinIO Endpoint: {MINIO_ENDPOINT}')
print(f'📦 Bucket: {MINIO_BUCKET}')
print(f'🔗 Public URL: {MINIO_PUBLIC_URL}')
print('')

# Initialize MinIO client
s3_client = boto3.client(
    's3',
    endpoint_url=f'http://{MINIO_ENDPOINT}',
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    region_name=MINIO_REGION,
    config=Config(signature_version='s3v4')
)

def download_image(url):
    """Download image from Cloudinary"""
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.content
    except Exception as e:
        raise Exception(f"Failed to download: {str(e)}")

def upload_to_minio(image_data, filename, content_type='image/jpeg'):
    """Upload image to MinIO"""
    try:
        key = f'profile-pictures/{filename}'
        
        s3_client.put_object(
            Bucket=MINIO_BUCKET,
            Key=key,
            Body=image_data,
            ContentType=content_type
        )
        
        # Return public URL
        public_url = f'{MINIO_PUBLIC_URL}/profile-pictures/{filename}'
        return public_url
    
    except Exception as e:
        raise Exception(f"Failed to upload to MinIO: {str(e)}")

def get_members_with_cloudinary():
    """Get all members with Cloudinary URLs"""
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, nama_lengkap, foto_profil_url 
        FROM members 
        WHERE foto_profil_url LIKE '%cloudinary.com%'
        ORDER BY id
    """)
    
    members = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return members

def update_member_url(member_id, new_url):
    """Update member's profile picture URL"""
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE members SET foto_profil_url = %s WHERE id = %s",
        (new_url, member_id)
    )
    conn.commit()
    cursor.close()
    conn.close()

def main():
    print('📊 Fetching members with Cloudinary images...\n')
    
    members = get_members_with_cloudinary()
    
    if not members:
        print('✅ No members found with Cloudinary URLs')
        return
    
    print(f'Found {len(members)} members with Cloudinary images\n')
    
    success_count = 0
    error_count = 0
    errors = []
    
    for member_id, nama_lengkap, cloudinary_url in members:
        try:
            print(f'📸 Processing: {member_id} - {nama_lengkap}')
            print(f'   Old URL: {cloudinary_url[:60]}...')
            
            if DRY_RUN:
                print('   🧪 DRY RUN - Skipping actual migration\n')
                success_count += 1
                continue
            
            # Download from Cloudinary
            print('   ⬇️  Downloading from Cloudinary...', end=' ')
            image_data = download_image(cloudinary_url)
            print(f'✅ ({len(image_data)} bytes)')
            
            # Determine file extension
            ext = 'jpg'
            if '.png' in cloudinary_url.lower():
                ext = 'png'
            elif '.gif' in cloudinary_url.lower():
                ext = 'gif'
            
            # Generate filename
            timestamp = int(time.time() * 1000)
            filename = f'migrated_{member_id}_{timestamp}.{ext}'
            content_type = f'image/{ext if ext != "jpg" else "jpeg"}'
            
            # Upload to MinIO
            print(f'   ⬆️  Uploading to MinIO...', end=' ')
            new_url = upload_to_minio(image_data, filename, content_type)
            print('✅')
            
            # Update database
            print('   💾 Updating database...', end=' ')
            update_member_url(member_id, new_url)
            print('✅')
            
            print(f'   New URL: {new_url}')
            print(f'   ✅ Success!\n')
            
            success_count += 1
            
            # Small delay to avoid overwhelming services
            time.sleep(0.5)
            
        except Exception as e:
            error_count += 1
            error_msg = f'Member {member_id}: {str(e)}'
            errors.append(error_msg)
            print(f'   ❌ Error: {str(e)}\n')
    
    # Summary
    print('═' * 60)
    print('📊 Migration Summary')
    print('═' * 60)
    print(f'✅ Success: {success_count}')
    print(f'❌ Errors: {error_count}')
    print(f'📊 Total: {len(members)}')
    
    if errors:
        print('\n❌ Error Details:')
        for error in errors:
            print(f'   - {error}')
    
    print('')
    
    if not DRY_RUN and success_count > 0:
        print('✅ Migration Complete!')
        print('')
        print('🔍 Verify uploaded files:')
        print('   docker exec drw-minio mc ls local/berkomunitas/profile-pictures/')
        print('')
        print('🌐 Test public access:')
        print('   curl -I http://storage.berkomunitas.com/berkomunitas/profile-pictures/migrated_*')
    
    return success_count, error_count

if __name__ == '__main__':
    try:
        success, errors = main()
        sys.exit(0 if errors == 0 else 1)
    except KeyboardInterrupt:
        print('\n⚠️  Migration interrupted by user')
        sys.exit(1)
    except Exception as e:
        print(f'\n❌ Fatal error: {str(e)}')
        sys.exit(1)
