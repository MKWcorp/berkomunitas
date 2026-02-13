"""
Fix duplicate email users
Safely remove duplicate users created by SSO login
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables
load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

# Fix DATABASE_URL - remove schema parameter if present (psycopg2 doesn't support it)
if DATABASE_URL and '?schema=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split('?schema=')[0]

def main():
    print("=" * 60)
    print("FIX DUPLICATE EMAIL USERS")
    print("=" * 60)
    
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Step 1: Find all duplicate emails
    print("\n📧 Step 1: Finding duplicate emails...")
    cur.execute("""
        SELECT email, COUNT(*) as count, array_agg(id ORDER BY id) as user_ids
        FROM members
        WHERE email IS NOT NULL AND email != ''
        GROUP BY email
        HAVING COUNT(*) > 1
    """)
    
    duplicates = cur.fetchall()
    
    if not duplicates:
        print("✅ No duplicate emails found!")
        conn.close()
        return
    
    print(f"\n⚠️  Found {len(duplicates)} duplicate email(s):")
    for dup in duplicates:
        print(f"   - Email: {dup['email']}")
        print(f"     User IDs: {dup['user_ids']}")
    
    # Step 2: For each duplicate, check which user has more data
    print("\n🔍 Step 2: Analyzing each duplicate...")
    
    for dup in duplicates:
        email = dup['email']
        user_ids = dup['user_ids']
        
        print(f"\n  Email: {email}")
        print(f"  User IDs: {user_ids}")
        
        user_details = []
        for user_id in user_ids:
            # Get user details and count related data
            cur.execute("""
                SELECT 
                    m.id,
                    m.nama_lengkap,
                    m.email,
                    m.google_id,
                    m.clerk_id,
                    m.tanggal_daftar,
                    m.coin,
                    m.loyalty_point,
                    (SELECT COUNT(*) FROM task_submissions WHERE member_id = m.id) as task_count,
                    (SELECT COUNT(*) FROM coin_history WHERE member_id = m.id) as coin_history_count,
                    (SELECT COUNT(*) FROM loyalty_point_history WHERE member_id = m.id) as loyalty_history_count,
                    (SELECT COUNT(*) FROM profile_wall_posts WHERE author_id = m.id) as post_count,
                    (SELECT COUNT(*) FROM notifications WHERE id_member = m.id) as notification_count
                FROM members m
                WHERE m.id = %s
            """, (user_id,))
            
            user_data = cur.fetchone()
            user_details.append(user_data)
            
            print(f"\n    User ID {user_id}:")
            print(f"      Name: {user_data['nama_lengkap']}")
            print(f"      Email: {user_data['email']}")
            print(f"      Google ID: {user_data['google_id']}")
            print(f"      Clerk ID: {user_data['clerk_id']}")
            print(f"      Registered: {user_data['tanggal_daftar']}")
            print(f"      Coins: {user_data['coin']}, Loyalty: {user_data['loyalty_point']}")
            print(f"      Tasks: {user_data['task_count']}")
            print(f"      Coin History: {user_data['coin_history_count']}")
            print(f"      Loyalty History: {user_data['loyalty_history_count']}")
            print(f"      Posts: {user_data['post_count']}")
            print(f"      Notifications: {user_data['notification_count']}")
        
        # Determine which user to keep (the one with more data or older registration)
        # Sort by data activity and registration date
        user_details_sorted = sorted(
            user_details,
            key=lambda x: (
                x['task_count'] + x['coin_history_count'] + x['loyalty_history_count'] + x['post_count'],
                x['tanggal_daftar'] or '2099-01-01'  # Older registration first
            ),
            reverse=True
        )
        
        keep_user = user_details_sorted[0]
        delete_users = user_details_sorted[1:]
        
        print(f"\n  ✅ KEEP User ID {keep_user['id']} (has more activity/older)")
        for delete_user in delete_users:
            print(f"  ❌ DELETE User ID {delete_user['id']} (duplicate with less activity)")
        
        # Step 3: Delete duplicate users
        print(f"\n  🗑️  Deleting duplicate users...")
        for delete_user in delete_users:
            try:
                # Cascade delete will handle related records
                cur.execute("DELETE FROM members WHERE id = %s", (delete_user['id'],))
                print(f"    ✅ Deleted User ID {delete_user['id']}")
            except Exception as e:
                print(f"    ❌ Error deleting User ID {delete_user['id']}: {e}")
                conn.rollback()
                continue
    
    # Commit all changes
    conn.commit()
    
    # Step 4: Verify no more duplicates
    print("\n✅ Step 3: Verifying fix...")
    cur.execute("""
        SELECT email, COUNT(*) as count
        FROM members
        WHERE email IS NOT NULL AND email != ''
        GROUP BY email
        HAVING COUNT(*) > 1
    """)
    
    remaining_duplicates = cur.fetchall()
    
    if not remaining_duplicates:
        print("✅ All duplicate emails have been fixed!")
    else:
        print(f"⚠️  Still have {len(remaining_duplicates)} duplicate email(s)")
        for dup in remaining_duplicates:
            print(f"   - {dup['email']}: {dup['count']} users")
    
    cur.close()
    conn.close()
    
    print("\n" + "=" * 60)
    print("DONE!")
    print("=" * 60)

if __name__ == "__main__":
    main()
