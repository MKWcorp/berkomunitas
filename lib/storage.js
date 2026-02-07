/**
 * Storage Management Library
 * 
 * Provides unified interface for file uploads to multiple storage backends:
 * - MinIO (S3-compatible) - Primary storage
 * - Cloudinary - Legacy fallback
 * - VPS - Manual VPS upload endpoint
 * - Local - Development only
 * 
 * Priority: MinIO > VPS > Cloudinary > Local (dev only)
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// ============================================
// MinIO Storage (Primary)
// ============================================

/**
 * Initialize MinIO S3 Client
 * @returns {S3Client} Configured S3 client for MinIO
 */
export function createMinIOClient() {
  if (!process.env.MINIO_ENDPOINT) {
    throw new Error('MINIO_ENDPOINT not configured');
  }

  return new S3Client({
    endpoint: `http://${process.env.MINIO_ENDPOINT}`,
    region: process.env.MINIO_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.MINIO_ACCESS_KEY,
      secretAccessKey: process.env.MINIO_SECRET_KEY,
    },
    forcePathStyle: true, // Required for MinIO S3-compatible API
  });
}

/**
 * Upload file to MinIO storage
 * @param {File} file - File object to upload
 * @param {string} folder - Folder path (default: 'profile-pictures')
 * @param {string} prefix - Filename prefix (default: 'upload')
 * @returns {Promise<string>} Public URL of uploaded file
 */
export async function uploadToMinIO(file, folder = 'profile-pictures', prefix = 'upload') {
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  try {
    const s3Client = createMinIOClient();

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const fileName = `${folder}/${prefix}_${timestamp}.${fileExtension}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to MinIO
    const command = new PutObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      // Note: MinIO S3-compatible API doesn't support ACL parameter
      // Public access is controlled via bucket policy
    });

    await s3Client.send(command);

    // Return public URL
    const publicUrl = `${process.env.MINIO_PUBLIC_URL}/${fileName}`;
    
    console.log(`✅ MinIO upload successful: ${fileName}`);
    return publicUrl;

  } catch (error) {
    console.error('❌ MinIO upload error:', error);
    throw new Error('Failed to upload to MinIO: ' + error.message);
  }
}

/**
 * Delete file from MinIO storage
 * @param {string} fileKey - File key/path in MinIO bucket
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFromMinIO(fileKey) {
  try {
    const s3Client = createMinIOClient();

    const command = new DeleteObjectCommand({
      Bucket: process.env.MINIO_BUCKET,
      Key: fileKey,
    });

    await s3Client.send(command);
    
    console.log(`✅ MinIO delete successful: ${fileKey}`);
    return true;

  } catch (error) {
    console.error('❌ MinIO delete error:', error);
    throw new Error('Failed to delete from MinIO: ' + error.message);
  }
}

// ============================================
// VPS Storage (Fallback #1)
// ============================================

/**
 * Upload file to VPS endpoint
 * @param {File} file - File object to upload
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadToVPS(file) {
  if (!process.env.VPS_UPLOAD_URL) {
    throw new Error('VPS_UPLOAD_URL not configured');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(process.env.VPS_UPLOAD_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.VPS_UPLOAD_TOKEN || 'default-token'}`
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`VPS upload failed: ${response.status} ${errorText}`);
  }

  const result = await response.json();
  console.log(`✅ VPS upload successful: ${result.url}`);
  return result.url;
}

// ============================================
// Cloudinary Storage (Legacy Fallback #2)
// ============================================

/**
 * Upload file to Cloudinary
 * @param {File} file - File object to upload
 * @returns {Promise<string>} Public URL of uploaded file
 */
async function uploadToCloudinary(file) {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME not configured');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  try {
    // Try signed upload with API credentials (more reliable)
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      return await uploadToCloudinaryWithCredentials(file);
    }
    
    // Fallback to unsigned upload with preset
    return await uploadToCloudinaryUnsigned(file);
    
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error('Failed to upload to Cloudinary: ' + error.message);
  }
}

/**
 * Signed Cloudinary upload with API credentials
 * @private
 */
