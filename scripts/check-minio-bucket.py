"""
List all objects in MinIO bucket to verify uploaded files
"""
from minio import Minio
import os
from dotenv import load_dotenv

load_dotenv()

# Configure MinIO client
client = Minio(
    os.getenv('MINIO_ENDPOINT'),
    access_key=os.getenv('MINIO_ACCESS_KEY'),
    secret_key=os.getenv('MINIO_SECRET_KEY'),
    secure=False  # HTTP not HTTPS
)

bucket = os.getenv('MINIO_BUCKET')

print('='*60)
print(f'📦 Checking MinIO bucket: {bucket}')
print(f'🔗 Endpoint: {os.getenv("MINIO_ENDPOINT")}')
print('='*60)

# Check if bucket exists
if not client.bucket_exists(bucket):
    print(f'\n❌ Bucket "{bucket}" does not exist!')
    print('\n📋 Available buckets:')
    for b in client.list_buckets():
        print(f'   - {b.name}')
else:
    print(f'\n✅ Bucket "{bucket}" exists')
    
    # List all objects
    objects = list(client.list_objects(bucket, recursive=True))
    
    print(f'\n📊 Total objects in bucket: {len(objects)}')
    
    if len(objects) > 0:
        print(f'\n📁 Files in bucket:')
        for obj in objects[:50]:  # Show first 50
            size_kb = obj.size / 1024
            print(f'   {obj.object_name} ({size_kb:.1f} KB)')
        
        if len(objects) > 50:
            print(f'\n   ... and {len(objects) - 50} more files')
        
        # Check for profile-pictures folder
        profile_pics = [obj for obj in objects if 'profile-picture' in obj.object_name]
        print(f'\n📸 Profile pictures: {len(profile_pics)}')
        
        # Check for migrated files
        migrated = [obj for obj in objects if 'migrated_' in obj.object_name]
        print(f'🔄 Migrated files: {len(migrated)}')
        
        if migrated:
            print('\n🔍 Sample migrated files:')
            for obj in migrated[:5]:
                print(f'   {obj.object_name}')
    else:
        print('\n⚠️  Bucket is EMPTY!')

print('='*60)
