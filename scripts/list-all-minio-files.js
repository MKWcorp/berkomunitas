/**
 * List semua file di MinIO port 9100
 */
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
require('dotenv').config();

const s3Client = new S3Client({
  endpoint: 'http://213.190.4.159:9100',
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

async function listAllFiles() {
  console.log('\n📊 LISTING ALL FILES IN MINIO (Port 9100)');
  console.log('='.repeat(70));
  
  try {
    let allObjects = [];
    let continuationToken = null;
    
    do {
      const command = new ListObjectsV2Command({
        Bucket: process.env.MINIO_BUCKET,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      });
      
      const result = await s3Client.send(command);
      
      if (result.Contents) {
        allObjects = allObjects.concat(result.Contents);
      }
      
      continuationToken = result.NextContinuationToken;
      
    } while (continuationToken);
    
    console.log(`✅ Total files: ${allObjects.length}`);
    console.log('');
    
    // Analisis
    const byFolder = {};
    allObjects.forEach(obj => {
      const folder = obj.Key.split('/')[0];
      if (!byFolder[folder]) {
        byFolder[folder] = { count: 0, size: 0 };
      }
      byFolder[folder].count++;
      byFolder[folder].size += obj.Size;
    });
    
    console.log('📁 Files by folder:');
    Object.entries(byFolder).forEach(([folder, stats]) => {
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      console.log(`   ${folder}/: ${stats.count} files (${sizeMB} MB)`);
    });
    
    console.log('\n📋 All files:');
    allObjects.forEach((obj, i) => {
      const sizeKB = (obj.Size / 1024).toFixed(1);
      const date = obj.LastModified.toISOString().split('T')[0];
      console.log(`   ${i + 1}. ${obj.Key} (${sizeKB} KB, ${date})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listAllFiles();
