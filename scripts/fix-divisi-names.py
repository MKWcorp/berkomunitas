#!/usr/bin/env python3
"""
Fix corrupt divisi names - merge subdivisions into proper divisions
"""

import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

def fix_divisi():
    """Fix divisi names in database"""
    
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found")
        return False
    
    url = urlparse(database_url)
    
    try:
        conn = psycopg2.connect(
            host=url.hostname,
            port=url.port,
            user=url.username,
            password=url.password,
            database=url.path.lstrip('/'),
            sslmode='prefer'
        )
        cursor = conn.cursor()
        
        # Mapping of wrong divisi names to correct ones
        fixes = {
            'Amat Sugeng Rochadi': 'CV Wahyu',
            'Fitrotul Choiroh': 'CV Wahyu',
            'Junaedi Alwanto': 'CV Wahyu',
            'Purbowo': 'CV Wahyu',
            'CV WAHYU': 'CV Wahyu',  # Fix case inconsistency
            'DEWI KARTIKA': 'Dewi Kartika'  # Fix case inconsistency
        }
        
        print("🔧 Fixing Divisi Names")
        print("=" * 50)
        
        total_fixed = 0
        
        for wrong_name, correct_name in fixes.items():
            # Check count
            cursor.execute(
                "SELECT COUNT(*) FROM drwcorp_employees WHERE divisi = %s",
                (wrong_name,)
            )
            count = cursor.fetchone()[0]
            
            if count > 0:
                print(f"\n'{wrong_name}' → '{correct_name}' ({count} karyawan)")
                
                # Update
                cursor.execute(
                    "UPDATE drwcorp_employees SET divisi = %s WHERE divisi = %s",
                    (correct_name, wrong_name)
                )
                
                total_fixed += count
                print(f"  ✓ Updated {count} records")
            else:
                print(f"\n'{wrong_name}' → skipped (0 records)")
        
        # Commit changes
        conn.commit()
        
        # Show final divisi list
        print("\n" + "=" * 50)
        print("📊 Final Divisi List:")
        cursor.execute("""
            SELECT divisi, COUNT(*) 
            FROM drwcorp_employees 
            GROUP BY divisi 
            ORDER BY divisi
        """)
        
        divisi_counts = cursor.fetchall()
        total_employees = 0
        
        for divisi, count in divisi_counts:
            print(f"  {divisi}: {count}")
            total_employees += count
        
        print(f"\nTotal Employees: {total_employees}")
        print(f"Total Fixed: {total_fixed}")
        
        cursor.close()
        conn.close()
        
        print("\n✅ Divisi fix complete!")
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    fix_divisi()
