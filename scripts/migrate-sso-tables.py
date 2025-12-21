"""
SSO Database Migration - Safe Migration for Existing Database
Adds SSO tables without affecting existing data
"""
import psycopg2
from psycopg2 import sql
import sys
from datetime import datetime

# Database configuration
DB_CONFIG = {
    'host': '213.190.4.159',
    'database': 'berkomunitas_db',
    'user': 'berkomunitas',
    'password': 'berkomunitas688',
    'port': 5432
}

def check_connection():
    """Test database connection"""
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute('SELECT version();')
        version = cursor.fetchone()
        print(f"✅ Connected to PostgreSQL: {version[0][:50]}...")
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def check_existing_tables():
    """Check if SSO tables already exist"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    tables_to_check = ['PlatformSession', 'UserActivity', 'RegisteredPlatform']
    existing_tables = []
    
    for table in tables_to_check:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = %s
            );
        """, (table,))
        exists = cursor.fetchone()[0]
        if exists:
            existing_tables.append(table)
    
    cursor.close()
    conn.close()
    
    return existing_tables

def check_members_columns():
    """Check if members table has SSO columns"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    columns_to_check = ['google_id', 'email', 'last_login_at', 'sso_metadata']
    existing_columns = []
    
    for column in columns_to_check:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'members' AND column_name = %s
            );
        """, (column,))
        exists = cursor.fetchone()[0]
        if exists:
            existing_columns.append(column)
    
    cursor.close()
    conn.close()
    
    return existing_columns

