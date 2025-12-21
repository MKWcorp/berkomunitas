#!/usr/bin/env python3
"""
Safe Database Migration: Enable Cascade Delete for task_submissions
With drift detection and rollback mechanism
"""

import os
import sys
import psycopg2
from psycopg2 import sql
from datetime import datetime
import json

# Color codes for terminal output
RED = '\033[91m'
GREEN = '\033[92m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
MAGENTA = '\033[95m'
CYAN = '\033[96m'
RESET = '\033[0m'

def get_db_connection():
    """Get database connection from environment variables"""
    try:
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            raise ValueError("DATABASE_URL not found in environment")
        
        # Remove Next.js specific parameters that psycopg2 doesn't understand
        database_url = database_url.split('?')[0]
        
        print(f"{CYAN}[INFO]{RESET} Connecting to database...")
        conn = psycopg2.connect(database_url)
        print(f"{GREEN}[SUCCESS]{RESET} Database connection established")
        return conn
    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Failed to connect to database: {e}")
        sys.exit(1)

def get_current_fk_constraint(cursor):
    """
    Get current foreign key constraint details for task_submissions.id_task
    Returns dict with constraint info or None if not found
    """
    query = """
    SELECT 
        con.conname AS constraint_name,
        con.confdeltype AS delete_action,
        con.confupdtype AS update_action,
        CASE con.confdeltype
            WHEN 'a' THEN 'NO ACTION'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
        END AS delete_action_text,
        att.attname AS column_name,
        ref_table.relname AS referenced_table,
        ref_att.attname AS referenced_column
    FROM pg_constraint con
    JOIN pg_class rel ON con.conrelid = rel.oid
    JOIN pg_namespace nsp ON rel.relnamespace = nsp.oid
    JOIN pg_attribute att ON att.attrelid = rel.oid AND att.attnum = ANY(con.conkey)
    JOIN pg_class ref_table ON con.confrelid = ref_table.oid
    JOIN pg_attribute ref_att ON ref_att.attrelid = ref_table.oid AND ref_att.attnum = ANY(con.confkey)
    WHERE 
        nsp.nspname = 'public'
        AND rel.relname = 'task_submissions'
        AND att.attname = 'id_task'
        AND con.contype = 'f'
    """
    
    try:
        cursor.execute(query)
        result = cursor.fetchone()
        
        if result:
            return {
                'constraint_name': result[0],
                'delete_action_code': result[1],
                'update_action_code': result[2],
                'delete_action': result[3],
                'column_name': result[4],
                'referenced_table': result[5],
                'referenced_column': result[6]
            }
        return None
    except Exception as e:
        print(f"{RED}[ERROR]{RESET} Failed to get FK constraint info: {e}")
        return None

