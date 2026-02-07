"""
Rollback database URLs from MinIO back to Cloudinary
So we can re-run the migration properly
"""
import psycopg2
from urllib.parse import urlparse
import os
from dotenv import load_dotenv

load_dotenv()

# Cloudinary URLs saved from first migration
cloudinary_urls = {
    138: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756888464/profile-pictures/xf9lvwjqzqb0un7rndzn.jpg",
    222: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757667436/profile-pictures/biz1tq7ogh3kfkjijibk.jpg",
    183: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757866351/profile-pictures/ewqvjbujqzhhy60yptih.jpg",
    187: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756964379/profile-pictures/waf6pfjnkfvvprefhc9x.png",
    11: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756183735/profile-pictures/fp65pnrmdakrzpavz4me.png",
    46: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756257490/profile-pictures/fhmbastcuyn8ns6uenax.jpg",
    90: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757477199/profile-pictures/njhxy3q498lzu22jzzc5.jpg",
    247: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1760447704/profile-pictures/jcqc2aefh7ummvpig5gc.jpg",
    146: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756893893/profile-pictures/m7ilzyxprzp4zeyzyjne.jpg",
    93: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756811756/profile-pictures/atpysrk71g0aeswh2fox.jpg",
    63: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757399444/profile-pictures/bk4xctv2lhelbx7qhni4.jpg",
    99: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757312303/profile-pictures/inw51jq7kv3hng34hgyf.jpg",
    13: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756804123/profile-pictures/e9iw75tbx8fkfizvy872.jpg",
    59: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756275435/profile-pictures/t7jiikkd4esxqlmdoymj.jpg",
    9: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756957166/profile-pictures/hcpx4mardfsjeshbpdop.jpg",
    129: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756888050/profile-pictures/kzhsdhzz1oxs5imw3r8u.jpg",
    40: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1758456696/profile-pictures/yeaqao3f9zqyzpkaxj7b.png",
    186: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756962667/profile-pictures/fmiea4bijex9jaoxhvow.jpg",
    18: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756804036/profile-pictures/efendmylnrkwyhe4kvrg.jpg",
    131: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756956630/profile-pictures/iv5nmywzrmteehcnhpma.jpg",
    17: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756978754/profile-pictures/q3amepuqmg0hbkp7dg91.jpg",
    82: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1760356569/profile-pictures/aabdkbq9ukw9g3ltcmb8.jpg",
    177: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757659736/profile-pictures/egqx0awg5gnrghq5rkmg.jpg",
    61: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756262488/profile-pictures/mgqiwfhgz5qc3mw9sqcz.jpg",
    37: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1761082754/profile-pictures/xqcvtlgp8jwhf9dcytb6.jpg",
    42: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757153704/profile-pictures/sz2cjctely1vmqbxp85h.jpg",
    126: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757545932/profile-pictures/wtlcdzbdpzpl8vmv6g4l.jpg",
    97: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756821224/profile-pictures/kr3yo1zhjdmhrvlhmuet.jpg",
    95: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1757311991/profile-pictures/hitnvoeztkmx0c7a8jbf.jpg",
    15: "https://res.cloudinary.com/dmzx6aigr/image/upload/v1756886553/profile-pictures/z2aatjc7pbf6eabnjskp.png",
}

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

print('🔄 Rolling back MinIO URLs to Cloudinary URLs')
print('='*60)

updated = 0
errors = 0

for member_id, cloudinary_url in cloudinary_urls.items():
    try:
        cur.execute("""
            UPDATE members 
            SET foto_profil_url = %s
            WHERE id = %s
        """, (cloudinary_url, member_id))
        
        if cur.rowcount > 0:
            updated += 1
            print(f'✅ [{member_id}] Rolled back to Cloudinary')
        else:
            errors += 1
            print(f'⚠️  [{member_id}] Member not found')
    except Exception as e:
        errors += 1
        print(f'❌ [{member_id}] Error: {e}')

print('='*60)
print(f'✅ Updated: {updated}')
print(f'❌ Errors: {errors}')
print(f'📊 Total: {len(cloudinary_urls)}')
print('='*60)
print(f'\n💡 Now run: node scripts/migrate-images-to-minio.js')

cur.close()
conn.close()
