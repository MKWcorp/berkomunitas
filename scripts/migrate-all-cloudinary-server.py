#!/usr/bin/env python3
"""
Complete Cloudinary to MinIO Migration Script (SERVER VERSION)
**RUN THIS ON SERVER** - Uses internal drw-minio:9000 endpoint

Usage:
    python3 migrate-all-cloudinary-server.py              # Run migration
    python3 migrate-all-cloudinary-server.py --dry-run    # Preview only
    python3 migrate-all-cloudinary-server.py --check      # Check status only
"""

import psycopg2
import requests
import os
from urllib.parse import urlparse
import sys

try:
    from minio import Minio
    from io import BytesIO
    USE_MINIO_SDK = True
except ImportError:
    import boto3
    from botocore.client import Config
    USE_MINIO_SDK = False
    print("⚠️  MinIO SDK not found, using boto3")

# Database Configuration
DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

# MinIO Configuration (Server Host - Exposed Port)
MINIO_CONFIG = {
    'endpoint': 'localhost:9100',  # MinIO S3 API exposed on host port 9100
    'access_key': 'drwcorp',
    'secret_key': 'Rahasiakita.88',
    'bucket': 'berkomunitas',
    'public_url': 'http://storage.berkomunitas.com/berkomunitas'
}

def get_cloudinary_members():
    """Get all members with Cloudinary profile pictures"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    cur.execute("""
        SELECT id, nama_lengkap, email, foto_profil_url
        FROM members
        WHERE foto_profil_url LIKE '%cloudinary.com%'
        ORDER BY id
    """)
    
    members = cur.fetchall()
    cur.close()
    conn.close()
    
    return members

def download_from_cloudinary(url):
    """Download image from Cloudinary"""
    try:
        response = requests.get(url, timeout=30)
        if response.status_code == 200:
            return response.content
        else:
            print(f"    ❌ HTTP {response.status_code}")
            return None
    except Exception as e:
        print(f"    ❌ Download error: {e}")
        return None

def upload_to_minio(image_data, filename):
    """Upload image to MinIO using internal endpoint"""
    try:
        if USE_MINIO_SDK:
            # Use MinIO SDK (recommended)
            client = Minio(
                MINIO_CONFIG['endpoint'],
                access_key=MINIO_CONFIG['access_key'],
                secret_key=MINIO_CONFIG['secret_key'],
                secure=False
            )
            
            # Determine content type
            content_type = 'image/jpeg'
            if filename.lower().endswith('.png'):
                content_type = 'image/png'
            elif filename.lower().endswith('.webp'):
                content_type = 'image/webp'
            
            # Upload
            object_key = f'profile-pictures/{filename}'
            data_stream = BytesIO(image_data)
            client.put_object(
                bucket_name=MINIO_CONFIG['bucket'],
                object_name=object_key,
                data=data_stream,
                length=len(image_data),
                content_type=content_type
            )
            
            # Return public URL
            public_url = f"{MINIO_CONFIG['public_url']}/{object_key}"
            return public_url
        else:
            # Use boto3 fallback
            s3_client = boto3.client(
                's3',
                endpoint_url=f"http://{MINIO_CONFIG['endpoint']}",
                aws_access_key_id=MINIO_CONFIG['access_key'],
                aws_secret_access_key=MINIO_CONFIG['secret_key'],
                config=Config(signature_version='s3v4'),
                region_name='us-east-1'
            )
            
            content_type = 'image/jpeg'
            if filename.lower().endswith('.png'):
                content_type = 'image/png'
            elif filename.lower().endswith('.webp'):
                content_type = 'image/webp'
            
            object_key = f'profile-pictures/{filename}'
            s3_client.put_object(
                Bucket=MINIO_CONFIG['bucket'],
                Key=object_key,
                Body=image_data,
                ContentType=content_type
            )
            
            public_url = f"{MINIO_CONFIG['public_url']}/{object_key}"
            return public_url
        
    except Exception as e:
        print(f"    ❌ MinIO upload error: {e}")
        return None

def update_database(member_id, new_url):
    """Update member's profile picture URL in database"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    cur.execute("""
        UPDATE members
        SET foto_profil_url = %s
        WHERE id = %s
    """, (new_url, member_id))
    
    conn.commit()
    cur.close()
    conn.close()

def migrate_member(member, dry_run=False):
    """Migrate single member from Cloudinary to MinIO"""
    member_id, nama_lengkap, email, cloudinary_url = member
    
    print(f"\n[{member_id}] {nama_lengkap} ({email})")
    print(f"    📥 Downloading from Cloudinary...")
    
    # Extract filename from URL
    parsed_url = urlparse(cloudinary_url)
    filename = os.path.basename(parsed_url.path)
    
    # Add timestamp prefix
    import time
    timestamp = int(time.time())
    filename = f"{timestamp}_{filename}"
    
    # Download
    image_data = download_from_cloudinary(cloudinary_url)
    if not image_data:
        return False
    
    print(f"    ✅ Downloaded {len(image_data)} bytes")
    
    if dry_run:
        print(f"    🔍 [DRY RUN] Would upload as: {filename}")
        return True
    
    # Upload to MinIO
    print(f"    📤 Uploading to MinIO...")
    minio_url = upload_to_minio(image_data, filename)
    if not minio_url:
        return False
    
    print(f"    ✅ Uploaded to: {minio_url}")
    
    # Update database
    print(f"    💾 Updating database...")
    update_database(member_id, minio_url)
    print(f"    ✅ Database updated!")
    
    return True

def check_status():
    """Check current migration status"""
    members = get_cloudinary_members()
    
    print("\n" + "="*60)
    print("📊 CLOUDINARY MIGRATION STATUS CHECK")
    print("="*60)
    
    if not members:
        print("\n✅ No members using Cloudinary!")
        print("   All profile pictures have been migrated.")
    else:
        print(f"\n❌ Found {len(members)} members still using Cloudinary:\n")
        for member_id, nama_lengkap, email, url in members:
            print(f"   [{member_id}] {nama_lengkap} ({email})")
            print(f"        {url}\n")
    
    print("="*60)

def main():
    """Main migration function"""
    dry_run = '--dry-run' in sys.argv
    check_only = '--check' in sys.argv
    
    print("\n" + "="*60)
    print("🚀 CLOUDINARY TO MINIO MIGRATION (SERVER)")
    print("="*60)
    print("📍 Using internal endpoint: " + MINIO_CONFIG['endpoint'])
    print("="*60)
    
    # Check status only
    if check_only:
        check_status()
        return
    
    # Get all Cloudinary members
    print("\n📋 Fetching members with Cloudinary profile pictures...")
    members = get_cloudinary_members()
    
    if not members:
        print("\n✅ No members using Cloudinary!")
        return
    
    print(f"\n📊 Found {len(members)} members to migrate")
    
    if dry_run:
        print("\n🔍 DRY RUN MODE - No changes will be made\n")
    else:
        print("\n⚠️  LIVE MODE - Changes will be permanent\n")
    
    # Migrate each member
    success_count = 0
    error_count = 0
    
    for member in members:
        try:
            if migrate_member(member, dry_run):
                success_count += 1
            else:
                error_count += 1
        except Exception as e:
            print(f"    ❌ Migration error: {e}")
            error_count += 1
    
    # Summary
    print("\n" + "="*60)
    print("📊 MIGRATION SUMMARY")
    print("="*60)
    print(f"✅ Success: {success_count}")
    print(f"❌ Errors:  {error_count}")
    print(f"📊 Total:   {len(members)}")
    print("="*60)
    
    if not dry_run and success_count > 0:
        print("\n✅ Migration complete!")
        print(f"   {success_count} profile pictures migrated to MinIO")
        print(f"   Public URL: {MINIO_CONFIG['public_url']}/profile-pictures/")
        
        remaining = get_cloudinary_members()
        if remaining:
            print(f"\n⚠️  {len(remaining)} members still using Cloudinary")
        else:
            print("\n🎉 ALL members successfully migrated to MinIO!")

if __name__ == "__main__":
    main()