async function uploadToCloudinaryWithCredentials(file) {
  const crypto = require('crypto');
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64String = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64String}`;

  const timestamp = Math.round(Date.now() / 1000);
  
  const uploadParams = {
    timestamp: timestamp,
    folder: 'profile-pictures',
    transformation: 'w_400,h_400,c_fill,g_face,q_auto,f_auto'
  };
  
  const sortedParams = Object.keys(uploadParams)
    .sort()
    .map(key => `${key}=${uploadParams[key]}`)
    .join('&');
    
  const stringToSign = sortedParams + process.env.CLOUDINARY_API_SECRET;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  const formData = new FormData();
  formData.append('file', dataUri);
  formData.append('timestamp', timestamp.toString());
  formData.append('folder', 'profile-pictures');
  formData.append('transformation', 'w_400,h_400,c_fill,g_face,q_auto,f_auto');
  formData.append('api_key', process.env.CLOUDINARY_API_KEY);
  formData.append('signature', signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary signed upload failed: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  console.log(`✅ Cloudinary upload successful: ${result.secure_url}`);
  return result.secure_url;
}

/**
 * Unsigned Cloudinary upload with preset
 * @private
 */
async function uploadToCloudinaryUnsigned(file) {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64String = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64String}`;

  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: dataUri,
        upload_preset: uploadPreset,
        folder: 'profile-pictures'
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Cloudinary unsigned upload failed: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  console.log(`✅ Cloudinary upload successful: ${result.secure_url}`);
  return result.secure_url;
}

// ============================================
// Local Storage (Development Only)
// ============================================

/**
 * Upload file to local filesystem
 * @param {File} file - File object to upload
 * @returns {Promise<string>} Local URL path
 */
async function uploadToLocalStorage(file) {
  const { writeFile, mkdir } = await import('fs/promises');
  const { join } = await import('path');
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const fileName = `profile_${timestamp}.${fileExtension}`;
  
  try {
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure uploads directory exists
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (err) {
      // Directory already exists, ignore
    }
    
    const filePath = join(uploadsDir, fileName);
    await writeFile(filePath, buffer);
    
    const localUrl = `/uploads/${fileName}`;
    console.log(`✅ Local storage upload successful: ${localUrl}`);
    return localUrl;
    
  } catch (error) {
    throw new Error('Local storage not available (production requires cloud storage): ' + error.message);
  }
}

// ============================================
// Smart Upload Function (Main Export)
// ============================================

/**
 * Smart upload function with automatic fallback
 * Priority: MinIO > VPS > Cloudinary > Local (dev only)
 * 
 * @param {File} file - File object to upload
 * @param {string} folder - Target folder (default: 'profile-pictures')
 * @param {string} prefix - Filename prefix (default: 'upload')
 * @returns {Promise<{url: string, method: string}>} Upload result with URL and method used
 */
export async function uploadFile(file, folder = 'profile-pictures', prefix = 'upload') {
  console.log(`📤 Starting upload for file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

  // Priority 1: MinIO (Self-hosted S3-compatible)
  if (process.env.MINIO_ENDPOINT) {
    try {
      console.log('🎯 Attempting MinIO upload...');
      const url = await uploadToMinIO(file, folder, prefix);
      return { url, method: 'MinIO' };
    } catch (minioError) {
      console.warn('⚠️ MinIO upload failed, trying alternatives...', minioError.message);
    }
  }

  // Priority 2: VPS Upload Endpoint
  if (process.env.VPS_UPLOAD_URL) {
    try {
      console.log('🎯 Attempting VPS upload...');
      const url = await uploadToVPS(file);
      return { url, method: 'VPS' };
    } catch (vpsError) {
      console.warn('⚠️ VPS upload failed, trying alternatives...', vpsError.message);
    }
  }

  // Priority 3: Cloudinary (Legacy cloud storage)
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      console.log('🎯 Attempting Cloudinary upload...');
      const url = await uploadToCloudinary(file);
      return { url, method: 'Cloudinary' };
    } catch (cloudinaryError) {
      console.warn('⚠️ Cloudinary upload failed...', cloudinaryError.message);
      if (process.env.NODE_ENV === 'production') {
        throw cloudinaryError; // In production, don't try local storage
      }
    }
  }

  // Priority 4: Local storage (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      console.log('🎯 Attempting local storage upload...');
      const url = await uploadToLocalStorage(file);
      return { url, method: 'Local' };
    } catch (localError) {
      throw new Error('All upload methods failed. Local: ' + localError.message);
    }
  }

  // No upload method available
  throw new Error('No upload service configured. Please set MINIO_ENDPOINT, VPS_UPLOAD_URL or CLOUDINARY_CLOUD_NAME');
}

/**
 * Get storage configuration info
 * @returns {Object} Configuration status
 */
export function getStorageConfig() {
  return {
    minio: {
      enabled: Boolean(process.env.MINIO_ENDPOINT),
      endpoint: process.env.MINIO_ENDPOINT || 'not configured',
      bucket: process.env.MINIO_BUCKET || 'not configured',
      publicUrl: process.env.MINIO_PUBLIC_URL || 'not configured',
    },
    vps: {
      enabled: Boolean(process.env.VPS_UPLOAD_URL),
      endpoint: process.env.VPS_UPLOAD_URL ? 'configured' : 'not configured',
    },
    cloudinary: {
      enabled: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || 'not configured',
    },
    local: {
      enabled: process.env.NODE_ENV === 'development',
    },
  };
}
