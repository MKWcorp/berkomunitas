"""
Merge User Script
Merge user 516 (newly created) into user 24 (original user)
This is useful when a duplicate user was created due to email change
"""
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL and '?schema=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split('?schema=')[0]

def merge_users(from_user_id, to_user_id, new_email=None, link_google_id=True):
    """
    Merge from_user_id into to_user_id
    
    Args:
        from_user_id: User ID to be merged (will be deleted)
        to_user_id: User ID to keep (will receive all data)
        new_email: Optional new email for the target user
        link_google_id: Whether to link Google ID from source user to target user
    """
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    print("=" * 60)
    print(f"MERGE USER {from_user_id} → USER {to_user_id}")
    print("=" * 60)
    
    # Get source user info
    cur.execute("SELECT * FROM members WHERE id = %s", (from_user_id,))
    from_user = cur.fetchone()
    
    if not from_user:
        print(f"❌ Source user {from_user_id} not found!")
        conn.close()
        return False
    
    # Get target user info
    cur.execute("SELECT * FROM members WHERE id = %s", (to_user_id,))
    to_user = cur.fetchone()
    
    if not to_user:
        print(f"❌ Target user {to_user_id} not found!")
        conn.close()
        return False
    
    print(f"\n📤 SOURCE User {from_user_id}:")
    print(f"   Name: {from_user['nama_lengkap']}")
    print(f"   Email: {from_user['email']}")
    print(f"   Google ID: {from_user['google_id']}")
    print(f"   Coins: {from_user['coin']}, Loyalty: {from_user['loyalty_point']}")
    
    print(f"\n📥 TARGET User {to_user_id}:")
    print(f"   Name: {to_user['nama_lengkap']}")
    print(f"   Email: {to_user['email']}")
    print(f"   Google ID: {to_user['google_id']}")
    print(f"   Coins: {to_user['coin']}, Loyalty: {to_user['loyalty_point']}")
    
    input(f"\n⚠️  Press ENTER to continue with merge, or CTRL+C to cancel...")
    
    try:
        # Start transaction
        print("\n🔄 Starting merge process...")
        
        # Step 1: Update target user with Google ID and email if needed
        update_data = {}
        
        if link_google_id and from_user['google_id']:
            update_data['google_id'] = from_user['google_id']
            print(f"   ✅ Linking Google ID: {from_user['google_id']}")
        
        if new_email:
            update_data['email'] = new_email
            print(f"   ✅ Setting new email: {new_email}")
        elif from_user['email'] and not to_user['email']:
            update_data['email'] = from_user['email']
            print(f"   ✅ Setting email from source: {from_user['email']}")
        
        # Merge coins and loyalty points
        new_coin = to_user['coin'] + from_user['coin']
        new_loyalty = to_user['loyalty_point'] + from_user['loyalty_point']
        update_data['coin'] = new_coin
        update_data['loyalty_point'] = new_loyalty
        print(f"   ✅ Merging coins: {to_user['coin']} + {from_user['coin']} = {new_coin}")
        print(f"   ✅ Merging loyalty: {to_user['loyalty_point']} + {from_user['loyalty_point']} = {new_loyalty}")
        
        if update_data:
            set_clause = ', '.join([f"{k} = %s" for k in update_data.keys()])
            values = list(update_data.values()) + [to_user_id]
            cur.execute(f"UPDATE members SET {set_clause} WHERE id = %s", values)
        
        # Step 2: Transfer all related records from source to target
        # This will be done automatically by CASCADE DELETE since we have proper foreign keys
        # But let's manually transfer the important data first
        
        # Transfer coin history
        cur.execute("UPDATE coin_history SET member_id = %s WHERE member_id = %s", 
                   (to_user_id, from_user_id))
        print(f"   ✅ Transferred coin history")
        
        # Transfer loyalty point history
        cur.execute("UPDATE loyalty_point_history SET member_id = %s WHERE member_id = %s", 
                   (to_user_id, from_user_id))
        print(f"   ✅ Transferred loyalty point history")
        
        # Transfer task submissions
        cur.execute("UPDATE task_submissions SET member_id = %s WHERE member_id = %s", 
                   (to_user_id, from_user_id))
        print(f"   ✅ Transferred task submissions")
        
        # Transfer notifications
        cur.execute("UPDATE notifications SET id_member = %s WHERE id_member = %s", 
                   (to_user_id, from_user_id))
        print(f"   ✅ Transferred notifications")
        
        # Transfer reward redemptions
        cur.execute("UPDATE reward_redemptions SET member_id = %s WHERE member_id = %s", 
                   (to_user_id, from_user_id))
        print(f"   ✅ Transferred reward redemptions")
        
        # Transfer platform sessions
        cur.execute("UPDATE platform_session SET member_id = %s WHERE member_id = %s", 
                   (to_user_id, from_user_id))
        print(f"   ✅ Transferred platform sessions")
        
        # Transfer user activities
        cur.execute("UPDATE user_activity SET member_id = %s WHERE member_id = %s", 
                   (to_user_id, from_user_id))
        print(f"   ✅ Transferred user activities")
        
        # Step 3: Delete source user (cascade will handle remaining relations)
        cur.execute("DELETE FROM members WHERE id = %s", (from_user_id,))
        print(f"   ✅ Deleted source user {from_user_id}")
        
        # Commit transaction
        conn.commit()
        
        print(f"\n✅ MERGE COMPLETED!")
        print(f"   User {from_user_id} has been merged into User {to_user_id}")
        
        # Show final state
        cur.execute("SELECT * FROM members WHERE id = %s", (to_user_id,))
        final_user = cur.fetchone()
        
        print(f"\n📊 FINAL STATE - User {to_user_id}:")
        print(f"   Name: {final_user['nama_lengkap']}")
        print(f"   Email: {final_user['email']}")
        print(f"   Google ID: {final_user['google_id']}")
        print(f"   Coins: {final_user['coin']}, Loyalty: {final_user['loyalty_point']}")
        
        cur.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        conn.rollback()
        cur.close()
        conn.close()
        return False

if __name__ == "__main__":
    print("\n" + "=" * 60)
    print("EXAMPLE: Merge User 516 into User 24")
    print("=" * 60)
    print("\nThis will:")
    print("1. Link Google ID from User 516 to User 24")
    print("2. Set email of User 24 to baynakamaja@gmail.com")
    print("3. Merge coins and loyalty points")
    print("4. Transfer all related data (tasks, history, etc.)")
    print("5. Delete User 516")
    print("\n")
    
    response = input("Do you want to proceed? (yes/no): ")
    
    if response.lower() in ['yes', 'y']:
        merge_users(
            from_user_id=516,
            to_user_id=24,
            new_email='baynakamaja@gmail.com',
            link_google_id=True
        )
    else:
        print("\n❌ Cancelled")
