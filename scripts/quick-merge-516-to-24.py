"""
Quick merge: User 516 -> User 24
Set email baynakamaja@gmail.com for user 24
"""
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

if DATABASE_URL and '?schema=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split('?schema=')[0]

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor(cursor_factory=RealDictCursor)

print("=" * 60)
print("MERGING USER 516 INTO USER 24")
print("=" * 60)

try:
    # Get both users
    cur.execute("SELECT * FROM members WHERE id IN (24, 516) ORDER BY id")
    users = cur.fetchall()
    
    if len(users) < 2:
        print(f"❌ Not enough users found. Found: {len(users)}")
        for u in users:
            print(f"   User {u['id']}: {u['email']}")
        exit(1)
    
    user24 = users[0]
    user516 = users[1]
    
    print(f"\n📤 User 516 (will be merged):")
    print(f"   Email: {user516['email']}")
    print(f"   Google ID: {user516['google_id']}")
    print(f"   Coins: {user516['coin']}, Loyalty: {user516['loyalty_point']}")
    
    print(f"\n📥 User 24 (will receive data):")
    print(f"   Name: {user24['nama_lengkap']}")
    print(f"   Email: {user24['email']}")
    print(f"   Google ID: {user24['google_id']}")
    print(f"   Coins: {user24['coin']}, Loyalty: {user24['loyalty_point']}")
    
    print(f"\n🔄 Starting merge...")
    
    # Save google_id before deleting user 516
    google_id_516 = user516['google_id']
    email_516 = user516['email']
    new_coin = user24['coin'] + user516['coin']
    new_loyalty = user24['loyalty_point'] + user516['loyalty_point']
    
    # Step 1: Transfer all related data from 516 to 24 FIRST
    # Use @@map names from Prisma schema (PostgreSQL table names)
    tables = [
        ('coin_history', 'member_id'),
        ('loyalty_point_history', 'member_id'),
        ('task_submissions', 'id_member'),
        ('notifications', 'id_member'),
        ('reward_redemptions', 'id_member'),        ('member_transactions', 'member_id'),        ('"UserActivity"', 'member_id'),  # CamelCase table name
        ('"PlatformSession"', 'member_id'),  # CamelCase table name
    ]
    
    for table, column in tables:
        try:
            cur.execute(f"UPDATE {table} SET {column} = 24 WHERE {column} = 516")
            count = cur.rowcount
            if count > 0:
                print(f"   ✅ Transferred {count} rows from {table}")
        except Exception as e:
            print(f"   ⚠️  {table}: {e}")
            conn.rollback()
            raise
    
    # Step 2: Delete username for user 516 if exists
    cur.execute("DELETE FROM user_usernames WHERE member_id = 516")
    if cur.rowcount > 0:
        print(f"   ✅ Deleted username for user 516")
    
    # Step 3: Delete user 516 (this frees up the google_id constraint)
    cur.execute("DELETE FROM members WHERE id = 516")
    print(f"   ✅ Deleted user 516")
    
    # Step 4: Now update user 24 with Google ID and email from user 516
    cur.execute("""
        UPDATE members 
        SET 
            email = %s,
            google_id = %s,
            coin = %s,
            loyalty_point = %s
        WHERE id = 24
    """, (email_516, google_id_516, new_coin, new_loyalty))
    print(f"   ✅ Updated user 24: email={email_516}, google_id={google_id_516}")
    print(f"   ✅ Merged coins: {user24['coin']} + {user516['coin']} = {new_coin}")
    print(f"   ✅ Merged loyalty: {user24['loyalty_point']} + {user516['loyalty_point']} = {new_loyalty}")
    
    conn.commit()
    
    # Verify final state
    cur.execute("SELECT * FROM members WHERE id = 24")
    final = cur.fetchone()
    
    print(f"\n✅ MERGE COMPLETED!")
    print(f"\n📊 FINAL STATE - User 24:")
    print(f"   Name: {final['nama_lengkap']}")
    print(f"   Email: {final['email']}")
    print(f"   Google ID: {final['google_id']}")
    print(f"   Coins: {final['coin']}, Loyalty: {final['loyalty_point']}")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    conn.rollback()
    import traceback
    traceback.print_exc()
finally:
    cur.close()
    conn.close()

print("\n" + "=" * 60)
