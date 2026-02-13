"""
Check user 24 status
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
print("CHECK USER 24 STATUS")
print("=" * 60)

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
        last_login_at,
        nomer_wa
    FROM members
    WHERE id = 24
""")

user = cur.fetchone()

if user:
    print(f"\n✅ User found:")
    print(f"  User ID: {user['id']}")
    print(f"  Name: {user['nama_lengkap']}")
    print(f"  Email: {user['email']}")
    print(f"  Google ID: {user['google_id']}")
    print(f"  Clerk ID: {user['clerk_id']}")
    print(f"  WA: {user['nomer_wa']}")
    print(f"  Registered: {user['tanggal_daftar']}")
    print(f"  Coins: {user['coin']}, Loyalty: {user['loyalty_point']}")
    print(f"  Last Login: {user['last_login_at']}")
    
    # Check username
    cur.execute("SELECT username FROM user_usernames WHERE member_id = 24")
    username = cur.fetchone()
    if username:
        print(f"  Username: {username['username']}")
else:
    print("\n❌ User 24 not found")

cur.close()
conn.close()

print("\n" + "=" * 60)
