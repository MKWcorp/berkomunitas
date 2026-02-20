#!/usr/bin/env python3
"""
Check struktur tabel tiktok_contents
"""

import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

database_url = os.getenv('DATABASE_URL')
u = urlparse(database_url)

conn = psycopg2.connect(
    host=u.hostname,
    port=u.port,
    user=u.username,
    password=u.password,
    database=u.path[1:]
)

cur = conn.cursor()

# Check if table exists
cur.execute("""
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'tiktok_contents'
    );
""")

exists = cur.fetchone()[0]

if not exists:
    print("❌ Table tiktok_contents does not exist")
else:
    print("✅ Table tiktok_contents exists")
    print("\n📋 Columns:")
    
    # Get table structure
    cur.execute("""
        SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'tiktok_contents'
        ORDER BY ordinal_position;
    """)
    
    for row in cur.fetchall():
        col_name, data_type, max_len, nullable, default = row
        type_str = data_type
        if max_len:
            type_str += f"({max_len})"
        print(f"  • {col_name:20} {type_str:20} {'NULL' if nullable == 'YES' else 'NOT NULL':10} {default if default else ''}")

cur.close()
conn.close()
