"""
Check status of baynakamaja@gmail.com email
"""
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')

# Fix DATABASE_URL - remove schema parameter if present
if DATABASE_URL and '?schema=' in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.split('?schema=')[0]

conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor(cursor_factory=RealDictCursor)

print("=" * 60)
print("CHECK EMAIL STATUS: baynakamaja@gmail.com")
print("=" * 60)

# Find all users with this email
cur.execute("""
    SELECT 
        id, 
        nama_lengkap, 
        email, 
        google_id, 
        clerk_id,
        tanggal_daftar,
        coin,
        loyalty_point,
        last_login_at
    FROM members
    WHERE email = %s OR email ILIKE %s
    ORDER BY id
""", ('baynakamaja@gmail.com', '%baynakamaja%'))

users = cur.fetchall()

if not users:
    print("\n❌ No users found with email baynakamaja@gmail.com")
else:
    print(f"\n✅ Found {len(users)} user(s):")
    for user in users:
        print(f"\n  User ID: {user['id']}")
        print(f"  Name: {user['nama_lengkap']}")
        print(f"  Email: {user['email']}")
        print(f"  Google ID: {user['google_id']}")
        print(f"  Clerk ID: {user['clerk_id']}")
        print(f"  Registered: {user['tanggal_daftar']}")
        print(f"  Coins: {user['coin']}, Loyalty: {user['loyalty_point']}")
        print(f"  Last Login: {user['last_login_at']}")

# Also check user_usernames table
cur.execute("""
    SELECT 
        uu.member_id,
        uu.username,
        m.email,
        m.nama_lengkap
    FROM user_usernames uu
    JOIN members m ON m.id = uu.member_id
    WHERE m.email = %s OR m.email ILIKE %s
""", ('baynakamaja@gmail.com', '%baynakamaja%'))

usernames = cur.fetchall()

if usernames:
    print("\n📝 Usernames:")
    for un in usernames:
        print(f"  User ID {un['member_id']}: {un['username']}")

cur.close()
conn.close()

print("\n" + "=" * 60)
