#!/usr/bin/env python3
"""
Recalculate all employee-member matching suggestions with fixed algorithm
"""

import os
import re
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv
from difflib import SequenceMatcher
import json

# Load environment variables
load_dotenv()

def normalize_name(name):
    """Normalize name for comparison"""
    if not name:
        return ""
    # Remove extra spaces, convert to lowercase
    name = re.sub(r'\s+', ' ', name.strip().lower())
    # Remove common academic/professional titles (with period required for S. titles)
    name = re.sub(r'\b(dr|ir|apt|prof|drs|drg)\b\.?', '', name, flags=re.IGNORECASE)
    name = re.sub(r'\bs\.(kom|pd|si|sos|farm|kep|t|h|e|akun|psi|hum|ip|ked|gz)\b', '', name, flags=re.IGNORECASE)
    return name.strip()

def calculate_name_similarity(name1, name2):
    """Calculate similarity between two names (0-1)"""
    name1_norm = normalize_name(name1)
    name2_norm = normalize_name(name2)
    
    # Skip if either is empty after normalization
    if not name1_norm or not name2_norm:
        return 0.0
    
    # Exact match
    if name1_norm == name2_norm:
        return 1.0
    
    # Sequence matcher
    ratio = SequenceMatcher(None, name1_norm, name2_norm).ratio()
    
    # Check if one name contains the other (both must be at least 3 chars)
    if len(name1_norm) >= 3 and len(name2_norm) >= 3:
        if name1_norm in name2_norm or name2_norm in name1_norm:
            ratio = max(ratio, 0.80)
    
    return ratio

def find_member_matches(cursor, employee):
    """Find possible member matches for an employee"""
    
    nama = employee['nama_lengkap']
    email = employee['email']
    
    # Try exact email match first
    cursor.execute("""
        SELECT id, nama_lengkap, email, loyalty_point
        FROM members
        WHERE LOWER(email) = LOWER(%s)
    """, (email,))
    
    exact_match = cursor.fetchone()
    
    if exact_match:
        return {
            'status': 'matched',
            'confidence': 1.0,
            'member_id': exact_match[0],
            'suggestions': [{
                'member_id': exact_match[0],
                'nama_lengkap': exact_match[1],
                'email': exact_match[2],
                'loyalty_point': exact_match[3],
                'match_type': 'email_exact',
                'confidence': 1.0
            }]
        }
    
    # Try fuzzy name match
    cursor.execute("""
        SELECT id, nama_lengkap, email, loyalty_point
        FROM members
        WHERE nama_lengkap IS NOT NULL
        ORDER BY loyalty_point DESC
        LIMIT 500
    """)
    
    members = cursor.fetchall()
    suggestions = []
    
    for member in members:
        member_id, member_nama, member_email, loyalty_point = member
        
        # Calculate name similarity
        similarity = calculate_name_similarity(nama, member_nama)
        
        if similarity >= 0.80:  # 80% threshold
            suggestions.append({
                'member_id': member_id,
                'nama_lengkap': member_nama,
                'email': member_email,
                'loyalty_point': loyalty_point,
                'match_type': 'name_fuzzy',
                'confidence': round(similarity, 2)
            })
    
    # Sort by confidence
    suggestions.sort(key=lambda x: x['confidence'], reverse=True)
    
    # Take top 5
    suggestions = suggestions[:5]
    
    if suggestions:
        best_confidence = suggestions[0]['confidence']
        
        # If confidence is very high (>0.95), consider it matched
        if best_confidence >= 0.95:
            return {
                'status': 'matched',
                'confidence': best_confidence,
                'member_id': suggestions[0]['member_id'],
                'suggestions': suggestions
            }
        else:
            # Ambiguous - needs manual confirmation
            return {
                'status': 'ambiguous',
                'confidence': best_confidence,
                'member_id': None,
                'suggestions': suggestions
            }
    
    # No match found
    return {
        'status': 'unmatched',
        'confidence': 0.0,
        'member_id': None,
        'suggestions': []
    }

def recalculate_all_matches():
    """Recalculate all employee matches"""
    
    # Database connection
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
        return False
    
    # Parse URL
    url = urlparse(database_url)
    
    try:
        # Connect to database
        print("🔌 Connecting to database...")
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            user=url.username,
            password=url.password,
            database=url.path.lstrip('/'),
            sslmode='prefer'
        )
        cursor = conn.cursor()
        print("✓ Connected!")
        
        # Get all employees that need recalculation (only unmatched and ambiguous)
        print("\n📋 Fetching employees...")
        cursor.execute("""
            SELECT id, nama_lengkap, email, divisi, matching_status
            FROM drwcorp_employees
            WHERE matching_status IN ('unmatched', 'ambiguous')
            ORDER BY id
        """)
        
        employees = cursor.fetchall()
        total = len(employees)
        
        if total == 0:
            print("✓ No employees to recalculate (all are matched)")
            return True
        
        print(f"✓ Found {total} employees to recalculate\n")
        
        updated = 0
        no_change = 0
        
        # Recalculate each employee
        for emp_id, nama, email, divisi, old_status in employees:
            print(f"Processing: {nama} ({divisi})...", end=' ')
            
            # Find matches
            match_result = find_member_matches(cursor, {
                'nama_lengkap': nama,
                'email': email
            })
            
            # Update database
            cursor.execute("""
                UPDATE drwcorp_employees
                SET 
                    matching_status = %s,
                    matching_confidence = %s,
                    member_id = %s,
                    matching_suggestions = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            """, (
                match_result['status'],
                match_result['confidence'],
                match_result['member_id'],
                json.dumps(match_result['suggestions']),
                emp_id
            ))
            
            # Check if status changed
            if match_result['status'] != old_status:
                print(f"{old_status} → {match_result['status']} ✓")
                updated += 1
            else:
                print(f"{match_result['status']} (no change)")
                no_change += 1
        
        # Commit changes
        conn.commit()
        
        # Summary
        print(f"\n📊 Recalculation Summary:")
        print(f"   Total processed: {total}")
        print(f"   Updated: {updated}")
        print(f"   No change: {no_change}")
        
        # Final statistics
        cursor.execute("""
            SELECT matching_status, COUNT(*) 
            FROM drwcorp_employees 
            GROUP BY matching_status
        """)
        
        stats = cursor.fetchall()
        print(f"\n📈 Current Status:")
        for status, count in stats:
            print(f"   {status}: {count}")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Recalculation complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🔄 Recalculating Employee-Member Matches")
    print("=" * 50)
    recalculate_all_matches()
