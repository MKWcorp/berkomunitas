#!/usr/bin/env python3
"""
Script untuk scraping video TikTok dari akun drwskincareoffice menggunakan Apify
dan menyimpan hasilnya ke tabel tiktok_contents
"""

import os
import sys
import json
import time
import requests
import psycopg2
from urllib.parse import urlparse
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Apify Configuration
APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")
APIFY_USER_ID = os.getenv("APIFY_USER_ID")
APIFY_ACTOR_ID = "clockworks~free-tiktok-scraper"

# Base URLs
APIFY_API_BASE = "https://api.apify.com/v2"

# Input configuration untuk Apify actor
SCRAPER_INPUT = {
    "excludePinnedPosts": False,
    "profileScrapeSections": ["videos"],
    "profileSorting": "latest",
    "profiles": ["drwskincareoffice"],
    "resultsPerPage": 1000,  # Scrape 1000 videos
    "shouldDownloadCovers": False,
    "shouldDownloadSlideshowImages": False,
    "shouldDownloadSubtitles": False,
    "shouldDownloadVideos": False
}


def start_apify_run():
    """Start Apify actor run dan return run_id"""
    url = f"{APIFY_API_BASE}/acts/{APIFY_ACTOR_ID}/runs?token={APIFY_API_TOKEN}"
    
    print("🚀 Starting Apify TikTok scraper...")
    print(f"Target: @drwskincareoffice")
    
    response = requests.post(
        url,
        json=SCRAPER_INPUT,
        headers={"Content-Type": "application/json"}
    )
    
    if response.status_code != 201:
        print(f"❌ Error starting actor: {response.status_code}")
        print(response.text)
        return None
    
    data = response.json()
    run_id = data['data']['id']
    print(f"✅ Actor run started with ID: {run_id}")
    
    return run_id


def wait_for_run_completion(run_id, max_wait_time=300):
    """Wait untuk run selesai, dengan timeout"""
    url = f"{APIFY_API_BASE}/actor-runs/{run_id}?token={APIFY_API_TOKEN}"
    
    start_time = time.time()
    print("⏳ Waiting for scraping to complete...")
    
    retry_count = 0
    max_retries = 3
    
    while True:
        if time.time() - start_time > max_wait_time:
            print(f"⚠️ Timeout after {max_wait_time} seconds")
            return False
        
        try:
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                retry_count += 1
                if retry_count >= max_retries:
                    print(f"\n❌ Error checking run status after {max_retries} retries: {response.status_code}")
                    return False
                print(f"\n⚠️ Error {response.status_code}, retrying ({retry_count}/{max_retries})...")
                time.sleep(5)
                continue
            
            # Reset retry count on success
            retry_count = 0
            
            data = response.json()
            status = data['data']['status']
            
            print(f"Status: {status}", end='\r')
            
            if status == "SUCCEEDED":
                print("\n✅ Scraping completed successfully!")
                return True
            elif status in ["FAILED", "ABORTED", "TIMED-OUT"]:
                print(f"\n❌ Run {status}")
                return False
            
        except requests.exceptions.RequestException as e:
            retry_count += 1
            if retry_count >= max_retries:
                print(f"\n❌ Request error after {max_retries} retries: {e}")
                return False
            print(f"\n⚠️ Request error, retrying ({retry_count}/{max_retries})...")
            time.sleep(5)
            continue
        
        time.sleep(5)  # Check setiap 5 detik


def get_run_results(run_id):
    """Fetch hasil scraping dari Apify"""
    url = f"{APIFY_API_BASE}/actor-runs/{run_id}/dataset/items?token={APIFY_API_TOKEN}"
    
    print("📥 Fetching results...")
    
    response = requests.get(url)
    if response.status_code != 200:
        print(f"❌ Error fetching results: {response.status_code}")
        return None
    
    data = response.json()
    print(f"✅ Retrieved {len(data)} videos")
    
    return data


