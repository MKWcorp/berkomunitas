"""
Check CASCADE DELETE status on current database
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

url = os.getenv('DATABASE_URL')
u = urlparse(url)

conn = psycopg2.connect(
    host=u.hostname,
    port=u.port,
    user=u.username,
    password=u.password,
    database=u.path[1:]
)
conn.autocommit = True
cur = conn.cursor()

print('='*60)
print(f'📊 Database: {u.path[1:]}')
print('='*60)

# Check FK constraint status
cur.execute("""
    SELECT 
        con.conname AS constraint_name,
        CASE con.confdeltype
            WHEN 'a' THEN 'NO ACTION'
            WHEN 'r' THEN 'RESTRICT'
            WHEN 'c' THEN 'CASCADE'
            WHEN 'n' THEN 'SET NULL'
            WHEN 'd' THEN 'SET DEFAULT'
        END AS delete_action,
        pg_get_constraintdef(con.oid) AS definition
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'task_submissions'
    AND con.contype = 'f'
    AND conkey @> ARRAY[(
        SELECT attnum FROM pg_attribute 
        WHERE attrelid = rel.oid AND attname = 'id_task'
    )]
""")

result = cur.fetchone()

if result:
    constraint_name, delete_action, definition = result
    print('\n🔍 Foreign Key Constraint Status:')
    print(f'   Constraint: {constraint_name}')
    print(f'   Delete Action: {delete_action}')
    print(f'   Definition: {definition}')
    
    if delete_action == 'CASCADE':
        print('\n✅ CASCADE DELETE is ACTIVE')
        print('   → Deleting tugas_ai will automatically delete related task_submissions')
    else:
        print(f'\n⚠️  CASCADE DELETE is NOT active')
        print(f'   → Current action: {delete_action}')
        print('   → Migration needed!')
else:
    print('\n❌ No FK constraint found on task_submissions.id_task')

# Check record counts
cur.execute("SELECT count(*) FROM task_submissions")
submissions_count = cur.fetchone()[0]

cur.execute("SELECT count(*) FROM tugas_ai")
tasks_count = cur.fetchone()[0]

print(f'\n📊 Record Counts:')
print(f'   task_submissions: {submissions_count:,}')
print(f'   tugas_ai: {tasks_count:,}')

print('='*60)

cur.close()
conn.close()
