"""
Check for orphaned data from members deleted before CASCADE DELETE migration
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

def check_orphaned_data():
    url = os.getenv('DATABASE_URL')
    u = urlparse(url)

    conn = psycopg2.connect(
        host=u.hostname,
        port=u.port,
        user=u.username,
        password=u.password,
        database=u.path[1:]
    )
    cur = conn.cursor()

    print('🔍 Mencari data orphan (data tanpa member yang ada)...\n')

    # Check task_submissions
    cur.execute('''
        SELECT COUNT(*) FROM task_submissions ts
        LEFT JOIN members m ON ts.id_member = m.id
        WHERE m.id IS NULL
    ''')
    orphan_tasks = cur.fetchone()[0]
    print(f'task_submissions orphan: {orphan_tasks}')

    # Check reward_redemptions
    cur.execute('''
        SELECT COUNT(*) FROM reward_redemptions rr
        LEFT JOIN members m ON rr.id_member = m.id
        WHERE m.id IS NULL
    ''')
    orphan_rewards = cur.fetchone()[0]
    print(f'reward_redemptions orphan: {orphan_rewards}')

    # Check member_transactions
    cur.execute('''
        SELECT COUNT(*) FROM member_transactions mt
        LEFT JOIN members m ON mt.member_id = m.id
        WHERE m.id IS NULL
    ''')
    orphan_trans = cur.fetchone()[0]
    print(f'member_transactions orphan: {orphan_trans}')

    # Check profil_sosial_media
    cur.execute('''
        SELECT COUNT(*) FROM profil_sosial_media psm
        LEFT JOIN members m ON psm.id_member = m.id
        WHERE m.id IS NULL
    ''')
    orphan_social = cur.fetchone()[0]
    print(f'profil_sosial_media orphan: {orphan_social}')

    total = orphan_tasks + orphan_rewards + orphan_trans + orphan_social
    print(f'\n📊 Total data orphan: {total}')

    if total > 0:
        print(f'\n⚠️  Ada {total} data orphan dari member yang dihapus sebelum migrasi')
        print('💡 Perlu cleanup script untuk membersihkan data lama ini')
    else:
        print('\n✅ Tidak ada data orphan! Database sudah bersih')

    cur.close()
    conn.close()
    
    return total

if __name__ == '__main__':
    check_orphaned_data()
