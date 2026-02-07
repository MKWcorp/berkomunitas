import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';
import prisma from '@/lib/prisma';
import { uploadFile, getStorageConfig } from '@/lib/storage';

/**
 * Profile Picture Upload API
 * 
 * Handles profile picture uploads with automatic storage backend selection:
 * Priority: MinIO (self-hosted) > VPS > Cloudinary (legacy) > Local (dev only)
 * 
 * POST /api/profil/upload-foto
 * Body: FormData with 'file' or 'profilePicture' field
 * Returns: { success: true, foto_profil_url: string, upload_method: string }
 */

/**
 * Profile Picture Upload API
 * 
 * Handles profile picture uploads with automatic storage backend selection:
 * Priority: MinIO (self-hosted) > VPS > Cloudinary (legacy) > Local (dev only)
 * 
 * POST /api/profil/upload-foto
 * Body: FormData with 'file' or 'profilePicture' field
 * Returns: { success: true, foto_profil_url: string, upload_method: string }
 */

export async function POST(request) {
  try {
    // Authenticate user
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`📸 Upload request from user: ${user.email}`);

    // Extract file from form data
    const formData = await request.formData();
    const file = formData.get('file') || formData.get('profilePicture');

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }

    console.log(`📁 File received: ${file.name} (${(file.size / 1024).toFixed(2)} KB, ${file.type})`);

    // Upload file using smart upload with automatic fallback
    const uploadResult = await uploadFile(file, 'profile-pictures', 'profile');
    const foto_profil_url = uploadResult.url;
    const uploadMethod = uploadResult.method;

    console.log(`✅ Upload successful via ${uploadMethod}: ${foto_profil_url}`);

    // Update member profile in database
    const updatedMember = await prisma.members.updateMany({
      where: {
        OR: [
          { email: user.email },
          { google_id: user.id.toString() }
        ]
      },
      data: {
        foto_profil_url,
      },
    });

    if (updatedMember.count === 0) {
      console.error(`❌ Member not found for email: ${user.email}`);
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    console.log(`💾 Database updated: ${updatedMember.count} record(s)`);

    // Return success response
    return NextResponse.json({ 
      success: true, 
      foto_profil_url, 
      data: { foto_profil_url },
      upload_method: uploadMethod,
      message: `Profile picture uploaded successfully via ${uploadMethod}`,
      storage_info: getStorageConfig()
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image: ' + error.message,
      storage_info: getStorageConfig()
    }, { status: 500 });
  }
}

/**
 * GET endpoint to check storage configuration
 * Useful for debugging
 */
export async function GET() {
  const config = getStorageConfig();
  
  return NextResponse.json({
    message: 'Storage configuration',
    config,
    priority: ['MinIO', 'VPS', 'Cloudinary', 'Local (dev only)'],
    current_primary: config.minio.enabled ? 'MinIO' :
                     config.vps.enabled ? 'VPS' :
                     config.cloudinary.enabled ? 'Cloudinary' :
                     config.local.enabled ? 'Local' :
                     'None configured'
  });
}