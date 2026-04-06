#!/usr/bin/env python3
"""
Compare berkomunitas_db (production) and berkomunitas_dev (development) databases
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

def get_tables_info(db_name):
    """Get list of tables and their row counts from a database"""
    conn = None
    try:
        conn = psycopg2.connect(database=db_name, **DB_CONFIG)
        cur = conn.cursor(cursor_factory=DictCursor)
        
        # Get tables and row counts
        cur.execute("""
            SELECT 
                schemaname,
                tablename
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        """)
        
        tables = cur.fetchall()
        table_info = {}
        
        for table in tables:
            table_name = table['tablename']
            try:
                cur.execute(f'SELECT COUNT(*) FROM "{table_name}"')
                count = cur.fetchone()[0]
                table_info[table_name] = count
            except Exception as e:
                table_info[table_name] = f"Error: {str(e)}"
        
        # Get database size
        cur.execute(f"SELECT pg_size_pretty(pg_database_size('{db_name}'))")
        db_size = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return table_info, db_size
        
    except Exception as e:
        print(f"Error connecting to {db_name}: {e}")
        if conn:
            conn.close()
        return None, None

def main():
    print("=" * 80)
    print("COMPARING: berkomunitas_db (PRODUCTION) vs berkomunitas_dev (DEVELOPMENT)")
    print("=" * 80)
    print()
    
    # Get info from both databases
    print("Fetching data from berkomunitas_db (production)...")
    prod_tables, prod_size = get_tables_info('berkomunitas_db')
    
    print("Fetching data from berkomunitas_dev (development)...")
    dev_tables, dev_size = get_tables_info('berkomunitas_dev')
    
    if prod_tables is None or dev_tables is None:
        print("Failed to retrieve database information")
        sys.exit(1)
    
    # Get all table names from both databases
    all_tables = sorted(set(list(prod_tables.keys()) + list(dev_tables.keys())))
    
    print()
    print("=" * 80)
    print("TABLE COMPARISON")
    print("=" * 80)
    print(f"{'Table Name':<35} {'Production':<15} {'Development':<15} {'Difference'}")
    print("-" * 80)
    
    total_prod = 0
    total_dev = 0
    tables_only_in_prod = []
    tables_only_in_dev = []
    
    for table in all_tables:
        prod_count = prod_tables.get(table, "N/A")
        dev_count = dev_tables.get(table, "N/A")
        
        if prod_count != "N/A" and isinstance(prod_count, int):
            total_prod += prod_count
        if dev_count != "N/A" and isinstance(dev_count, int):
            total_dev += dev_count
        
        # Calculate difference
        if prod_count == "N/A":
            diff = "Only in DEV"
            tables_only_in_dev.append(table)
        elif dev_count == "N/A":
            diff = "Only in PROD"
            tables_only_in_prod.append(table)
        elif isinstance(prod_count, int) and isinstance(dev_count, int):
            difference = dev_count - prod_count
            if difference == 0:
                diff = "Same"
            else:
                sign = "+" if difference > 0 else ""
                diff = f"{sign}{difference:,}"
        else:
            diff = "Error"
        
        print(f"{table:<35} {str(prod_count):<15} {str(dev_count):<15} {diff}")
    
    print("-" * 80)
    print(f"{'TOTAL ROWS':<35} {total_prod:,} {total_dev:,}")
    print()
    
    print("=" * 80)
    print("DATABASE SIZE")
    print("=" * 80)
    print(f"Production (berkomunitas_db):  {prod_size}")
    print(f"Development (berkomunitas_dev): {dev_size}")
    print()
    
    if tables_only_in_prod:
        print("=" * 80)
        print("TABLES ONLY IN PRODUCTION:")
        print("=" * 80)
        for table in tables_only_in_prod:
            print(f"  - {table}")
        print()
    
    if tables_only_in_dev:
        print("=" * 80)
        print("TABLES ONLY IN DEVELOPMENT:")
        print("=" * 80)
        for table in tables_only_in_dev:
            print(f"  - {table}")
        print()
    
    print("=" * 80)
    print("COMPARISON COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    main()
