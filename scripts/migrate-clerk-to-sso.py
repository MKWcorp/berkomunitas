"""
Migration Script: Link Clerk Users to SSO (Python Version)

Tujuan:
- Update user lama (Clerk) dengan email dari tabel member_emails
- Mempersiapkan mereka untuk login dengan Google SSO
- Data lama tetap utuh (clerk_id tetap tersimpan untuk backward compatibility)

Usage:
    python scripts/migrate-clerk-to-sso.py
"""

import os
import sys
from datetime import datetime
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
import json

# Load environment variables
load_dotenv()

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def migrate_clerk_to_sso():
    """Main migration function"""
    print("🚀 Starting Clerk to SSO Migration...\n")
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # 1. Get all users with clerk_id but no email
        cur.execute("""
            SELECT id, clerk_id, nama_lengkap 
            FROM members 
            WHERE clerk_id IS NOT NULL 
            AND email IS NULL
        """)
        users_without_email = cur.fetchall()
        
        print(f"📊 Found {len(users_without_email)} users with Clerk ID but no email\n")
        
        updated = 0
        skipped = 0
        errors = 0
        
        for user in users_without_email:
            try:
                user_id = user['id']
                clerk_id = user['clerk_id']
                nama = user['nama_lengkap'] or 'No Name'
                
                # 2. Find email from member_emails table (prioritize primary email)
                cur.execute("""
                    SELECT email FROM member_emails 
                    WHERE clerk_id = %s 
                    ORDER BY is_primary DESC NULLS LAST
                    LIMIT 1
                """, (clerk_id,))
                
                email_record = cur.fetchone()
                
                if email_record:
                    email = email_record['email']
                    
                    # 3. Check if email already exists in members table
                    cur.execute("""
                        SELECT id FROM members WHERE email = %s AND id != %s
                    """, (email, user_id))
                    
                    existing_user = cur.fetchone()
                    
                    if existing_user:
                        skipped += 1
                        print(f"⚠️  Skipped user {user_id} ({nama}) - Email {email} already exists for another user")
                        continue
                    
                    # 4. Update members table with email
                    sso_metadata = json.dumps({
                        'migratedFromClerk': True,
                        'clerkId': clerk_id,
                        'migrationDate': datetime.now().isoformat(),
                        'readyForGoogleSSO': True
                    })
                    
                    cur.execute("""
                        UPDATE members 
                        SET email = %s, 
                            sso_metadata = %s::jsonb
                        WHERE id = %s
                    """, (email, sso_metadata, user_id))
                    
                    conn.commit()
                    updated += 1
                    print(f"✅ Updated user {user_id} ({nama}) - Email: {email}")
                    
                else:
                    skipped += 1
                    print(f"⚠️  Skipped user {user_id} ({nama}) - No email found in member_emails")
                    
            except Exception as e:
                errors += 1
                conn.rollback()
                print(f"❌ Error updating user {user_id}: {str(e)}")
        
        # Summary
        print('\n' + '='*60)
        print('📈 Migration Summary:')
        print(f"   ✅ Updated: {updated}")
        print(f"   ⚠️  Skipped: {skipped} (no email or duplicate)")
        print(f"   ❌ Errors: {errors}")
        print('='*60)
        
        print('\n🎉 Migration completed!')
        print('\n💡 Next steps:')
        print('   1. User lama sekarang sudah punya email di tabel members')
        print('   2. Ketika mereka login dengan Google (pakai email yang sama),')
        print('      sistem akan auto-link dengan google_id')
        print('   3. Data lama mereka (coin, loyalty_point, dll) tetap utuh!')
        print('\n📝 Testing:')
        print('   - Coba login dengan akun Google yang emailnya sama dengan user lama')
        print('   - Sistem akan otomatis mendeteksi dan link akun Clerk dengan Google')
        
    except Exception as e:
        print(f"\n❌ Migration failed: {str(e)}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    print("="*60)
    print("   CLERK TO SSO MIGRATION SCRIPT")
    print("="*60)
    print()
    
    response = input("⚠️  This will update user data. Continue? (yes/no): ")
    if response.lower() in ['yes', 'y']:
        migrate_clerk_to_sso()
    else:
        print("❌ Migration cancelled")
