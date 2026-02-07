/**
 * Migration Script: Cloudinary to MinIO (External Access)
 * 
 * This version uses external IP so it can run from local machine
 * Uses 213.190.4.159:9000 instead of drw-minio hostname
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

const isDryRun = process.argv.includes('--dry-run');

console.log('🚀 Starting Cloudinary to MinIO Migration (External Access)');
console.log(`Mode: ${isDryRun ? '🧪 DRY RUN (no changes)' : '✅ LIVE MODE'}`);
console.log('');

// Use external IP for access from local machine
const MINIO_EXTERNAL_IP = '213.190.4.159:9000';

// Configure S3 client for MinIO with external IP
const s3Client = new S3Client({
  endpoint: `http://${MINIO_EXTERNAL_IP}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

console.log(`📡 Using external MinIO endpoint: ${MINIO_EXTERNAL_IP}`);
console.log(`📦 Bucket: ${process.env.MINIO_BUCKET}`);
console.log(`🔗 Public URL: ${process.env.MINIO_PUBLIC_URL}`);
console.log('');

/**
 * Download image from URL
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
    }
    const buffer = await response.buffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    return { buffer, contentType };
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

/**
 * Upload image to MinIO
 */
async function uploadToMinIO(buffer, contentType, fileName) {
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${fileName}`;
    return publicUrl;
  } catch (error) {
    throw new Error(`Upload to MinIO failed: ${error.message}`);
  }
}

/**
 * Extract filename from URL and create unique MinIO path
 */
function generateMinIOFileName(cloudinaryUrl, memberId) {
  const timestamp = Date.now();
  const urlParts = cloudinaryUrl.split('/');
  const filename = urlParts[urlParts.length - 1];
  const extension = filename.split('.').pop() || 'jpg';
  return `profile-pictures/migrated_${memberId}_${timestamp}.${extension}`;
}

/**
 * Main migration function
 */
async function migrate() {
  try {
    console.log('🔍 Finding members with Cloudinary images...\n');

    const members = await prisma.members.findMany({
      where: {
        foto_profil_url: {
          contains: 'cloudinary.com'
        }
      },
      select: {
        id: true,
        nama_lengkap: true,
        foto_profil_url: true,
      }
    });

    console.log(`📊 Found ${members.length} members with Cloudinary images\n`);

    if (members.length === 0) {
      console.log('✅ No images to migrate!');
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      const progress = `[${i + 1}/${members.length}]`;

      console.log(`${progress} Processing: ${member.nama_lengkap || `Member #${member.id}`}`);
      console.log(`   Old URL: ${member.foto_profil_url}`);

      try {
        // Skip if not a valid Cloudinary URL
        if (!member.foto_profil_url || !member.foto_profil_url.includes('cloudinary.com')) {
          console.log(`   ⏭️  Skipped: Not a Cloudinary URL\n`);
          skippedCount++;
          continue;
        }

        if (isDryRun) {
          const fileName = generateMinIOFileName(member.foto_profil_url, member.id);
          const newUrl = `${process.env.MINIO_PUBLIC_URL}/${fileName}`;
          console.log(`   🧪 [DRY RUN] Would migrate to: ${newUrl}\n`);
          successCount++;
          continue;
        }

        // Step 1: Download from Cloudinary
        console.log(`   📥 Downloading from Cloudinary...`);
        const { buffer, contentType } = await downloadImage(member.foto_profil_url);
        console.log(`   ✅ Downloaded: ${buffer.length} bytes, type: ${contentType}`);

        // Step 2: Upload to MinIO
        console.log(`   📤 Uploading to MinIO...`);
        const fileName = generateMinIOFileName(member.foto_profil_url, member.id);
        const newUrl = await uploadToMinIO(buffer, contentType, fileName);
        console.log(`   ✅ Uploaded to: ${newUrl}`);

        // Step 3: Update database
        console.log(`   💾 Updating database...`);
        await prisma.members.update({
          where: { id: member.id },
          data: { foto_profil_url: newUrl }
        });
        console.log(`   ✅ Database updated!\n`);

        successCount++;

      } catch (error) {
        console.error(`   ❌ Error: ${error.message}\n`);
        errorCount++;
      }

      // Small delay to avoid overwhelming services
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log(`📊 Total: ${members.length}`);
    console.log('='.repeat(60));

    if (errorCount === 0 && successCount > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n💡 Next steps:');
      console.log('   1. Verify images are accessible at storage.berkomunitas.com');
      console.log('   2. Test upload new profile picture from app');
    } else if (errorCount > 0) {
      console.log('\n⚠️  Migration completed with errors.');
      console.log('   Check the error messages above for details.');
    }

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrate().catch(console.error);
