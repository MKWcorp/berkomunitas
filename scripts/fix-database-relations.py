#!/usr/bin/env python3
"""
Database Relation Migration Script
Migrates clerk_id-based relations to member_id for SSO compatibility
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    """Create database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        sys.exit(1)

def analyze_database_relations():
    """Analyze all clerk_id relations in database"""
    print("\n" + "="*80)
    print("📊 ANALYZING DATABASE RELATIONS")
    print("="*80 + "\n")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
      # Check member_emails
    print("1️⃣ Checking member_emails table...")
    
    # Check if member_id column exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'member_emails' AND column_name = 'member_id'
    """)
    has_member_id_col = cursor.fetchone() is not None
    
    if has_member_id_col:
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(clerk_id) as has_clerk_id,
                COUNT(member_id) as has_member_id,
                COUNT(*) FILTER (WHERE clerk_id IS NOT NULL AND member_id IS NULL) as needs_migration
            FROM member_emails
        """)
        result = cursor.fetchone()
        print(f"   Total records: {result['total']}")
        print(f"   Has clerk_id: {result['has_clerk_id']}")
        print(f"   Has member_id: {result['has_member_id']}")
        print(f"   Needs migration: {result['needs_migration']}")
    else:
        cursor.execute("SELECT COUNT(*) as total, COUNT(clerk_id) as has_clerk_id FROM member_emails")
        result = cursor.fetchone()
        print(f"   Total records: {result['total']}")
        print(f"   Has clerk_id: {result['has_clerk_id']}")
        print(f"   ⚠️  member_id column does not exist yet")
      # Check user_privileges
    print("\n2️⃣ Checking user_privileges table...")
    
    # Check if member_id column exists
    cursor.execute("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_privileges' AND column_name = 'member_id'
    """)
    has_member_id_col = cursor.fetchone() is not None
    
    if has_member_id_col:
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(clerk_id) as has_clerk_id,
                COUNT(member_id) as has_member_id,
                COUNT(*) FILTER (WHERE clerk_id IS NOT NULL AND member_id IS NULL) as needs_migration,
                COUNT(*) FILTER (WHERE privilege = 'admin') as admin_count
            FROM user_privileges
        """)
        result = cursor.fetchone()
        print(f"   Total records: {result['total']}")
        print(f"   Has clerk_id: {result['has_clerk_id']}")
        print(f"   Has member_id: {result['has_member_id']}")
        print(f"   Needs migration: {result['needs_migration']}")
        print(f"   Admin privileges: {result['admin_count']}")
    else:
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                COUNT(clerk_id) as has_clerk_id,
                COUNT(*) FILTER (WHERE privilege = 'admin') as admin_count
            FROM user_privileges
        """)
        result = cursor.fetchone()
        print(f"   Total records: {result['total']}")
        print(f"   Has clerk_id: {result['has_clerk_id']}")
        print(f"   Admin privileges: {result['admin_count']}")
        print(f"   ⚠️  member_id column does not exist yet")
    
    # Check members with SSO
    print("\n3️⃣ Checking members table...")
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(clerk_id) as has_clerk_id,
            COUNT(google_id) as has_google_id,
            COUNT(*) FILTER (WHERE clerk_id IS NOT NULL) as clerk_users,
            COUNT(*) FILTER (WHERE google_id IS NOT NULL) as sso_users
        FROM members
    """)
    result = cursor.fetchone()
    print(f"   Total members: {result['total']}")
    print(f"   Clerk users: {result['clerk_users']}")
    print(f"   SSO users: {result['sso_users']}")
    
    cursor.close()
    conn.close()
    
    return True

