"""
Kill all orphaned PostgreSQL connections for berkomunitas database
Run this when getting "too many clients already" error
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

def kill_connections():
    url = os.getenv('DATABASE_URL')
    u = urlparse(url)
    db_name = u.path[1:]

    conn = psycopg2.connect(
        host=u.hostname,
        port=u.port,
        user=u.username,
        password=u.password,
        database=u.path[1:]
    )
    conn.autocommit = True
    cur = conn.cursor()

    # Check current connections
    cur.execute("""
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE datname = %s
    """, (db_name,))
    
    total = cur.fetchone()[0]
    print(f'📊 Total active connections to {db_name}: {total}')

    # Get connection details
    cur.execute("""
        SELECT pid, usename, application_name, client_addr, state, query_start
        FROM pg_stat_activity 
        WHERE datname = %s
        AND pid <> pg_backend_pid()
        ORDER BY query_start
    """, (db_name,))
    
    connections = cur.fetchall()
    print(f'\n📋 Connection details:')
    for pid, user, app, addr, state, started in connections:
        print(f'  PID {pid}: {user} | {app} | {addr} | {state} | Started: {started}')

    # Kill all connections except current one
    print(f'\n🔪 Killing {len(connections)} connection(s)...')
    
    killed = 0
    for pid, _, _, _, _, _ in connections:
        try:
            cur.execute("SELECT pg_terminate_backend(%s)", (pid,))
            result = cur.fetchone()[0]
            if result:
                killed += 1
                print(f'  ✅ Killed PID {pid}')
            else:
                print(f'  ⚠️  Could not kill PID {pid}')
        except Exception as e:
            print(f'  ❌ Error killing PID {pid}: {e}')

    # Check remaining connections
    cur.execute("""
        SELECT count(*) 
        FROM pg_stat_activity 
        WHERE datname = %s
    """, (db_name,))
    
    remaining = cur.fetchone()[0]
    
    print(f'\n' + '='*60)
    print('SUMMARY')
    print('='*60)
    print(f'✅ Killed: {killed}')
    print(f'📊 Remaining: {remaining} (this script\'s connection)')
    print('='*60)
    print('\n💡 Now restart your Next.js dev server!')

    cur.close()
    conn.close()

if __name__ == '__main__':
    kill_connections()