def check_database_state(cursor):
    """
    Check current database state and detect if migration is needed
    Returns dict with state info and migration plan
    """
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}STEP 1: DATABASE STATE DETECTION{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    state = {
        'task_submissions_exists': False,
        'tugas_ai_exists': False,
        'fk_constraint_exists': False,
        'fk_constraint_details': None,
        'is_cascade': False,
        'migration_needed': False,
        'migration_steps': []
    }
    
    # Check if tables exist
    print(f"{CYAN}[CHECK]{RESET} Verifying table existence...")
    
    cursor.execute("""
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('task_submissions', 'tugas_ai')
    """)
    tables = [row[0] for row in cursor.fetchall()]
    
    state['task_submissions_exists'] = 'task_submissions' in tables
    state['tugas_ai_exists'] = 'tugas_ai' in tables
    
    print(f"  -> task_submissions table: {GREEN if state['task_submissions_exists'] else RED}{'EXISTS' if state['task_submissions_exists'] else 'NOT FOUND'}{RESET}")
    print(f"  -> tugas_ai table: {GREEN if state['tugas_ai_exists'] else RED}{'EXISTS' if state['tugas_ai_exists'] else 'NOT FOUND'}{RESET}")
    
    if not state['task_submissions_exists'] or not state['tugas_ai_exists']:
        print(f"\n{RED}[ERROR]{RESET} Required tables not found!")
        return state
    
    # Check FK constraint
    print(f"\n{CYAN}[CHECK]{RESET} Checking foreign key constraint...")
    
    fk_info = get_current_fk_constraint(cursor)
    
    if fk_info:
        state['fk_constraint_exists'] = True
        state['fk_constraint_details'] = fk_info
        state['is_cascade'] = fk_info['delete_action'] == 'CASCADE'
        
        print(f"  -> Constraint name: {YELLOW}{fk_info['constraint_name']}{RESET}")
        print(f"  -> Column: {fk_info['column_name']} -> {fk_info['referenced_table']}.{fk_info['referenced_column']}")
        print(f"  -> Delete action: {GREEN if state['is_cascade'] else YELLOW}{fk_info['delete_action']}{RESET}")
        
        if state['is_cascade']:
            print(f"\n{GREEN}[SUCCESS]{RESET} Foreign key already has CASCADE delete!")
            print(f"{GREEN}[INFO]{RESET} No migration needed - database is already in desired state")
            state['migration_needed'] = False
        else:
            print(f"\n{YELLOW}[INFO]{RESET} Foreign key needs migration to CASCADE delete")
            state['migration_needed'] = True
            state['migration_steps'] = [
                f"Drop existing constraint: {fk_info['constraint_name']}",
                "Create new constraint with ON DELETE CASCADE"
            ]
    else:
        print(f"  -> {RED}No foreign key constraint found!{RESET}")
        print(f"\n{YELLOW}[WARNING]{RESET} Foreign key constraint is missing")
        state['migration_needed'] = True
        state['migration_steps'] = [
            "Create new FK constraint with ON DELETE CASCADE"
        ]
    
    # Count existing records
    print(f"\n{CYAN}[CHECK]{RESET} Counting existing records...")
    
    cursor.execute("SELECT COUNT(*) FROM task_submissions")
    submissions_count = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM tugas_ai")
    tasks_count = cursor.fetchone()[0]
    
    print(f"  -> task_submissions: {YELLOW}{submissions_count}{RESET} records")
    print(f"  -> tugas_ai: {YELLOW}{tasks_count}{RESET} records")
    
    state['submissions_count'] = submissions_count
    state['tasks_count'] = tasks_count
    
    return state

def perform_migration(conn, cursor, state):
    """
    Perform the actual migration with rollback on error
    """
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}STEP 2: MIGRATION EXECUTION{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    if not state['migration_needed']:
        print(f"{GREEN}[SKIP]{RESET} Migration not needed")
        return True
    
    print(f"{YELLOW}[INFO]{RESET} Migration plan:")
    for i, step in enumerate(state['migration_steps'], 1):
        print(f"  {i}. {step}")
    
    print(f"\n{MAGENTA}[ACTION]{RESET} Starting migration...")
    
    try:
        # Start transaction
        print(f"{CYAN}[TX]{RESET} Starting transaction...")
        
        # Drop existing constraint if it exists
        if state['fk_constraint_exists']:
            constraint_name = state['fk_constraint_details']['constraint_name']
            print(f"{CYAN}[EXECUTE]{RESET} Dropping constraint: {constraint_name}")
            
            drop_query = sql.SQL("ALTER TABLE task_submissions DROP CONSTRAINT IF EXISTS {}").format(
                sql.Identifier(constraint_name)
            )
            cursor.execute(drop_query)
            print(f"{GREEN}[SUCCESS]{RESET} Constraint dropped")
        
        # Create new constraint with CASCADE
        print(f"{CYAN}[EXECUTE]{RESET} Creating new constraint with CASCADE delete...")
        
        create_query = """
        ALTER TABLE task_submissions 
        ADD CONSTRAINT task_submissions_id_task_fkey 
        FOREIGN KEY (id_task) 
        REFERENCES tugas_ai(id) 
        ON DELETE CASCADE
        """
        cursor.execute(create_query)
        print(f"{GREEN}[SUCCESS]{RESET} New constraint created")
        
        # Commit transaction
        print(f"{CYAN}[TX]{RESET} Committing transaction...")
        conn.commit()
        print(f"{GREEN}[SUCCESS]{RESET} Transaction committed")
        
        return True
        
    except Exception as e:
        print(f"\n{RED}[ERROR]{RESET} Migration failed: {e}")
        print(f"{YELLOW}[ROLLBACK]{RESET} Rolling back transaction...")
        
        try:
            conn.rollback()
            print(f"{GREEN}[SUCCESS]{RESET} Transaction rolled back")
        except Exception as rollback_error:
            print(f"{RED}[ERROR]{RESET} Rollback failed: {rollback_error}")
        
        return False

def verify_migration(cursor, state):
    """
    Verify that migration was successful
    """
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}STEP 3: VERIFICATION{RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    print(f"{CYAN}[VERIFY]{RESET} Checking new constraint...")
    
    new_fk_info = get_current_fk_constraint(cursor)
    
    if not new_fk_info:
        print(f"{RED}[FAIL]{RESET} No foreign key constraint found!")
        return False
    
    print(f"  -> Constraint name: {YELLOW}{new_fk_info['constraint_name']}{RESET}")
    print(f"  -> Delete action: {GREEN if new_fk_info['delete_action'] == 'CASCADE' else RED}{new_fk_info['delete_action']}{RESET}")
    
    if new_fk_info['delete_action'] == 'CASCADE':
        print(f"\n{GREEN}[SUCCESS]{RESET} Migration verified! CASCADE delete is active")
        return True
    else:
        print(f"\n{RED}[FAIL]{RESET} Migration verification failed! Delete action is not CASCADE")
        return False

def generate_migration_log(state, success):
    """
    Generate migration log file
    """
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"migration_cascade_delete_{timestamp}.log"
    
    log_data = {
        'timestamp': datetime.now().isoformat(),
        'migration_type': 'cascade_delete_task_submissions',
        'success': success,
        'initial_state': {
            'fk_exists': state['fk_constraint_exists'],
            'is_cascade': state['is_cascade'],
            'constraint_details': state['fk_constraint_details'],
            'submissions_count': state.get('submissions_count', 0),
            'tasks_count': state.get('tasks_count', 0)
        },
        'migration_needed': state['migration_needed'],
        'migration_steps': state['migration_steps']
    }
    
    try:
        with open(log_file, 'w') as f:
            json.dump(log_data, f, indent=2, default=str)
        print(f"\n{CYAN}[LOG]{RESET} Migration log saved: {log_file}")
    except Exception as e:
        print(f"\n{YELLOW}[WARNING]{RESET} Failed to save log file: {e}")

def update_prisma_schema():
    """
    Provide instructions to update Prisma schema
    """
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}STEP 4: PRISMA SCHEMA UPDATE (MANUAL){RESET}")
    print(f"{BLUE}{'='*60}{RESET}\n")
    
    print(f"{YELLOW}[TODO]{RESET} Update your Prisma schema file:\n")
    
    print(f"{CYAN}File:{RESET} prisma/schema.prisma\n")
    
    print(f"{CYAN}Find:{RESET}")
    print(f"  model task_submissions {{")
    print(f"    ...")
    print(f"    tugas_ai_relation tugas_ai @relation(..., {RED}onDelete: NoAction{RESET}, ...)")
    print(f"    ...")
    print(f"  }}\n")
    
    print(f"{CYAN}Replace with:{RESET}")
    print(f"  model task_submissions {{")
    print(f"    ...")
    print(f"    tugas_ai_relation tugas_ai @relation(..., {GREEN}onDelete: Cascade{RESET}, ...)")
    print(f"    ...")
    print(f"  }}\n")
    
    print(f"{CYAN}Then run:{RESET}")
    print(f"  npx prisma generate\n")

