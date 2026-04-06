#!/usr/bin/env python3
"""
Sync database structure from production to development
"""

import psycopg2
from psycopg2.extras import DictCursor
import sys

# Database connection parameters
DB_CONFIG = {
    'host': '213.190.4.159',
    'user': 'berkomunitas',
    'password': 'berkomunitas688',
    'port': '5432'
}

def get_table_definitions(db_name):
    """Get table definitions from a database"""
    conn = None
    try:
        conn = psycopg2.connect(database=db_name, **DB_CONFIG)
        cur = conn.cursor(cursor_factory=DictCursor)
        
        # Get all tables
        cur.execute("""
            SELECT tablename 
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        
        tables = [row['tablename'] for row in cur.fetchall()]
        table_defs = {}
        
        for table in tables:
            # Get CREATE TABLE statement
            cur.execute(f"""
                SELECT 
                    'CREATE TABLE ' || quote_ident(tablename) || ' (' ||
                    string_agg(
                        quote_ident(attname) || ' ' || 
                        format_type(atttypid, atttypmod) ||
                        CASE WHEN attnotnull THEN ' NOT NULL' ELSE '' END ||
                        CASE WHEN atthasdef THEN ' DEFAULT ' || pg_get_expr(adbin, adrelid) ELSE '' END,
                        ', '
                    ) || ');' as create_stmt
                FROM pg_attribute a
                LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid AND a.attnum = ad.adnum
                WHERE a.attrelid = quote_ident('{table}')::regclass
                AND a.attnum > 0
                AND NOT a.attisdropped
                GROUP BY tablename;
            """)
            
            result = cur.fetchone()
            if result:
                table_defs[table] = result['create_stmt']
        
        cur.close()
        conn.close()
        return tables, table_defs
        
    except Exception as e:
        print(f"Error connecting to {db_name}: {e}")
        if conn:
            conn.close()
        return [], {}

def main():
    print("=" * 80)
    print("SYNCING DATABASE STRUCTURE: production -> development")
    print("=" * 80)
    print()
    
    print("Step 1: Fetching table list from both databases...")
    prod_tables, prod_defs = get_table_definitions('berkomunitas_db')
    dev_tables, dev_defs = get_table_definitions('berkomunitas_dev')
    
    if not prod_tables:
        print("❌ Failed to retrieve production database information")
        sys.exit(1)
    
    if not dev_tables:
        print("❌ Failed to retrieve development database information")
        sys.exit(1)
    
    print(f"  Production: {len(prod_tables)} tables")
    print(f"  Development: {len(dev_tables)} tables")
    print()
    
    # Find tables only in production
    prod_only = set(prod_tables) - set(dev_tables)
    dev_only = set(dev_tables) - set(prod_tables)
    
    print("=" * 80)
    print("ANALYSIS")
    print("=" * 80)
    
    if prod_only:
        print(f"\n✓ Tables ONLY in PRODUCTION ({len(prod_only)}):")
        for table in sorted(prod_only):
            print(f"  - {table}")
    else:
        print("\n✓ No tables unique to production")
    
    if dev_only:
        print(f"\n⚠ Tables ONLY in DEVELOPMENT ({len(dev_only)}):")
        for table in sorted(dev_only):
            print(f"  - {table}")
    else:
        print("\n✓ No tables unique to development")
    
    print()
    
    if not prod_only:
        print("=" * 80)
        print("✅ Database structures are already in sync!")
        print("=" * 80)
        return
    
    # Generate SQL to add missing tables
    print("=" * 80)
    print("GENERATING SQL FOR MISSING TABLES")
    print("=" * 80)
    print()
    
    sql_statements = []
    
    for table in sorted(prod_only):
        print(f"Generating CREATE TABLE for: {table}")
        
        # Get full table definition
        conn = psycopg2.connect(database='berkomunitas_db', **DB_CONFIG)
        cur = conn.cursor()
        
        # Get columns
        cur.execute(f"""
            SELECT 
                column_name,
                data_type,
                character_maximum_length,
                column_default,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public' 
            AND table_name = '{table}'
            ORDER BY ordinal_position;
        """)
        
        columns = cur.fetchall()
        
        # Build CREATE TABLE statement
        col_defs = []
        for col in columns:
            col_name, data_type, max_len, default, nullable = col
            
            # Format data type
            if data_type == 'character varying' and max_len:
                dtype = f'VARCHAR({max_len})'
            elif data_type == 'integer':
                dtype = 'INTEGER'
            elif data_type == 'bigint':
                dtype = 'BIGINT'
            elif data_type == 'text':
                dtype = 'TEXT'
            elif data_type == 'timestamp without time zone':
                dtype = 'TIMESTAMP'
            elif data_type == 'jsonb':
                dtype = 'JSONB'
            elif data_type == 'boolean':
                dtype = 'BOOLEAN'
            else:
                dtype = data_type.upper()
            
            # Build column definition
            col_def = f'  "{col_name}" {dtype}'
            
            if nullable == 'NO':
                col_def += ' NOT NULL'
            
            if default:
                if 'nextval' in default:
                    # It's a serial column, convert to SERIAL
                    if 'integer' in data_type:
                        col_def = f'  "{col_name}" SERIAL'
                else:
                    col_def += f' DEFAULT {default}'
            
            col_defs.append(col_def)
        
        # Get primary key
        cur.execute(f"""
            SELECT a.attname
            FROM pg_index i
            JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
            WHERE i.indrelid = '{table}'::regclass AND i.indisprimary;
        """)
        
        pk_cols = [row[0] for row in cur.fetchall()]
        if pk_cols:
            col_defs.append(f'  PRIMARY KEY ("{pk_cols[0]}")')
        
        create_stmt = f'CREATE TABLE IF NOT EXISTS "{table}" (\n' + ',\n'.join(col_defs) + '\n);'
        sql_statements.append(create_stmt)
        
        cur.close()
        conn.close()
    
    # Write SQL file
    sql_file = 'scripts/sync-structure-to-dev.sql'
    with open(sql_file, 'w') as f:
        f.write("-- Sync database structure from production to development\n")
        f.write("-- Generated: " + str(sys.argv[0]) + "\n")
        f.write("-- Database: berkomunitas_dev\n\n")
        
        for stmt in sql_statements:
            f.write(stmt + "\n\n")
    
    print(f"\n✅ SQL file generated: {sql_file}")
    print()
    
    # Display SQL
    print("=" * 80)
    print("SQL TO EXECUTE:")
    print("=" * 80)
    for stmt in sql_statements:
        print(stmt)
        print()
    
    print("=" * 80)
    print("READY TO APPLY")
    print("=" * 80)
    print(f"Run: psql -h 213.190.4.159 -U berkomunitas -d berkomunitas_dev -f {sql_file}")
    print()

if __name__ == "__main__":
    main()
