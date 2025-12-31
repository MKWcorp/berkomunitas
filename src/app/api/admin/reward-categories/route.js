import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, color, sort_order } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
    }

    // Check if category name already exists
    const existingCategory = await prisma.reward_categories.findFirst({
      where: { name: name.trim() }
    });

    if (existingCategory) {
      return NextResponse.json({ error: 'Nama kategori sudah ada' }, { status: 400 });
    }

    const categoryData = {
      name: name.trim(),
      description: description?.trim() || null,
      icon: icon?.trim() || null,
      color: color || 'blue',
      sort_order: sort_order || 0,
      is_active: true
    };

    const newCategory = await prisma.reward_categories.create({
      data: categoryData
    });

    return NextResponse.json(newCategory);
  } catch (error) {
    console.error('Error creating reward category:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
  }
}