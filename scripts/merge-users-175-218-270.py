"""
Merge Users 175, 218, 270 into Single Account
Target email: 92allstaarrr@gmail.com

According to the problem statement:
- User 175: bintang arr, bintang2329@gmail.com, username: binn, WA: 628818542455
- User 218: Mohammad Bintang Lazuardi Rachmanie, mohbintanglr@gmail.com, username: user_218
- User 270: M Bintang Laz R, 92allstaarrr@gmail.com, username: mbintanglr, WA: 6285743027132

Strategy:
1. Keep the user with the target email (92allstaarrr@gmail.com) - User 270
2. Merge all data from users 175 and 218 into user 270
3. Combine loyalty points and coins
4. Transfer all related records (tasks, history, notifications, etc.)
5. Delete users 175 and 218

Note on SQL Injection:
This script uses f-strings for table and column names in SQL queries. This is safe
because all table and column names are from a controlled list defined in this script,
not from user input. User-provided values (IDs, emails) are properly parameterized.
"""
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL and '?schema=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split('?schema=')[0]


def merge_three_users(target_user_id=270, source_user_ids=[175, 218], target_email='92allstaarrr@gmail.com', dry_run=False):
    """
    Merge multiple users into one target user
    
    Args:
        target_user_id: User ID to keep (will receive all data)
        source_user_ids: List of user IDs to merge from (will be deleted)
        target_email: Final email for the target user
        dry_run: If True, only show what would happen without making changes
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("=" * 80)
    print(f"MERGE USERS {', '.join(map(str, source_user_ids))} → USER {target_user_id}")
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
    print("=" * 80)
    
    # Get all users involved
    all_user_ids = [target_user_id] + source_user_ids
    cur.execute(
        "SELECT * FROM members WHERE id = ANY(%s) ORDER BY id",
        (all_user_ids,)
    )
    users = cur.fetchall()
    
    if len(users) != len(all_user_ids):
        print(f"❌ ERROR: Expected {len(all_user_ids)} users, found {len(users)}")
        for u in users:
            print(f"   Found: User {u['id']}")
        conn.close()
        return False
    
    # Separate target and source users
    target_user = None
    source_users = []
    
    for user in users:
        if user['id'] == target_user_id:
            target_user = user
        else:
            source_users.append(user)
    
    if not target_user:
        print(f"❌ Target user {target_user_id} not found!")
        conn.close()
        return False
    
    # Display all users
    print(f"\n📥 TARGET User {target_user_id} (WILL KEEP):")
    print(f"   Name: {target_user['nama_lengkap']}")
    print(f"   Email: {target_user['email']}")
    print(f"   WhatsApp: {target_user['nomer_wa']}")
    print(f"   Google ID: {target_user['google_id']}")
    print(f"   Coins: {target_user['coin']}, Loyalty: {target_user['loyalty_point']}")
    print(f"   Total Points: {target_user['coin'] + target_user['loyalty_point']}")
    
    total_coins = target_user['coin']
    total_loyalty = target_user['loyalty_point']
    
    for src_user in source_users:
        print(f"\n📤 SOURCE User {src_user['id']} (WILL BE MERGED & DELETED):")
        print(f"   Name: {src_user['nama_lengkap']}")
        print(f"   Email: {src_user['email']}")
        print(f"   WhatsApp: {src_user['nomer_wa']}")
        print(f"   Google ID: {src_user['google_id']}")
        print(f"   Coins: {src_user['coin']}, Loyalty: {src_user['loyalty_point']}")
        print(f"   Total Points: {src_user['coin'] + src_user['loyalty_point']}")
        
        total_coins += src_user['coin']
        total_loyalty += src_user['loyalty_point']
    
    print(f"\n📊 FINAL TOTALS AFTER MERGE:")
    print(f"   Total Coins: {total_coins}")
    print(f"   Total Loyalty: {total_loyalty}")
    print(f"   Total Points: {total_coins + total_loyalty}")
    print(f"   Final Email: {target_email}")
    
    if not dry_run:
        response = input(f"\n⚠️  Press ENTER to continue with merge, or CTRL+C to cancel... ")
    
    try:
        if dry_run:
            print(f"\n🔍 DRY RUN - Would perform the following operations:")
        else:
            print(f"\n🔄 Starting merge process...")
        
        # Tables to transfer data from
        tables_to_transfer = [
            ('coin_history', 'member_id'),
            ('loyalty_point_history', 'member_id'),
            ('task_submissions', 'member_id'),
            ('notifications', 'id_member'),
            ('reward_redemptions', 'member_id'),
            ('member_transactions', 'member_id'),
            ('user_activity', 'member_id'),
            ('platform_session', 'member_id'),
            ('member_badges', 'member_id'),
            ('profil_sosial_media', 'id_member'),
            ('user_privileges', 'member_id'),
            ('member_task_stats', 'member_id'),
            ('bc_drwskincare_plus', 'member_id'),
            ('drwcorp_employees', 'member_id'),
        ]
        
        # Special handling for profile_wall_posts (has multiple member_id columns)
        profile_wall_columns = ['author_id', 'profile_owner_id']
        
        transferred_counts = {}
        
        for src_user_id in source_user_ids:
            print(f"\n   📦 Processing User {src_user_id}:")
            
            for table, column in tables_to_transfer:
                try:
                    # Check if there's data to transfer
                    # Note: Using string formatting here is safe because table and column names
                    # are from a controlled list defined in this script, not from user input
                    cur.execute(f"SELECT COUNT(*) as count FROM {table} WHERE {column} = %s", (src_user_id,))
                    count = cur.fetchone()['count']
                    
                    if count > 0:
                        if dry_run:
                            print(f"      Would transfer {count} rows from {table}.{column}")
                        else:
                            cur.execute(
                                f"UPDATE {table} SET {column} = %s WHERE {column} = %s",
                                (target_user_id, src_user_id)
                            )
                            print(f"      ✅ Transferred {count} rows from {table}.{column}")
                        
                        key = f"{table}_{column}"
                        transferred_counts[key] = transferred_counts.get(key, 0) + count
                        
                except Exception as e:
                    # Table might not exist or column might be different - skip silently
                    if "does not exist" not in str(e):
                        print(f"      ⚠️  {table}.{column}: {e}")
            
            # Handle profile_wall_posts separately (has multiple member_id columns)
            for column in profile_wall_columns:
                try:
                    cur.execute(f"SELECT COUNT(*) as count FROM profile_wall_posts WHERE {column} = %s", (src_user_id,))
                    count = cur.fetchone()['count']
                    
                    if count > 0:
                        if dry_run:
                            print(f"      Would transfer {count} rows from profile_wall_posts.{column}")
                        else:
                            cur.execute(
                                f"UPDATE profile_wall_posts SET {column} = %s WHERE {column} = %s",
                                (target_user_id, src_user_id)
                            )
                            print(f"      ✅ Transferred {count} rows from profile_wall_posts.{column}")
                except Exception as e:
                    if "does not exist" not in str(e):
                        print(f"      ⚠️  profile_wall_posts.{column}: {e}")
        
        # Handle user_usernames specially - delete old ones, keep or update target one
        for src_user_id in source_user_ids:
            cur.execute("SELECT * FROM user_usernames WHERE member_id = %s", (src_user_id,))
            src_username = cur.fetchone()
            if src_username:
                if dry_run:
                    print(f"      Would delete username '{src_username['username']}' for user {src_user_id}")
                else:
                    cur.execute("DELETE FROM user_usernames WHERE member_id = %s", (src_user_id,))
                    print(f"      ✅ Deleted username '{src_username['username']}' for user {src_user_id}")
        
        # Handle member_emails - transfer all alternate emails
        for src_user_id in source_user_ids:
            try:
                cur.execute("SELECT COUNT(*) as count FROM member_emails WHERE member_id = %s", (src_user_id,))
                count = cur.fetchone()['count']
                if count > 0:
                    if dry_run:
                        print(f"      Would transfer {count} alternate emails from user {src_user_id}")
                    else:
                        cur.execute(
                            "UPDATE member_emails SET member_id = %s WHERE member_id = %s",
                            (target_user_id, src_user_id)
                        )
                        print(f"      ✅ Transferred {count} alternate emails from user {src_user_id}")
            except Exception as e:
                if "does not exist" not in str(e):
                    print(f"      ⚠️  member_emails: {e}")
        
        # Update target user with combined data
        if dry_run:
            print(f"\n   Would update target user {target_user_id}:")
            print(f"      Email: {target_email}")
            print(f"      Coins: {total_coins}")
            print(f"      Loyalty: {total_loyalty}")
        else:
            cur.execute("""
                UPDATE members 
                SET 
                    email = %s,
                    coin = %s,
                    loyalty_point = %s
                WHERE id = %s
            """, (target_email, total_coins, total_loyalty, target_user_id))
            print(f"\n   ✅ Updated target user {target_user_id}:")
            print(f"      Email: {target_email}")
            print(f"      Coins: {total_coins}")
            print(f"      Loyalty: {total_loyalty}")
        
        # Delete source users
        for src_user_id in source_user_ids:
            if dry_run:
                print(f"   Would delete user {src_user_id}")
            else:
                cur.execute("DELETE FROM members WHERE id = %s", (src_user_id,))
                print(f"   ✅ Deleted user {src_user_id}")
        
        if dry_run:
            print(f"\n🔍 DRY RUN COMPLETED - No changes were made")
            print(f"\nTo perform the actual merge, run this script with dry_run=False")
            conn.rollback()
        else:
            # Commit transaction
            conn.commit()
            
            print(f"\n✅ MERGE COMPLETED!")
            print(f"   Users {', '.join(map(str, source_user_ids))} have been merged into User {target_user_id}")
            
            # Show final state
            cur.execute("SELECT * FROM members WHERE id = %s", (target_user_id,))
            final_user = cur.fetchone()
            
            print(f"\n📊 FINAL STATE - User {target_user_id}:")
            print(f"   Name: {final_user['nama_lengkap']}")
            print(f"   Email: {final_user['email']}")
            print(f"   WhatsApp: {final_user['nomer_wa']}")
            print(f"   Google ID: {final_user['google_id']}")
            print(f"   Coins: {final_user['coin']}, Loyalty: {final_user['loyalty_point']}")
            print(f"   Total Points: {final_user['coin'] + final_user['loyalty_point']}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        conn.rollback()
        import traceback
        traceback.print_exc()
        cur.close()
        conn.close()
        return False


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("MERGE USERS 175, 218, 270 INTO USER 270")
    print("Target Email: 92allstaarrr@gmail.com")
    print("=" * 80)
    print("\nThis script will:")
    print("1. Keep User 270 (M Bintang Laz R, 92allstaarrr@gmail.com)")
    print("2. Merge all data from Users 175 and 218 into User 270")
    print("3. Combine all coins and loyalty points")
    print("4. Transfer all related records (tasks, history, notifications, etc.)")
    print("5. Delete Users 175 and 218")
    print("\n")
    
    # First run in dry-run mode to show what will happen
    print("🔍 Running DRY RUN first to preview changes...\n")
    merge_three_users(
        target_user_id=270,
        source_user_ids=[175, 218],
        target_email='92allstaarrr@gmail.com',
        dry_run=True
    )
    
    print("\n" + "=" * 80)
    response = input("\n⚠️  Do you want to proceed with the ACTUAL merge? (type 'yes' to confirm): ")
    
    if response.lower() == 'yes':
        print("\n🔄 Proceeding with actual merge...\n")
        merge_three_users(
            target_user_id=270,
            source_user_ids=[175, 218],
            target_email='92allstaarrr@gmail.com',
            dry_run=False
        )
    else:
        print("\n❌ Merge cancelled")
