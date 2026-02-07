import psycopg2
import os
from urllib.parse import urlparse
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

def parse_database_url(url):
    """Parse PostgreSQL connection string"""
    result = urlparse(url)
    return {
        'host': result.hostname,
        'port': result.port or 5432,
        'database': result.path[1:].split('?')[0],  # Remove leading / and query params
        'user': result.username,
        'password': result.password
    }

def run_migration():
    print('🚀 Starting CASCADE DELETE migration...\n')
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print('❌ ERROR: DATABASE_URL not found in environment')
        return False
    
    # Parse connection parameters
    db_params = parse_database_url(database_url)
    print(f'📡 Connecting to: {db_params["host"]}:{db_params["port"]}/{db_params["database"]}')
    
    try:
        # Connect to database
        conn = psycopg2.connect(**db_params)
        conn.autocommit = False  # We want manual transaction control
        cursor = conn.cursor()
        
        print('✅ Connected to database\n')
        
        # Read migration file
        migration_path = 'prisma/migrations/add_cascade_delete_missing_tables.sql'
        print(f'📝 Reading migration file: {migration_path}')
        
        with open(migration_path, 'r', encoding='utf-8') as f:
            migration_sql = f.read()
        
        print('⚙️  Executing migration...\n')
        
        # Execute the entire SQL script
        cursor.execute(migration_sql)
        
        # Get all notices (including our SUCCESS message)
        for notice in conn.notices:
            print(notice.strip())
        
        # Commit transaction
        conn.commit()
        print('\n✅ Migration committed successfully!\n')
        
        # Verify constraints
        print('🔍 Verifying constraints...\n')
        cursor.execute("""
            SELECT 
                tc.table_name,
                tc.constraint_name,
                rc.delete_rule
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.referential_constraints AS rc
                  ON tc.constraint_name = rc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name IN ('task_submissions', 'reward_redemptions', 'member_transactions')
              AND tc.constraint_name IN ('task_submissions_id_member_fkey', 'fk_member', 'member_transactions_member_id_fkey')
            ORDER BY tc.table_name
        """)
        
        results = cursor.fetchall()
        cascade_count = sum(1 for r in results if r[2] == 'CASCADE')
        
        print('Constraint Status (Target Constraints Only):')
        print('-' * 70)
        for table, constraint, delete_rule in results:
            status = '✅' if delete_rule == 'CASCADE' else '❌'
            print(f'{status} {table:<25} {constraint:<35} {delete_rule}')
        print('-' * 70)
        
        # Check for the 3 specific constraints
        expected_constraints = {
            'task_submissions_id_member_fkey',
            'fk_member', 
            'member_transactions_member_id_fkey'
        }
        found_constraints = {r[1] for r in results if r[2] == 'CASCADE'}
        
        if expected_constraints.issubset(found_constraints):
            print(f'\n✅ SUCCESS: All 3 target constraints now have CASCADE DELETE!')
            print('   📌 task_submissions.id_member → CASCADE')
            print('   📌 reward_redemptions.id_member → CASCADE')
            print('   📌 member_transactions.member_id → CASCADE')
            return True
        else:
            print(f'\n⚠️  WARNING: Some target constraints missing or not CASCADE')
            missing = expected_constraints - found_constraints
            if missing:
                print(f'   Missing: {missing}')
            return False
        
    except psycopg2.Error as e:
        print(f'\n❌ Database error: {e}')
        if conn:
            conn.rollback()
            print('🔄 Transaction rolled back')
        return False
        
    except FileNotFoundError:
        print(f'❌ Migration file not found: {migration_path}')
        return False
        
    except Exception as e:
        print(f'\n❌ Unexpected error: {e}')
        if conn:
            conn.rollback()
            print('🔄 Transaction rolled back')
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print('\n🔌 Database connection closed')

if __name__ == '__main__':
    print('=' * 70)
    print('  CASCADE DELETE MIGRATION FOR BERKOMUNITAS')
    print('=' * 70)
    print()
    
    success = run_migration()
    
    print()
    print('=' * 70)
    if success:
        print('  ✅ MIGRATION COMPLETED SUCCESSFULLY!')
    else:
        print('  ❌ MIGRATION FAILED')
    print('=' * 70)
    
    exit(0 if success else 1)