def migrate_member_emails():
    """Migrate member_emails from clerk_id to member_id"""
    print("\n" + "="*80)
    print("🔄 MIGRATING member_emails TABLE")
    print("="*80 + "\n")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if member_id column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'member_emails' AND column_name = 'member_id'
        """)
        
        if not cursor.fetchone():
            print("⚠️  Adding member_id column...")
            cursor.execute("""
                ALTER TABLE member_emails 
                ADD COLUMN member_id INT
            """)
            conn.commit()
            print("✅ member_id column added")
        else:
            print("✅ member_id column already exists")
        
        # Populate member_id from clerk_id
        print("\n📝 Populating member_id from clerk_id...")
        cursor.execute("""
            UPDATE member_emails me
            SET member_id = m.id
            FROM members m
            WHERE me.clerk_id = m.clerk_id
            AND me.member_id IS NULL
        """)
        updated = cursor.rowcount
        conn.commit()
        print(f"✅ Updated {updated} records")
        
        # Create foreign key constraint if not exists
        print("\n🔗 Creating foreign key constraint...")
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'member_emails' 
            AND constraint_name = 'fk_member_emails_member_id'
        """)
        
        if not cursor.fetchone():
            cursor.execute("""
                ALTER TABLE member_emails 
                ADD CONSTRAINT fk_member_emails_member_id 
                FOREIGN KEY (member_id) REFERENCES members(id) 
                ON DELETE CASCADE
            """)
            conn.commit()
            print("✅ Foreign key constraint created")
        else:
            print("✅ Foreign key constraint already exists")
        
        # Create index
        print("\n📊 Creating index...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_member_emails_member_id 
            ON member_emails(member_id)
        """)
        conn.commit()
        print("✅ Index created")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        cursor.close()
        conn.close()
        return False

def migrate_user_privileges():
    """Migrate user_privileges from clerk_id to member_id"""
    print("\n" + "="*80)
    print("🔄 MIGRATING user_privileges TABLE")
    print("="*80 + "\n")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Check if member_id column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'user_privileges' AND column_name = 'member_id'
        """)
        
        if not cursor.fetchone():
            print("⚠️  Adding member_id column...")
            cursor.execute("""
                ALTER TABLE user_privileges 
                ADD COLUMN member_id INT
            """)
            conn.commit()
            print("✅ member_id column added")
        else:
            print("✅ member_id column already exists")
        
        # Populate member_id from clerk_id
        print("\n📝 Populating member_id from clerk_id...")
        cursor.execute("""
            UPDATE user_privileges up
            SET member_id = m.id
            FROM members m
            WHERE up.clerk_id = m.clerk_id
            AND up.member_id IS NULL
        """)
        updated = cursor.rowcount
        conn.commit()
        print(f"✅ Updated {updated} records")
        
        # Show admin privileges status
        print("\n👑 Admin privileges status:")
        cursor.execute("""
            SELECT 
                up.id,
                up.clerk_id,
                up.member_id,
                m.nama_lengkap,
                m.email,
                m.google_id,
                up.privilege,
                up.is_active
            FROM user_privileges up
            LEFT JOIN members m ON up.member_id = m.id
            WHERE up.privilege = 'admin'
            ORDER BY up.id
        """)
        
        admins = cursor.fetchall()
        for admin in admins:
            status = "✅" if admin['is_active'] else "❌"
            print(f"   {status} ID: {admin['id']} | Member: {admin['nama_lengkap']} | Email: {admin['email']}")
        
        # Create foreign key constraint if not exists
        print("\n🔗 Creating foreign key constraint...")
        cursor.execute("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'user_privileges' 
            AND constraint_name = 'fk_user_privileges_member_id'
        """)
        
        if not cursor.fetchone():
            cursor.execute("""
                ALTER TABLE user_privileges 
                ADD CONSTRAINT fk_user_privileges_member_id 
                FOREIGN KEY (member_id) REFERENCES members(id) 
                ON DELETE CASCADE
            """)
            conn.commit()
            print("✅ Foreign key constraint created")
        else:
            print("✅ Foreign key constraint already exists")
        
        # Create index
        print("\n📊 Creating index...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_user_privileges_member_id 
            ON user_privileges(member_id)
        """)
        conn.commit()
        print("✅ Index created")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Migration failed: {e}")
        cursor.close()
        conn.close()
        return False

def verify_migration():
    """Verify migration was successful"""
    print("\n" + "="*80)
    print("✅ VERIFYING MIGRATION")
    print("="*80 + "\n")
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    # Verify member_emails
    print("1️⃣ Verifying member_emails...")
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(member_id) as has_member_id,
            COUNT(*) FILTER (WHERE clerk_id IS NOT NULL AND member_id IS NULL) as orphaned
        FROM member_emails
    """)
    result = cursor.fetchone()
    
    if result['orphaned'] == 0:
        print(f"   ✅ All {result['total']} records have member_id")
    else:
        print(f"   ⚠️  {result['orphaned']} records still need migration")
    
    # Verify user_privileges
    print("\n2️⃣ Verifying user_privileges...")
    cursor.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(member_id) as has_member_id,
            COUNT(*) FILTER (WHERE clerk_id IS NOT NULL AND member_id IS NULL) as orphaned,
            COUNT(*) FILTER (WHERE privilege = 'admin' AND member_id IS NOT NULL) as admin_migrated
        FROM user_privileges
    """)
    result = cursor.fetchone()
    
    if result['orphaned'] == 0:
        print(f"   ✅ All {result['total']} privileges have member_id")
        print(f"   ✅ {result['admin_migrated']} admin privileges migrated")
    else:
        print(f"   ⚠️  {result['orphaned']} privileges still need migration")
    
    cursor.close()
    conn.close()

def main():
    """Main execution"""
    print("\n" + "="*80)
    print("🚀 DATABASE RELATION MIGRATION SCRIPT")
    print("="*80)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Database: {DATABASE_URL.split('@')[1] if '@' in DATABASE_URL else 'Unknown'}")
    print("="*80 + "\n")
    
    # Step 1: Analyze current state
    if not analyze_database_relations():
        print("\n❌ Analysis failed. Exiting.")
        sys.exit(1)
    
    # Ask for confirmation
    print("\n" + "="*80)
    response = input("⚠️  Proceed with migration? (yes/no): ").strip().lower()
    
    if response != 'yes':
        print("❌ Migration cancelled by user.")
        sys.exit(0)
    
    # Step 2: Migrate member_emails
    if not migrate_member_emails():
        print("\n❌ member_emails migration failed. Exiting.")
        sys.exit(1)
    
    # Step 3: Migrate user_privileges
    if not migrate_user_privileges():
        print("\n❌ user_privileges migration failed. Exiting.")
        sys.exit(1)
    
    # Step 4: Verify
    verify_migration()
    
    print("\n" + "="*80)
    print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
    print("="*80)
    print("\n📝 Next steps:")
    print("   1. Update Prisma schema (already done)")
    print("   2. Run: npx prisma generate")
    print("   3. Update API routes to use member_id")
    print("   4. Test SSO login and admin features")
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()
