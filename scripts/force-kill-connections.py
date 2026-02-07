"""
Force kill connections by connecting to postgres database (not target database)
Use this when target database is completely full and won't accept new connections
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

def force_kill():
    url = os.getenv('DATABASE_URL')
    u = urlparse(url)
    target_db = u.path[1:]  # berkomunitas_db_dev

    # Connect to postgres database (not the target database)
    print(f'🔌 Connecting to postgres database to kill connections to {target_db}...')
    
    conn = psycopg2.connect(
        host=u.hostname,
        port=u.port,
        user=u.username,
        password=u.password,
        database='postgres'  # Connect to postgres, not target database
    )
    conn.autocommit = True
    cur = conn.cursor()

    # Check current connections to target database
    cur.execute("""
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE datname = %s
    """, (target_db,))
    
    total = cur.fetchone()[0]
    print(f'📊 Total active connections to {target_db}: {total}')

    # Get connection details
    cur.execute("""
        SELECT pid, usename, application_name, client_addr, state, 
               state_change, query_start
        FROM pg_stat_activity 
        WHERE datname = %s
        ORDER BY query_start
    """, (target_db,))
    
    connections = cur.fetchall()
    print(f'\n📋 Connection details:')
    for row in connections:
        pid, user, app, addr, state, state_change, started = row
        print(f'  PID {pid}: {user} | {app} | {addr} | {state} | {started}')

    # Kill ALL connections to target database
    print(f'\n🔪 Killing {len(connections)} connection(s) to {target_db}...')
    
    killed = 0
    errors = 0
    for row in connections:
        pid = row[0]
        try:
            cur.execute("SELECT pg_terminate_backend(%s)", (pid,))
            result = cur.fetchone()[0]
            if result:
                killed += 1
                print(f'  ✅ Killed PID {pid}')
            else:
                errors += 1
                print(f'  ⚠️  Could not kill PID {pid}')
        except Exception as e:
            errors += 1
            print(f'  ❌ Error killing PID {pid}: {e}')

    # Check remaining connections
    cur.execute("""
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE datname = %s
    """, (target_db,))
    
    remaining = cur.fetchone()[0]
    
    print(f'\n' + '='*60)
    print('SUMMARY')
    print('='*60)
    print(f'🎯 Target database: {target_db}')
    print(f'✅ Killed: {killed}')
    print(f'❌ Errors: {errors}')
    print(f'📊 Remaining: {remaining}')
    print('='*60)
    
    if remaining == 0:
        print('\n✅ SUCCESS! All connections killed.')
        print('💡 Now you can restart Next.js: npm run dev')
    else:
        print(f'\n⚠️  WARNING: {remaining} connection(s) still active')
        print('💡 They might be critical system connections')

    cur.close()
    conn.close()

if __name__ == '__main__':
    force_kill()