def backup_members_table():
    """Create backup of members table structure"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_file = f'backup_members_structure_{timestamp}.sql'
    
    try:
        # Get table structure
        cursor.execute("""
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'members'
            ORDER BY ordinal_position;
        """)
        columns = cursor.fetchall()
        
        # Count records
        cursor.execute("SELECT COUNT(*) FROM members;")
        count = cursor.fetchone()[0]
        
        with open(backup_file, 'w') as f:
            f.write(f"-- Backup of members table structure\n")
            f.write(f"-- Created: {datetime.now()}\n")
            f.write(f"-- Total records: {count}\n\n")
            f.write("-- Columns:\n")
            for col in columns:
                f.write(f"-- {col[0]}: {col[1]} {col[2] or ''} {'NULL' if col[3] == 'YES' else 'NOT NULL'}\n")
        
        print(f"✅ Backup saved to: {backup_file}")
        print(f"   Total members: {count}")
        
        cursor.close()
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Backup failed: {e}")
        cursor.close()
        conn.close()
        return False

def add_members_columns():
    """Add SSO columns to members table"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n📝 Adding SSO columns to members table...")
    
    try:
        # Add google_id column
        print("  - Adding google_id column...")
        cursor.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='members' AND column_name='google_id'
                ) THEN
                    ALTER TABLE members ADD COLUMN google_id TEXT UNIQUE;
                    CREATE INDEX IF NOT EXISTS idx_members_google_id ON members(google_id);
                END IF;
            END $$;
        """)
        
        # Add email column if not exists
        print("  - Checking email column...")
        cursor.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='members' AND column_name='email'
                ) THEN
                    ALTER TABLE members ADD COLUMN email TEXT UNIQUE;
                    CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
                END IF;
            END $$;
        """)
        
        # Add last_login_at column
        print("  - Adding last_login_at column...")
        cursor.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='members' AND column_name='last_login_at'
                ) THEN
                    ALTER TABLE members ADD COLUMN last_login_at TIMESTAMPTZ;
                END IF;
            END $$;
        """)
        
        # Add sso_metadata column
        print("  - Adding sso_metadata column...")
        cursor.execute("""
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name='members' AND column_name='sso_metadata'
                ) THEN
                    ALTER TABLE members ADD COLUMN sso_metadata JSONB DEFAULT '{}'::jsonb;
                END IF;
            END $$;
        """)
        
        conn.commit()
        print("✅ Members table updated successfully")
        return True
        
    except Exception as e:
        print(f"❌ Failed to update members table: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def create_platform_session_table():
    """Create PlatformSession table"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n📝 Creating PlatformSession table...")
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "PlatformSession" (
                id TEXT PRIMARY KEY,
                member_id INTEGER NOT NULL,
                platform TEXT NOT NULL,
                jwt_token TEXT NOT NULL,
                refresh_token TEXT,
                expires_at TIMESTAMPTZ NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                last_activity_at TIMESTAMPTZ DEFAULT NOW(),
                FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_platform_session_member ON "PlatformSession"(member_id);
            CREATE INDEX IF NOT EXISTS idx_platform_session_platform ON "PlatformSession"(platform);
            CREATE INDEX IF NOT EXISTS idx_platform_session_expires ON "PlatformSession"(expires_at);
        """)
        
        conn.commit()
        print("✅ PlatformSession table created")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create PlatformSession table: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def create_user_activity_table():
    """Create UserActivity table"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n📝 Creating UserActivity table...")
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "UserActivity" (
                id TEXT PRIMARY KEY,
                member_id INTEGER NOT NULL,
                platform TEXT NOT NULL,
                activity_type TEXT NOT NULL,
                points_earned INTEGER DEFAULT 0,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
            );
            
            CREATE INDEX IF NOT EXISTS idx_user_activity_member ON "UserActivity"(member_id);
            CREATE INDEX IF NOT EXISTS idx_user_activity_platform ON "UserActivity"(platform);
            CREATE INDEX IF NOT EXISTS idx_user_activity_type ON "UserActivity"(activity_type);
            CREATE INDEX IF NOT EXISTS idx_user_activity_created ON "UserActivity"(created_at DESC);
        """)
        
        conn.commit()
        print("✅ UserActivity table created")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create UserActivity table: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def create_registered_platform_table():
    """Create RegisteredPlatform table"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n📝 Creating RegisteredPlatform table...")
    
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS "RegisteredPlatform" (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                domain TEXT NOT NULL,
                api_key TEXT UNIQUE NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                allowed_origins TEXT[] DEFAULT '{}',
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
            
            CREATE INDEX IF NOT EXISTS idx_platform_name ON "RegisteredPlatform"(name);
            CREATE INDEX IF NOT EXISTS idx_platform_active ON "RegisteredPlatform"(is_active);
        """)
        
        conn.commit()
        print("✅ RegisteredPlatform table created")
        return True
        
    except Exception as e:
        print(f"❌ Failed to create RegisteredPlatform table: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def insert_default_platforms():
    """Insert default platforms"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n📝 Inserting default platforms...")
    
    try:
        import secrets
        import json
        from psycopg2.extras import Json
        
        platforms = [
            {
                'id': 'plat_berkomunitas',
                'name': 'Berkomunitas',
                'domain': 'berkomunitas.com',
                'api_key': f"sk_berkomunitas_{secrets.token_urlsafe(32)}",
                'origins': ['https://berkomunitas.com', 'http://localhost:3000'],
                'desc': 'Main community platform'
            },
            {
                'id': 'plat_drwskincare',
                'name': 'DRW Skincare',
                'domain': 'drwskincare.com',
                'api_key': f"sk_drwskincare_{secrets.token_urlsafe(32)}",
                'origins': ['https://drwskincare.com', 'http://localhost:3001'],
                'desc': 'E-commerce platform'
            },
            {
                'id': 'plat_pos',
                'name': 'POS System',
                'domain': 'pos.drwskincare.com',
                'api_key': f"sk_pos_{secrets.token_urlsafe(32)}",
                'origins': ['*'],
                'desc': 'Mobile POS (Android/iOS)'
            },
        ]
        
        api_keys = {}
        
        for platform in platforms:
            cursor.execute("""
                INSERT INTO "RegisteredPlatform" 
                (id, name, domain, api_key, allowed_origins, metadata)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (name) DO NOTHING;
            """, (
                platform['id'],
                platform['name'],
                platform['domain'],
                platform['api_key'],
                platform['origins'],
                Json({'description': platform['desc']})
            ))
            api_keys[platform['name']] = platform['api_key']
        
        conn.commit()
        
        print("✅ Default platforms inserted")
        print("\n🔑 API KEYS (SAVE THESE!):")
        print("=" * 60)
        for name, key in api_keys.items():
            print(f"{name}: {key}")
        print("=" * 60)
        
        # Save to file
        with open('platform_api_keys.txt', 'w') as f:
            f.write(f"Generated: {datetime.now()}\n\n")
            for name, key in api_keys.items():
                f.write(f"{name}: {key}\n")
        print("\n✅ API keys saved to: platform_api_keys.txt")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to insert platforms: {e}")
        conn.rollback()
        return False
    finally:
        cursor.close()
        conn.close()

