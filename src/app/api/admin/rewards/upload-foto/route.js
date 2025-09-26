import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { requireAdmin } from '../../../../../../lib/requireAdmin';

export async function POST(request) {
  try {
    // Check if user is admin
    const adminUser = await requireAdmin(request);
    if (!adminUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      return NextResponse.json({ error: 'File size too large (max 5MB)' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Only images allowed.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `reward_${timestamp}.${extension}`;
    
    // Save to public/uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const filepath = join(uploadDir, filename);
    
    // Ensure upload directory exists
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
    
    await writeFile(filepath, buffer);
    
    const foto_url = `/uploads/${filename}`;

    return NextResponse.json({
      success: true,
      foto_url: foto_url,
      message: 'Foto hadiah berhasil diupload'
    });

  } catch (error) {
    console.error('Error uploading reward image:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
