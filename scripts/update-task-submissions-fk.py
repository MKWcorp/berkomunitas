#!/usr/bin/env python3
"""
Update task_submissions foreign key to CASCADE DELETE.
When a tugas_ai is deleted, all related task_submissions will be automatically deleted.

This script directly updates the database constraint without Prisma migrate.
"""

import os
import sys
import psycopg2
from urllib.parse import urlparse

def get_db_connection():
    """Get database connection from DATABASE_URL env variable."""
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ ERROR: DATABASE_URL environment variable not set!")
        print("   Set it in .env file or export it:")
        print("   export DATABASE_URL='postgresql://user:pass@host:5432/dbname'")
        sys.exit(1)
    
    try:
        # Parse DATABASE_URL
        result = urlparse(database_url)
        
        # Remove query parameters for psycopg2
        clean_url = f"postgresql://{result.netloc}{result.path}"
        
        conn = psycopg2.connect(clean_url)
        return conn
    except Exception as e:
        print(f"❌ ERROR connecting to database: {e}")
        sys.exit(1)

def check_current_constraint(conn):
    """Check current foreign key constraint."""
    print("🔍 Checking current foreign key constraint...")
    print()
    
    cur = conn.cursor()
    
    # Query to get current constraint
    query = """
    SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
        ON tc.constraint_name = rc.constraint_name
        AND tc.table_schema = rc.constraint_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'task_submissions'
        AND kcu.column_name = 'id_task';
    """
    
    cur.execute(query)
    result = cur.fetchone()
    
    if result:
        constraint_name, table_name, column_name, foreign_table, foreign_column, delete_rule = result
        print(f"📋 Current Constraint:")
        print(f"   Name: {constraint_name}")
        print(f"   Table: {table_name}")
        print(f"   Column: {column_name} → {foreign_table}.{foreign_column}")
        print(f"   Delete Rule: {delete_rule}")
        print()
        return constraint_name, delete_rule
    else:
        print("⚠️  No foreign key constraint found on task_submissions.id_task")
        return None, None

def update_constraint(conn, constraint_name):
    """Update foreign key constraint to CASCADE."""
    print("🔧 Updating foreign key constraint to CASCADE DELETE...")
    print()
    
    cur = conn.cursor()
    
    try:
        # Begin transaction
        conn.autocommit = False
        
        # Step 1: Drop existing constraint
        print(f"   1. Dropping existing constraint: {constraint_name}")
        drop_sql = f'ALTER TABLE task_submissions DROP CONSTRAINT "{constraint_name}";'
        cur.execute(drop_sql)
        print("      ✅ Constraint dropped")
        
        # Step 2: Add new constraint with CASCADE
        print(f"   2. Adding new constraint with CASCADE DELETE")
        add_sql = """
        ALTER TABLE task_submissions
        ADD CONSTRAINT task_submissions_id_task_fkey
        FOREIGN KEY (id_task)
        REFERENCES tugas_ai(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
        """
        cur.execute(add_sql)
        print("      ✅ New constraint added")
        
        # Commit transaction
        conn.commit()
        conn.autocommit = True
        
        print()
        print("✅ SUCCESS! Foreign key constraint updated to CASCADE DELETE")
        return True
        
    except Exception as e:
        conn.rollback()
        print()
        print(f"❌ ERROR updating constraint: {e}")
        return False

def verify_constraint(conn):
    """Verify the constraint was updated correctly."""
    print()
    print("🔍 Verifying updated constraint...")
    print()
    
    constraint_name, delete_rule = check_current_constraint(conn)
    
    if delete_rule == 'CASCADE':
        print("✅ VERIFIED: Delete rule is now CASCADE")
        return True
    else:
        print(f"⚠️  WARNING: Delete rule is still {delete_rule}")
        return False

def test_cascade_delete(conn):
    """Test cascade delete functionality (dry run)."""
    print()
    print("🧪 Testing cascade delete (DRY RUN)...")
    print()
    
    cur = conn.cursor()
    
    # Get a task with submissions
    cur.execute("""
        SELECT t.id, t.keyword_tugas, COUNT(ts.id) as submission_count
        FROM tugas_ai t
        LEFT JOIN task_submissions ts ON ts.id_task = t.id
        GROUP BY t.id, t.keyword_tugas
        HAVING COUNT(ts.id) > 0
        ORDER BY COUNT(ts.id) DESC
        LIMIT 1;
    """)
    
    result = cur.fetchone()
    
    if result:
        task_id, keyword, submission_count = result
        print(f"📝 Sample Task:")
        print(f"   ID: {task_id}")
        print(f"   Keyword: {keyword}")
        print(f"   Submissions: {submission_count}")
        print()
        print("💡 Now when you delete this task, all submissions will be automatically deleted!")
        print(f"   DELETE FROM tugas_ai WHERE id = {task_id};")
        print(f"   → Will also delete {submission_count} submission(s)")
        print()
    else:
        print("ℹ️  No tasks with submissions found for testing")
    
    print("✅ Cascade delete is ready to use!")

def main():
    print("=" * 80)
    print("UPDATE FOREIGN KEY: task_submissions → tugas_ai (CASCADE DELETE)")
    print("=" * 80)
    print()
    
    # Get database connection
    conn = get_db_connection()
    
    # Check current constraint
    constraint_name, delete_rule = check_current_constraint(conn)
    
    if not constraint_name:
        print("❌ Cannot proceed without existing constraint")
        conn.close()
        return
    
    # Check if already CASCADE
    if delete_rule == 'CASCADE':
        print("✅ Constraint already set to CASCADE DELETE!")
        print("   No changes needed.")
        conn.close()
        return
    
    # Ask for confirmation
    print("⚠️  WARNING: This will modify the database schema!")
    print()
    print(f"Current: ON DELETE {delete_rule}")
    print(f"New:     ON DELETE CASCADE")
    print()
    print("This means: When a task is deleted, ALL related submissions will be automatically deleted.")
    print()
    
    confirm = input("Continue? (yes/no): ").strip().lower()
    
    if confirm != 'yes':
        print()
        print("❌ Operation cancelled by user")
        conn.close()
        return
    
    print()
    
    # Update constraint
    success = update_constraint(conn, constraint_name)
    
    if success:
        # Verify
        verify_constraint(conn)
        
        # Test (dry run)
        test_cascade_delete(conn)
        
        print()
        print("=" * 80)
        print("NEXT STEPS:")
        print("=" * 80)
        print("1. ✅ Database constraint updated")
        print("2. Update Prisma schema to match:")
        print()
        print("   In prisma/schema.prisma, change:")
        print("   tugas_ai_relation @relation(..., onDelete: NoAction, ...)")
        print("   TO:")
        print("   tugas_ai_relation @relation(..., onDelete: Cascade, ...)")
        print()
        print("3. Generate Prisma client:")
        print("   npx prisma generate")
        print()
        print("4. Now DELETE endpoint will work without manual cascade!")
        print()
    else:
        print()
        print("❌ Failed to update constraint")
        print("   Check error message above")
    
    conn.close()
    print()

if __name__ == "__main__":
    main()
