/**
 * Test akses foto dengan konfigurasi MinIO yang baru
 */
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const useSSL = process.env.MINIO_USE_SSL === 'true';
const protocol = useSSL ? 'https' : 'http';

const s3Client = new S3Client({
  endpoint: `${protocol}://${process.env.MINIO_ENDPOINT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function testPhotoAccess() {
  console.log('\n🖼️  TESTING PHOTO ACCESS dengan Konfigurasi Baru');
  console.log('='.repeat(70));
  console.log(`MinIO Endpoint: ${protocol}://${process.env.MINIO_ENDPOINT}`);
  console.log(`Public URL: ${process.env.MINIO_PUBLIC_URL}`);
  console.log(`SSL: ${process.env.MINIO_USE_SSL}`);
  console.log('');
  
  try {
    // List profile pictures
    const command = new ListObjectsV2Command({
      Bucket: process.env.MINIO_BUCKET,
      Prefix: 'profile-pictures/',
      MaxKeys: 10,
    });
    
    const result = await s3Client.send(command);
    const photos = result.Contents || [];
    
    console.log(`✅ Koneksi berhasil!`);
    console.log(`📸 Ditemukan ${photos.length} foto (first 10)`);
    console.log('');
    
    if (photos.length > 0) {
      console.log('📋 Sample URLs yang seharusnya bisa diakses:');
      console.log('');
      
      photos.slice(0, 5).forEach((photo, i) => {
        const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${photo.Key}`;
        const sizeKB = (photo.Size / 1024).toFixed(1);
        console.log(`${i + 1}. ${photo.Key}`);
        console.log(`   Size: ${sizeKB} KB`);
        console.log(`   URL: ${publicUrl}`);
        console.log('');
      });
      
      console.log('💡 Cara test:');
      console.log('   1. Copy salah satu URL di atas');
      console.log('   2. Buka di browser');
      console.log('   3. Foto seharusnya tampil');
      console.log('');
      console.log('⚠️  NOTE: Jika ada CORS error, perlu update MinIO bucket policy');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testPhotoAccess();
