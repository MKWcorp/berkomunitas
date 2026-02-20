#!/usr/bin/env python3
"""
Verify TikTok content data
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

# Get statistics
cur.execute("""
    SELECT 
        COUNT(*) as total_videos,
        COUNT(DISTINCT author_username) as unique_authors,
        SUM(like_count) as total_likes,
        SUM(comment_count) as total_comments,
        SUM(view_count) as total_views,
        MAX(created_at_tiktok) as latest_video,
        MIN(created_at_tiktok) as oldest_video
    FROM tiktok_contents
""")

stats = cur.fetchone()

print("📊 TikTok Contents Statistics")
print("=" * 60)
print(f"Total Videos: {stats[0]}")
print(f"Unique Authors: {stats[1]}")
print(f"Total Likes: {stats[2]:,}")
print(f"Total Comments: {stats[3]:,}")
print(f"Total Views: {stats[4]:,}")
print(f"Latest Video: {stats[5]}")
print(f"Oldest Video: {stats[6]}")

# Get recent videos
print("\n🎬 Latest 10 Videos:")
print("-" * 60)

cur.execute("""
    SELECT 
        content_id,
        author_nickname,
        LEFT(description, 50) as desc_preview,
        like_count,
        view_count,
        created_at_tiktok
    FROM tiktok_contents
    ORDER BY created_at_tiktok DESC NULLS LAST
    LIMIT 10
""")

for row in cur.fetchall():
    content_id, author, desc, likes, views, created = row
    desc_preview = (desc[:47] + '...') if desc and len(desc) > 50 else (desc or '')
    print(f"\nID: {content_id}")
    print(f"Author: {author}")
    print(f"Description: {desc_preview}")
    print(f"Likes: {likes:,} | Views: {views:,}")
    print(f"Created: {created}")

cur.close()
conn.close()
