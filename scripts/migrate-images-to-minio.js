/**
 * Migration Script: Cloudinary to MinIO
 * 
 * This script migrates all profile images from Cloudinary to MinIO:
 * 1. Fetches all members with Cloudinary URLs
 * 2. Downloads images from Cloudinary
 * 3. Uploads to MinIO
 * 4. Updates database with new MinIO URLs
 * 
 * Usage: node scripts/migrate-images-to-minio.js [--dry-run]
 */

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

// Check if dry run
const isDryRun = process.argv.includes('--dry-run');

console.log('🚀 Starting Cloudinary to MinIO Migration');
console.log(`Mode: ${isDryRun ? '🧪 DRY RUN (no changes)' : '✅ LIVE MODE'}`);
console.log('');

// Configure S3 client for MinIO
const s3Client = new S3Client({
  endpoint: `http://${process.env.MINIO_ENDPOINT}`,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

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
      // MinIO S3-compatible doesn't support ACL parameter - removed
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
async function migrateImages() {
  try {
    // Fetch all members with Cloudinary URLs
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
          // Dry run: just log what would happen
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

    if (isDryRun) {
      console.log('\n💡 This was a DRY RUN. Run without --dry-run to apply changes.');
    } else {
      console.log('\n✅ Migration completed!');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateImages();