def verify_migration():
    """Verify all tables and columns are created"""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    print("\n🔍 Verifying migration...")
    
    success = True
    
    # Check tables
    tables = ['PlatformSession', 'UserActivity', 'RegisteredPlatform']
    for table in tables:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = %s
            );
        """, (table,))
        exists = cursor.fetchone()[0]
        if exists:
            cursor.execute(f'SELECT COUNT(*) FROM "{table}";')
            count = cursor.fetchone()[0]
            print(f"  ✅ {table} exists ({count} records)")
        else:
            print(f"  ❌ {table} not found")
            success = False
    
    # Check members columns
    columns = ['google_id', 'email', 'last_login_at', 'sso_metadata']
    for column in columns:
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'members' AND column_name = %s
            );
        """, (column,))
        exists = cursor.fetchone()[0]
        if exists:
            print(f"  ✅ members.{column} exists")
        else:
            print(f"  ❌ members.{column} not found")
            success = False
    
    cursor.close()
    conn.close()
    
    return success

def main():
    print("=" * 60)
    print("SSO DATABASE MIGRATION")
    print("=" * 60)
    
    # Step 1: Check connection
    print("\n[1/8] Testing database connection...")
    if not check_connection():
        print("\n❌ Migration aborted: Cannot connect to database")
        return False
    
    # Step 2: Check existing tables
    print("\n[2/8] Checking existing SSO tables...")
    existing_tables = check_existing_tables()
    if existing_tables:
        print(f"⚠️  Found existing tables: {', '.join(existing_tables)}")
        response = input("Continue anyway? (y/n): ")
        if response.lower() != 'y':
            print("Migration cancelled")
            return False
    else:
        print("✅ No existing SSO tables found")
    
    # Step 3: Check members columns
    print("\n[3/8] Checking members table columns...")
    existing_columns = check_members_columns()
    if existing_columns:
        print(f"⚠️  Found existing columns: {', '.join(existing_columns)}")
    else:
        print("✅ No SSO columns found in members table")
    
    # Step 4: Backup
    print("\n[4/8] Creating backup...")
    if not backup_members_table():
        print("\n❌ Migration aborted: Backup failed")
        return False
    
    # Step 5: Add members columns
    print("\n[5/8] Updating members table...")
    if not add_members_columns():
        print("\n❌ Migration failed at members table update")
        return False
    
    # Step 6: Create SSO tables
    print("\n[6/8] Creating SSO tables...")
    if not create_platform_session_table():
        return False
    if not create_user_activity_table():
        return False
    if not create_registered_platform_table():
        return False
    
    # Step 7: Insert default platforms
    print("\n[7/8] Setting up default platforms...")
    if not insert_default_platforms():
        return False
    
    # Step 8: Verify
    print("\n[8/8] Verifying migration...")
    if not verify_migration():
        print("\n⚠️  Migration completed with warnings")
        return False
    
    print("\n" + "=" * 60)
    print("✅ SSO MIGRATION COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print("\n📝 Next steps:")
    print("1. Save the API keys from platform_api_keys.txt")
    print("2. Update your .env file with Google OAuth credentials")
    print("3. Run: npm install")
    print("4. Test the SSO login")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
