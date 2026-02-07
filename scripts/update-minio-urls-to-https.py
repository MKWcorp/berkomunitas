#!/usr/bin/env python3
"""
Update MinIO URLs from HTTP to HTTPS
After SSL certificate setup for storage.berkomunitas.com
"""

import psycopg2
import sys

# Database configuration
DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

def update_urls_to_https():
    """Update all MinIO URLs from HTTP to HTTPS"""
    
    try:
        # Connect to database
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Check current HTTP URLs
        print("\n📊 Checking current HTTP URLs...")
        cursor.execute("""
            SELECT id, nama_lengkap, foto_profil_url
            FROM members
            WHERE foto_profil_url LIKE 'http://storage.berkomunitas.com%'
            ORDER BY id
        """)
        
        http_urls = cursor.fetchall()
        
        if not http_urls:
            print("✅ No HTTP URLs found - all URLs already HTTPS or not MinIO!")
            conn.close()
            return
        
        print(f"📸 Found {len(http_urls)} photos with HTTP URLs:")
        for member_id, nama, url in http_urls:
            print(f"   - [{member_id}] {nama}: {url[:80]}...")
        
        # Confirm update
        print(f"\n⚠️  About to update {len(http_urls)} URLs from HTTP to HTTPS")
        confirm = input("Continue? (yes/no): ").strip().lower()
        
        if confirm != 'yes':
            print("❌ Update cancelled")
            conn.close()
            return
        
        # Update URLs
        print("\n🔄 Updating URLs to HTTPS...")
        cursor.execute("""
            UPDATE members
            SET foto_profil_url = REPLACE(
                foto_profil_url,
                'http://storage.berkomunitas.com',
                'https://storage.berkomunitas.com'
            )
            WHERE foto_profil_url LIKE 'http://storage.berkomunitas.com%'
        """)
        
        updated_count = cursor.rowcount
        conn.commit()
        
        print(f"✅ Updated {updated_count} URLs to HTTPS")
        
        # Verify update
        print("\n🔍 Verifying update...")
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url LIKE 'http://storage.berkomunitas.com%'
        """)
        remaining_http = cursor.fetchone()[0]
        
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url LIKE 'https://storage.berkomunitas.com%'
        """)
        https_count = cursor.fetchone()[0]
        
        print(f"\n📊 Final Status:")
        print(f"   - HTTP URLs remaining: {remaining_http}")
        print(f"   - HTTPS URLs total: {https_count}")
        
        if remaining_http == 0:
            print("\n✅ SUCCESS: All MinIO URLs now use HTTPS!")
        else:
            print(f"\n⚠️  WARNING: {remaining_http} HTTP URLs still remain")
        
        # Show sample updated URLs
        print("\n📸 Sample updated URLs:")
        cursor.execute("""
            SELECT id, nama_lengkap, foto_profil_url
            FROM members
            WHERE foto_profil_url LIKE 'https://storage.berkomunitas.com%'
            ORDER BY id
            LIMIT 5
        """)
        
        samples = cursor.fetchall()
        for member_id, nama, url in samples:
            print(f"   - [{member_id}] {nama}: {url[:80]}...")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Database connection closed")
        print("\n🎉 Update complete!")
        print("\n📝 Next steps:")
        print("   1. Update Vercel environment: MINIO_PUBLIC_URL=https://storage.berkomunitas.com/berkomunitas")
        print("   2. Redeploy Next.js application")
        print("   3. Test in browser - no more Mixed Content warnings!")
        
    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

def check_current_status():
    """Check current URL status without updating"""
    
    try:
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Count by protocol
        print("\n📊 Current URL Status:")
        
        # HTTP MinIO
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url LIKE 'http://storage.berkomunitas.com%'
        """)
        http_minio = cursor.fetchone()[0]
        print(f"   - HTTP MinIO: {http_minio}")
        
        # HTTPS MinIO
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url LIKE 'https://storage.berkomunitas.com%'
        """)
        https_minio = cursor.fetchone()[0]
        print(f"   - HTTPS MinIO: {https_minio}")
        
        # DiceBear (always HTTPS)
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url LIKE '%api.dicebear.com%'
        """)
        dicebear = cursor.fetchone()[0]
        print(f"   - DiceBear (HTTPS): {dicebear}")
        
        # Google Photos (always HTTPS)
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url LIKE '%googleusercontent.com%'
        """)
        google = cursor.fetchone()[0]
        print(f"   - Google Photos (HTTPS): {google}")
        
        # Cloudinary (should be 0)
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url LIKE '%cloudinary.com%'
        """)
        cloudinary = cursor.fetchone()[0]
        print(f"   - Cloudinary: {cloudinary}")
        
        # NULL
        cursor.execute("""
            SELECT COUNT(*) FROM members
            WHERE foto_profil_url IS NULL OR foto_profil_url = ''
        """)
        null_count = cursor.fetchone()[0]
        print(f"   - NULL/Empty: {null_count}")
        
        # Total
        cursor.execute("SELECT COUNT(*) FROM members")
        total = cursor.fetchone()[0]
        print(f"   - TOTAL: {total}")
        
        cursor.close()
        conn.close()
        
        if http_minio > 0:
            print(f"\n⚠️  Found {http_minio} HTTP MinIO URLs - need to update to HTTPS")
            print("   Run: python scripts/update-minio-urls-to-https.py")
        else:
            print("\n✅ All MinIO URLs are HTTPS - no update needed!")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 MinIO URL HTTPS Updater")
    print("=" * 60)
    
    if len(sys.argv) > 1 and sys.argv[1] == '--check':
        check_current_status()
    else:
        update_urls_to_https()
