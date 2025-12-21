"""
Fix PlatformSession table - Remove point column if exists
"""
import psycopg2

DB_CONFIG = {
    'host': '213.190.4.159',
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688',
    'port': 5432
}

def fix_platform_session():
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("Checking PlatformSession table structure...")
    
    # Check if point column exists
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'PlatformSession';
    """)
    
    columns = cursor.fetchall()
    print("\nCurrent columns in PlatformSession:")
    for col in columns:
        print(f"  - {col[0]}: {col[1]} {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
      # Check if point column exists
    cursor.execute("""
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'PlatformSession' AND column_name = 'point'
        );
    """)
    point_exists = cursor.fetchone()[0]
    
    if point_exists:
        print("\n⚠️  Found 'point' column in PlatformSession table!")
        
        # Check if there's any data in the table
        cursor.execute('SELECT COUNT(*) FROM "PlatformSession";')
        count = cursor.fetchone()[0]
        print(f"   Total records in PlatformSession: {count}")
        
        # Check if point column has any non-null values
        cursor.execute('SELECT COUNT(*) FROM "PlatformSession" WHERE point IS NOT NULL;')
        point_count = cursor.fetchone()[0]
        print(f"   Records with point values: {point_count}")
        
        if point_count > 0:
            # Show sample data
            cursor.execute('SELECT id, member_id, platform, point FROM "PlatformSession" WHERE point IS NOT NULL LIMIT 5;')
            samples = cursor.fetchall()
            print("\n   Sample data with point values:")
            for sample in samples:
                print(f"     - Session {sample[0]}: member_id={sample[1]}, platform={sample[2]}, point={sample[3]}")
            
            print("\n⚠️  TIDAK menghapus kolom 'point' karena ada data!")
            print("   Opsi:")
            print("   1. Buat kolom 'point' menjadi NULLABLE (optional)")
            print("   2. Beri default value")
            
            response = input("\n   Buat kolom 'point' menjadi NULLABLE? (y/n): ")
            if response.lower() == 'y':
                cursor.execute("""
                    ALTER TABLE "PlatformSession" ALTER COLUMN point DROP NOT NULL;
                """)
                conn.commit()
                print("   ✅ Kolom 'point' sekarang NULLABLE")
        else:
            print("\n   Kolom 'point' ada tapi tidak ada data.")
            response = input("   Hapus kolom ini? (y/n): ")
            if response.lower() == 'y':
                cursor.execute("""
                    ALTER TABLE "PlatformSession" DROP COLUMN IF EXISTS point;
                """)
                conn.commit()
                print("   ✅ 'point' column removed successfully!")
    else:
        print("\n✅ No 'point' column found. Table structure is correct.")
    
    # Verify final structure
    cursor.execute("""
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'PlatformSession'
        ORDER BY ordinal_position;
    """)
    
    columns = cursor.fetchall()
    print("\nFinal PlatformSession structure:")
    for col in columns:
        print(f"  - {col[0]}: {col[1]} {'NULL' if col[2] == 'YES' else 'NOT NULL'}")
    
    cursor.close()
    conn.close()
    print("\n✅ Done!")

if __name__ == "__main__":
    fix_platform_session()
