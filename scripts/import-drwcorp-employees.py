#!/usr/bin/env python3
"""
Import drwcorp_employees from CSV files with smart matching
"""

import os
import re
import csv
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

def parse_csv_employees(csv_directory):
    """Parse CSV files and extract employee data"""
    
    # CSV file mapping
    csv_files = {
        'Corpora': 'Task Force by Berkomunitas - Corpora.csv',
        'Estetika': 'Task Force by Berkomunitas - Estetika.csv',
        'Derma Rich': 'Task Force by Berkomunitas - Derma Rich.csv',
        'KIA': 'Task Force by Berkomunitas - KIA.csv',
        'DHI': 'Task Force by Berkomunitas - DHI.csv',
        'DTI': 'Task Force by Berkomunitas - DTI.csv',
        'Dewi Kartika': 'Task Force by Berkomunitas - Dewi Kartika.csv',
        'CV Wahyu': 'Task Force by Berkomunitas - CV Wahyu.csv'
    }
    
    employees = []
    
    for divisi, filename in csv_files.items():
        csv_path = os.path.join(csv_directory, filename)
        
        if not os.path.exists(csv_path):
            print(f"⚠️  Warning: {filename} not found, skipping...")
            continue
        
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                
                for row in reader:
                    nama = row.get('NAMA LENGKAP', '').strip()
                    email = row.get('ALAMAT EMAIL', '').strip()
                    
                    # Skip if no name or invalid email
                    if not nama or not email or '@' not in email:
                        continue
                    
                    employees.append({
                        'nama_lengkap': nama,
                        'email': email,
                        'divisi': divisi
                    })
                    
            print(f"✓ Loaded {divisi}: {len([e for e in employees if e['divisi'] == divisi])} employees")
            
        except Exception as e:
            print(f"❌ Error reading {filename}: {e}")
            continue
    
    return employees

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

def import_employees(csv_directory):
    """Import employees from CSV files"""
    
    # Parse CSV files
    print("📖 Parsing CSV files...")
    employees = parse_csv_employees(csv_directory)
    
    if not employees:
        print("❌ No employees found in CSV files")
        return False
    
    print(f"✓ Found {len(employees)} employees")
    
    # Count by divisi
    divisi_counts = {}
    for emp in employees:
        divisi = emp['divisi']
        divisi_counts[divisi] = divisi_counts.get(divisi, 0) + 1
    
    print("\n📊 Employees by Divisi:")
    for divisi, count in sorted(divisi_counts.items()):
        print(f"   {divisi:20} : {count:3} employees")
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("\n❌ DATABASE_URL not found in environment variables")
        return False
    
    # Parse database URL
    result = urlparse(database_url)
    
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=result.hostname,
            port=result.port,
            database=result.path[1:],
            user=result.username,
            password=result.password,
            sslmode='prefer'
        )
        
        cursor = conn.cursor()
        
        print("\n🔍 Matching employees with members...")
        
        stats = {
            'matched': 0,
            'ambiguous': 0,
            'unmatched': 0,
            'imported': 0,
            'skipped': 0
        }
        
        for i, employee in enumerate(employees, 1):
            nama = employee['nama_lengkap']
            email = employee['email']
            divisi = employee['divisi']
            
            # Check if employee already exists
            cursor.execute("""
                SELECT id FROM drwcorp_employees WHERE email = %s
            """, (email,))
            
            existing = cursor.fetchone()
            
            if existing:
                stats['skipped'] += 1
                continue
            
            # Find member matches
            match_result = find_member_matches(cursor, employee)
            
            # Insert employee
            cursor.execute("""
                INSERT INTO drwcorp_employees 
                (nama_lengkap, email, divisi, member_id, matching_status, 
                 matching_confidence, matching_suggestions)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (
                nama,
                email,
                divisi,
                match_result['member_id'],
                match_result['status'],
                match_result['confidence'],
                json.dumps(match_result['suggestions']) if match_result['suggestions'] else None
            ))
            
            stats[match_result['status']] += 1
            stats['imported'] += 1
            
            # Progress indicator
            if i % 50 == 0:
                print(f"   Processed {i}/{len(employees)}...")
        
        conn.commit()
        
        print("\n✅ Import completed!")
        print("\n📈 Statistics:")
        print(f"   Total processed : {len(employees)}")
        print(f"   Imported        : {stats['imported']}")
        print(f"   Skipped (exist) : {stats['skipped']}")
        print(f"   🟢 Matched      : {stats['matched']} (auto-linked)")
        print(f"   🟡 Ambiguous    : {stats['ambiguous']} (needs confirmation)")
        print(f"   🔴 Unmatched    : {stats['unmatched']} (no member found)")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("IMPORT DRWCORP EMPLOYEES FROM CSV")
    print("=" * 60)
    print()
    
    # Check for CSV files in Downloads folder
    csv_directory = os.path.join(os.path.expanduser('~'), 'Downloads')
    
    if not os.path.exists(csv_directory):
        print(f"❌ CSV directory not found: {csv_directory}")
        print("Please ensure CSV files are in your Downloads folder")
        exit(1)
    
    print(f"📂 CSV Directory: {csv_directory}")
    print()
    
    success = import_employees(csv_directory)
    
    print()
    if success:
        print("🎉 Done! Ready to use /drwcorp dashboard.")
    else:
        print("❌ Import failed.")
    print()
