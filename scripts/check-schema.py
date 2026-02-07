"""
Check actual schema of members table in production database
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('DATABASE_URL')
u = urlparse(url)

conn = psycopg2.connect(
    host=u.hostname,
    port=u.port,
    user=u.username,
    password=u.password,
    database=u.path[1:]
)
conn.autocommit = True
cur = conn.cursor()

print(f'📊 Database: {u.path[1:]}')
print('\n🔍 Members table columns:')
print('='*60)

cur.execute("""
    SELECT column_name, data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'members'
    ORDER BY ordinal_position
""")

for col_name, data_type, max_length in cur.fetchall():
    length_info = f' ({max_length})' if max_length else ''
    print(f'  {col_name:<30} {data_type}{length_info}')

print('='*60)

# Check for photo-related columns
cur.execute("""
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'members'
    AND (column_name LIKE '%foto%' OR column_name LIKE '%photo%' OR column_name LIKE '%avatar%' OR column_name LIKE '%image%')
""")

photo_columns = [row[0] for row in cur.fetchall()]
print(f'\n📸 Photo-related columns: {", ".join(photo_columns) if photo_columns else "None found"}')

cur.close()
conn.close()