def main():
    """Main migration flow"""
    print(f"\n{MAGENTA}{'='*60}{RESET}")
    print(f"{MAGENTA}SAFE DATABASE MIGRATION: CASCADE DELETE{RESET}")
    print(f"{MAGENTA}{'='*60}{RESET}\n")
    
    print(f"{CYAN}[INFO]{RESET} This script will safely migrate the foreign key constraint")
    print(f"{CYAN}[INFO]{RESET} from 'ON DELETE NO ACTION' to 'ON DELETE CASCADE'\n")
    
    conn = None
    success = False
    
    try:
        # Connect to database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Step 1: Check current state
        state = check_database_state(cursor)
        
        # Step 2: Perform migration if needed
        if state['migration_needed']:
            print(f"\n{YELLOW}[CONFIRM]{RESET} Do you want to proceed with the migration? (yes/no): ", end='')
            confirmation = input().strip().lower()
            
            if confirmation == 'yes':
                success = perform_migration(conn, cursor, state)
                
                # Step 3: Verify migration
                if success:
                    success = verify_migration(cursor, state)
            else:
                print(f"{YELLOW}[CANCELLED]{RESET} Migration cancelled by user")
                success = False
        else:
            success = True
        
        # Generate log
        generate_migration_log(state, success)
        
        # Step 4: Prisma schema update instructions
        if success and state['migration_needed']:
            update_prisma_schema()
        
        # Final summary
        print(f"\n{BLUE}{'='*60}{RESET}")
        print(f"{BLUE}MIGRATION SUMMARY{RESET}")
        print(f"{BLUE}{'='*60}{RESET}\n")
        
        if success:
            if state['migration_needed']:
                print(f"{GREEN}[SUCCESS]{RESET} Migration completed successfully!")
                print(f"{GREEN}[SUCCESS]{RESET} CASCADE delete is now enabled")
                print(f"\n{YELLOW}[NEXT]{RESET} Don't forget to:")
                print(f"  1. Update prisma/schema.prisma (see instructions above)")
                print(f"  2. Run: npx prisma generate")
                print(f"  3. Test cascade delete functionality")
            else:
                print(f"{GREEN}[SUCCESS]{RESET} Database already in desired state")
                print(f"{GREEN}[INFO]{RESET} No action needed")
        else:
            print(f"{RED}[FAILED]{RESET} Migration failed!")
            print(f"{RED}[INFO]{RESET} Database was not modified (rolled back)")
        
    except KeyboardInterrupt:
        print(f"\n\n{YELLOW}[CANCELLED]{RESET} Migration interrupted by user")
        if conn:
            try:
                conn.rollback()
                print(f"{GREEN}[SUCCESS]{RESET} Changes rolled back")
            except:
                pass
    except Exception as e:
        print(f"\n{RED}[ERROR]{RESET} Unexpected error: {e}")
        if conn:
            try:
                conn.rollback()
            except:
                pass
    finally:
        if conn:
            conn.close()
            print(f"\n{CYAN}[INFO]{RESET} Database connection closed")
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
