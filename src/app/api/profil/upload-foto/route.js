import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '../../../../../lib/prisma';

// Fallback local storage for development
async function uploadToLocalStorage(file) {
  const { writeFile } = await import('fs/promises');
  const { join } = await import('path');
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique filename
  const timestamp = Date.now();
  const fileExtension = file.name.split('.').pop();
  const fileName = `profile_${timestamp}.${fileExtension}`;
  
  try {
    // Save to public/uploads directory (only works in development)
    const uploadsDir = join(process.cwd(), 'public', 'uploads');
    const filePath = join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);
    return `/uploads/${fileName}`;
  } catch (error) {
    throw new Error('Local storage not available (production requires cloud storage): ' + error.message);
  }
}

// Cloud storage function using Cloudinary
async function uploadToCloudinary(file) {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  // Validate required environment variables
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    throw new Error('CLOUDINARY_CLOUD_NAME environment variable is required');
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new Error('File too large. Maximum size is 5MB.');
  }

  try {
    // Method 1: Try signed upload with API credentials (more reliable)
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      return await uploadToCloudinaryWithCredentials(file);
    }
    
    // Method 2: Try unsigned upload with preset (fallback)
    return await uploadToCloudinaryUnsigned(file);
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload to cloud storage: ' + error.message);
  }
}

// Signed upload with API credentials (more reliable)
async function uploadToCloudinaryWithCredentials(file) {
  const crypto = require('crypto');
  
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64String = buffer.toString('base64');
  const dataUri = `data:${file.type};base64,${base64String}`;

  // Generate timestamp
  const timestamp = Math.round(Date.now() / 1000);
  
  // Create parameters for signing
  const uploadParams = {
    timestamp: timestamp,
    folder: 'profile-pictures',
    transformation: 'w_400,h_400,c_fill,g_face,q_auto,f_auto'
  };
  
  // Create signature
  const sortedParams = Object.keys(uploadParams)
    .sort()
    .map(key => `${key}=${uploadParams[key]}`)
    .join('&');
    
  const stringToSign = sortedParams + process.env.CLOUDINARY_API_SECRET;
  const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');

  // Prepare form data
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
    console.error('Cloudinary signed upload error:', errorData);
    throw new Error(`Cloudinary signed upload failed: ${errorData.error?.message || response.statusText}`);
  }

  const result = await response.json();
  return result.secure_url;
}

// Unsigned upload with preset (fallback)
async function uploadToCloudinaryUnsigned(file) {
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64String}`;

    // Use preset or create basic upload
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'ml_default';

    const cloudinaryResponse = await fetch(
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

    if (!cloudinaryResponse.ok) {
      const errorData = await cloudinaryResponse.json();
      console.error('Cloudinary unsigned upload error:', errorData);
      throw new Error(`Cloudinary unsigned upload failed: ${errorData.error?.message || cloudinaryResponse.statusText}`);
    }

    const result = await cloudinaryResponse.json();
    return result.secure_url;
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload to cloud storage: ' + error.message);
  }
}

// Upload to VPS function
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
  return result.url;
}

// Smart upload function - priority: VPS > Cloudinary > Local (dev only)
async function uploadFile(file) {
  // Option 1: Upload to VPS (highest priority)
  if (process.env.VPS_UPLOAD_URL) {
    try {
      return await uploadToVPS(file);
    } catch (vpsError) {
      console.warn('VPS upload failed, trying alternatives...', vpsError.message);
    }
  }

  // Option 2: Upload to Cloudinary
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    try {
      return await uploadToCloudinary(file);
    } catch (cloudinaryError) {
      console.warn('Cloudinary upload failed...', cloudinaryError.message);
      if (process.env.NODE_ENV === 'production') {
        throw cloudinaryError; // In production, don't try local storage
      }
    }
  }

  // Option 3: Local storage (development only)
  if (process.env.NODE_ENV === 'development') {
    try {
      return await uploadToLocalStorage(file);
    } catch (localError) {
      throw new Error('All upload methods failed. Local: ' + localError.message);
    }
  }

  // No upload method available
  throw new Error('No upload service configured. Please set VPS_UPLOAD_URL or CLOUDINARY_CLOUD_NAME');
}

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    // Support both 'file' and legacy 'profilePicture' keys
    const file = formData.get('file') || formData.get('profilePicture');

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }    // Upload the file using smart upload function
    const uploadResult = await uploadFile(file);
    const foto_profil_url = typeof uploadResult === 'string' ? uploadResult : uploadResult.url;
    
    // Determine upload method used
    const uploadMethod = process.env.VPS_UPLOAD_URL ? 'VPS' : 
                        process.env.CLOUDINARY_CLOUD_NAME ? 'Cloudinary' : 
                        'Local';

    // Update the user's profile in the database
    const updatedMember = await prisma.members.updateMany({
      where: {
        clerk_id: userId,
      },
      data: {
        foto_profil_url,
      },
    });

    if (updatedMember.count === 0) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    // Include both flat and nested data for compatibility
    return NextResponse.json({ 
      success: true, 
      foto_profil_url, 
      data: { foto_profil_url },
      upload_method: uploadMethod,
      message: `Photo uploaded successfully via ${uploadMethod}`
    });

  } catch (error) {
    console.error('Error uploading profile picture:', error);
    return NextResponse.json({ 
      error: 'Failed to upload image: ' + error.message 
    }, { status: 500 });
  }
}
