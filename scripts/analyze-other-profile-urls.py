#!/usr/bin/env python3
"""
Detailed Profile Picture URL Checker

Check what URLs are in the "OTHER" category
"""

import sys
import os
import requests
import psycopg2
from urllib.parse import urlparse

# Configuration
DB_CONFIG = {
    'host': '213.190.4.159',
    'port': 5432,
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688'
}

def check_url_accessibility(url, timeout=5):
    """Check if URL returns 200 OK"""
    try:
        response = requests.head(url, timeout=timeout, allow_redirects=True)
        return response.status_code, True
    except requests.exceptions.Timeout:
        return 0, 'Timeout'
    except requests.exceptions.ConnectionError:
        return 0, 'Connection Error'
    except Exception as e:
        return 0, str(e)[:30]

def main():
    print('🔍 Detailed Profile Picture URL Analysis')
    print('=' * 70)
    print()
    
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Get members with "OTHER" category
    cursor.execute("""
        SELECT 
            id,
            nama_lengkap,
            email,
            foto_profil_url
        FROM members
        WHERE foto_profil_url IS NOT NULL
          AND foto_profil_url != ''
          AND foto_profil_url NOT LIKE '%cloudinary.com%'
          AND foto_profil_url NOT LIKE '%storage.berkomunitas.com%'
          AND foto_profil_url NOT LIKE '%dicebear.com%'
          AND foto_profil_url NOT LIKE '/uploads/%'
        ORDER BY id
    """)
    
    others = cursor.fetchall()
    
    print(f'Found {len(others)} members with "OTHER" photo URLs\n')
    
    if len(others) == 0:
        print('✅ No members in OTHER category!')
        return
    
    # Analyze URLs
    url_patterns = {}
    broken_urls = []
    
    print('Checking URLs...\n')
    
    for member_id, nama, email, url in others:
        # Categorize by URL pattern
        if url.startswith('http'):
            parsed = urlparse(url)
            domain = parsed.netloc
            pattern = f'{parsed.scheme}://{domain}'
        else:
            pattern = url[:30] if len(url) > 30 else url
        
        url_patterns[pattern] = url_patterns.get(pattern, 0) + 1
        
        # Check accessibility (only for http URLs)
        if url.startswith('http'):
            status_code, is_ok = check_url_accessibility(url)
            
            if not is_ok or status_code != 200:
                broken_urls.append({
                    'id': member_id,
                    'nama': nama,
                    'email': email,
                    'url': url,
                    'status': status_code if is_ok else is_ok
                })
                print(f'❌ Member {member_id}: {nama or email}')
                print(f'   URL: {url[:70]}...')
                print(f'   Status: {status_code if is_ok else is_ok}')
                print()
    
    # Summary
    print('=' * 70)
    print('📊 URL Pattern Analysis')
    print('=' * 70)
    print()
    
    for pattern, count in sorted(url_patterns.items(), key=lambda x: x[1], reverse=True):
        print(f'{count:3d} members: {pattern}')
    
    print()
    print('=' * 70)
    print('📊 Summary')
    print('=' * 70)
    print(f'Total "OTHER" URLs: {len(others)}')
    print(f'Broken/Inaccessible: {len(broken_urls)}')
    print(f'Working: {len(others) - len(broken_urls)}')
    print()
    
    if broken_urls:
        print('💡 Tip: Run fix-missing-profile-pictures.py to generate default avatars')
    
    # Sample URLs
    print()
    print('Sample URLs from "OTHER" category:')
    for i, (member_id, nama, email, url) in enumerate(others[:5]):
        print(f'  {i+1}. Member {member_id}: {url[:60]}...')
    
    cursor.close()
    conn.close()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print('\n\n⚠️  Interrupted')
        sys.exit(1)
    except Exception as e:
        print(f'\n\n❌ Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