def save_to_database(videos):
    """Save video data ke tabel tiktok_contents"""
    print("💾 Saving to database...")
    
    # Connect to database
    database_url = os.getenv('DATABASE_URL')
    u = urlparse(database_url)
    
    conn = psycopg2.connect(
        host=u.hostname,
        port=u.port,
        user=u.username,
        password=u.password,
        database=u.path[1:]
    )
    conn.autocommit = True
    cur = conn.cursor()
    
    new_count = 0
    updated_count = 0
    error_count = 0
    
    for video in videos:
        try:
            # Extract data dari Apify response
            video_id = video.get('id') or video.get('videoId') or video.get('webVideoUrl', '').split('/')[-1]
            
            # Parse hashtags
            hashtags = []
            if video.get('hashtags'):
                hashtags = [tag.get('name', tag) if isinstance(tag, dict) else tag 
                           for tag in video.get('hashtags', [])]
            
            # Parse create_time
            create_time = None
            if video.get('createTime'):
                try:
                    create_time = datetime.fromtimestamp(video['createTime'])
                except:
                    pass
            elif video.get('createTimeISO'):
                try:
                    create_time = datetime.fromisoformat(video['createTimeISO'].replace('Z', '+00:00'))
                except:
                    pass
            
            # Prepare data untuk database
            data = {
                'content_id': str(video_id),
                'author_username': video.get('authorMeta', {}).get('name', 'drwskincareoffice'),
                'author_nickname': video.get('authorMeta', {}).get('nickName'),
                'content_type': 'video',
                'description': video.get('text') or video.get('caption'),
                'video_url': video.get('webVideoUrl') or video.get('videoUrl'),
                'cover_url': video.get('covers', {}).get('default') or video.get('coverUrl'),
                'like_count': video.get('diggCount', 0),
                'comment_count': video.get('commentCount', 0),
                'share_count': video.get('shareCount', 0),
                'view_count': video.get('playCount', 0),
                'created_at_tiktok': create_time
            }
            
            # Check if video already exists
            cur.execute(
                "SELECT id FROM tiktok_contents WHERE content_id = %s",
                (data['content_id'],)
            )
            existing = cur.fetchone()
            
            if existing:
                # Update existing record
                cur.execute("""
                    UPDATE tiktok_contents
                    SET like_count = %s,
                        comment_count = %s,
                        share_count = %s,
                        view_count = %s,
                        updated_at = NOW()
                    WHERE content_id = %s
                """, (
                    data['like_count'],
                    data['comment_count'],
                    data['share_count'],
                    data['view_count'],
                    data['content_id']
                ))
                updated_count += 1
            else:
                # Insert new record
                cur.execute("""
                    INSERT INTO tiktok_contents (
                        content_id, author_username, author_nickname, content_type,
                        description, video_url, cover_url,
                        like_count, comment_count, share_count, view_count,
                        created_at_tiktok
                    ) VALUES (
                        %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s
                    )
                """, (
                    data['content_id'],
                    data['author_username'],
                    data['author_nickname'],
                    data['content_type'],
                    data['description'],
                    data['video_url'],
                    data['cover_url'],
                    data['like_count'],
                    data['comment_count'],
                    data['share_count'],
                    data['view_count'],
                    data['created_at_tiktok']
                ))
                new_count += 1
            
        except Exception as e:
            error_count += 1
            print(f"❌ Error saving video {video.get('id', 'unknown')}: {str(e)}")
            continue
    
    # Close database connection
    cur.close()
    conn.close()
    
    print(f"\n📊 Summary:")
    print(f"  • New videos: {new_count}")
    print(f"  • Updated videos: {updated_count}")
    print(f"  • Errors: {error_count}")
    print(f"  • Total processed: {len(videos)}")
    
    return new_count, updated_count, error_count


def main():
    """Main function"""
    print("\n" + "="*60)
    print("TikTok Scraper - @drwskincareoffice")
    print("="*60 + "\n")
    
    # Step 1: Start Apify run
    run_id = start_apify_run()
    if not run_id:
        print("❌ Failed to start Apify run")
        return 1
    
    # Step 2: Wait for completion
    if not wait_for_run_completion(run_id):
        print("❌ Run did not complete successfully")
        return 1
    
    # Step 3: Get results
    videos = get_run_results(run_id)
    if not videos:
        print("❌ No results retrieved")
        return 1
    
    # Step 4: Save to database
    try:
        new_count, updated_count, error_count = save_to_database(videos)
        
        print("\n✅ Scraping completed successfully!")
        print(f"Run ID: {run_id}")
        print(f"Dataset URL: {APIFY_API_BASE}/actor-runs/{run_id}/dataset/items")
        
        return 0
    except Exception as e:
        print(f"❌ Database error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    exit(main())
