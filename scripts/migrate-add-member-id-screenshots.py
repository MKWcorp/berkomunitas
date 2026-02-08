"""
Migration Script: Add member_id and status fields to tugas_ai_2_screenshots
Date: February 8, 2026
"""
import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ DATABASE_URL not found in .env file")
        return False
    
    # Remove unsupported parameters for psycopg2
    if 'connection_limit' in database_url:
        database_url = database_url.split('?')[0]
        print("⚠️  Removed connection_limit parameter from DATABASE_URL")
    
    conn = None
    try:
        # Connect to database
        print("📡 Connecting to database...")
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        print("✅ Connected to database")
        
        # Check if columns already exist
        print("\n🔍 Checking existing columns...")
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tugas_ai_2_screenshots' 
            AND column_name IN ('member_id', 'status', 'verified_at', 'verification_attempts')
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        print(f"Existing columns: {existing_columns}")
        
        # Add member_id if not exists
        if 'member_id' not in existing_columns:
            print("\n➕ Adding member_id column...")
            cursor.execute("""
                ALTER TABLE tugas_ai_2_screenshots 
                ADD COLUMN member_id INT
            """)
            print("✅ member_id column added")
        else:
            print("⏭️  member_id column already exists")
        
        # Add status if not exists
        if 'status' not in existing_columns:
            print("\n➕ Adding status column...")
            cursor.execute("""
                ALTER TABLE tugas_ai_2_screenshots 
                ADD COLUMN status VARCHAR(50) DEFAULT 'sedang_verifikasi'
            """)
            print("✅ status column added")
        else:
            print("⏭️  status column already exists")
        
        # Add verified_at if not exists
        if 'verified_at' not in existing_columns:
            print("\n➕ Adding verified_at column...")
            cursor.execute("""
                ALTER TABLE tugas_ai_2_screenshots 
                ADD COLUMN verified_at TIMESTAMPTZ
            """)
            print("✅ verified_at column added")
        else:
            print("⏭️  verified_at column already exists")
        
        # Add verification_attempts if not exists
        if 'verification_attempts' not in existing_columns:
            print("\n➕ Adding verification_attempts column...")
            cursor.execute("""
                ALTER TABLE tugas_ai_2_screenshots
                ADD COLUMN verification_attempts INT DEFAULT 0
            """)
            print("✅ verification_attempts column added")
        else:
            print("⏭️  verification_attempts column already exists")
        
        # Create indexes if they don't exist
        print("\n🔧 Creating indexes...")
        
        # Check existing indexes
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'tugas_ai_2_screenshots'
        """)
        existing_indexes = [row[0] for row in cursor.fetchall()]
        
        if 'idx_tugas_ai_2_screenshots_member_id' not in existing_indexes:
            cursor.execute("""
                CREATE INDEX idx_tugas_ai_2_screenshots_member_id 
                ON tugas_ai_2_screenshots(member_id)
            """)
            print("✅ Index on member_id created")
        else:
            print("⏭️  Index on member_id already exists")
        
        if 'idx_tugas_ai_2_screenshots_task_member' not in existing_indexes:
            cursor.execute("""
                CREATE INDEX idx_tugas_ai_2_screenshots_task_member 
                ON tugas_ai_2_screenshots(tugas_ai_2_id, member_id)
            """)
            print("✅ Composite index on (task, member) created")
        else:
            print("⏭️  Composite index already exists")
        
        if 'idx_tugas_ai_2_screenshots_status' not in existing_indexes:
            cursor.execute("""
                CREATE INDEX idx_tugas_ai_2_screenshots_status 
                ON tugas_ai_2_screenshots(status)
            """)
            print("✅ Index on status created")
        else:
            print("⏭️  Index on status already exists")
        
        # Commit changes
        conn.commit()
        print("\n✅ Migration completed successfully!")
        
        # Show final table structure
        print("\n📊 Final table structure:")
        cursor.execute("""
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'tugas_ai_2_screenshots'
            ORDER BY ordinal_position
        """)
        
        print(f"\n{'Column Name':<30} {'Type':<20} {'Nullable':<10} {'Default':<30}")
        print("-" * 90)
        for row in cursor.fetchall():
            col_name, data_type, nullable, default = row
            default_val = str(default)[:30] if default else ''
            print(f"{col_name:<30} {data_type:<20} {nullable:<10} {default_val:<30}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        print(f"Error type: {type(e).__name__}")
        if conn is not None:
            conn.rollback()
            conn.close()
        return False

if __name__ == "__main__":
    print("=" * 90)
    print("  MIGRATION: Add member_id and status to tugas_ai_2_screenshots")
    print("=" * 90)
    
    success = run_migration()
    
    if success:
        print("\n✅ You can now use the screenshot upload feature!")
    else:
        print("\n❌ Migration failed. Please check errors above.")
