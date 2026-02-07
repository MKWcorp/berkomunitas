#!/usr/bin/env python3
"""
Create drwcorp_employees table
"""

import os
import psycopg2
from urllib.parse import urlparse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def create_table():
    """Create drwcorp_employees table"""
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("❌ DATABASE_URL not found in environment variables")
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
        
        print("🔄 Creating drwcorp_employees table...")
        
        # Create table SQL
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS drwcorp_employees (
            id SERIAL PRIMARY KEY,
            nama_lengkap VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            divisi VARCHAR(100) NOT NULL,
            member_id INTEGER REFERENCES members(id) ON DELETE SET NULL,
            matching_status VARCHAR(50) DEFAULT 'unmatched',
            matching_confidence FLOAT,
            matching_suggestions JSONB,
            confirmed_at TIMESTAMPTZ,
            confirmed_by VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_drwcorp_employees_divisi 
            ON drwcorp_employees(divisi);
        
        CREATE INDEX IF NOT EXISTS idx_drwcorp_employees_matching_status 
            ON drwcorp_employees(matching_status);
        
        CREATE INDEX IF NOT EXISTS idx_drwcorp_employees_member_id 
            ON drwcorp_employees(member_id);
        
        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_drwcorp_employees_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS trigger_update_drwcorp_employees_updated_at 
            ON drwcorp_employees;
        
        CREATE TRIGGER trigger_update_drwcorp_employees_updated_at
            BEFORE UPDATE ON drwcorp_employees
            FOR EACH ROW
            EXECUTE FUNCTION update_drwcorp_employees_updated_at();
        """
        
        cursor.execute(create_table_sql)
        conn.commit()
        
        print("✅ Table drwcorp_employees created successfully!")
        print("✅ Indexes created successfully!")
        print("✅ Triggers created successfully!")
        
        # Get table info
        cursor.execute("""
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'drwcorp_employees'
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        
        print("\n📋 Table Structure:")
        print("-" * 60)
        for col in columns:
            nullable = "NULL" if col[2] == "YES" else "NOT NULL"
            print(f"  {col[0]:30} {col[1]:20} {nullable}")
        print("-" * 60)
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("CREATE DRWCORP EMPLOYEES TABLE")
    print("=" * 60)
    print()
    
    success = create_table()
    
    print()
    if success:
        print("🎉 Done! Ready for data import.")
    else:
        print("❌ Failed to create table.")
    print()
