import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all reward categories
export async function GET(request) {
  try {
    const categories = await prisma.$queryRaw`
      SELECT id, name, description, icon, color, sort_order, is_active, created_at
      FROM reward_categories 
      WHERE is_active = true
      ORDER BY sort_order ASC, name ASC
    `;

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching reward categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new reward category (Admin only)
export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privilege
    const adminPrivilege = await prisma.$queryRaw`
      SELECT * FROM user_privileges 
      WHERE clerk_id = ${userId} 
      AND privilege = 'admin' 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (adminPrivilege.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { name, description, icon, color, sort_order } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      );
    }

    // Check if category name already exists
    const existingCategory = await prisma.$queryRaw`
      SELECT id FROM reward_categories WHERE name = ${name} AND is_active = true
    `;

    if (existingCategory.length > 0) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      );
    }

    // Create new category
    const newCategory = await prisma.$queryRaw`
      INSERT INTO reward_categories (name, description, icon, color, sort_order, is_active, created_at, updated_at)
      VALUES (${name}, ${description || null}, ${icon || null}, ${color || 'blue'}, ${sort_order || 0}, true, NOW(), NOW())
      RETURNING id, name, description, icon, color, sort_order, is_active, created_at
    `;

    return NextResponse.json({
      success: true,
      data: newCategory[0],
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('Error creating reward category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update reward category (Admin only)
export async function PUT(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privilege
    const adminPrivilege = await prisma.$queryRaw`
      SELECT * FROM user_privileges 
      WHERE clerk_id = ${userId} 
      AND privilege = 'admin' 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (adminPrivilege.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id, name, description, icon, color, sort_order, is_active } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Category ID and name are required' },
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await prisma.$queryRaw`
      SELECT id FROM reward_categories WHERE id = ${id}
    `;

    if (existingCategory.length === 0) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Update category
    const updatedCategory = await prisma.$queryRaw`
      UPDATE reward_categories 
      SET name = ${name}, 
          description = ${description || null}, 
          icon = ${icon || null}, 
          color = ${color || 'blue'}, 
          sort_order = ${sort_order || 0}, 
          is_active = ${is_active !== false}, 
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, description, icon, color, sort_order, is_active, created_at, updated_at
    `;

    return NextResponse.json({
      success: true,
      data: updatedCategory[0],
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Error updating reward category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update category' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete reward category (Admin only)
export async function DELETE(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privilege
    const adminPrivilege = await prisma.$queryRaw`
      SELECT * FROM user_privileges 
      WHERE clerk_id = ${userId} 
      AND privilege = 'admin' 
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    `;

    if (adminPrivilege.length === 0) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('id');

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Check if category has rewards
    const rewardsCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM rewards WHERE category_id = ${categoryId}
    `;

    if (Number(rewardsCount[0].count) > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category with associated rewards' },
        { status: 400 }
      );
    }

    // Soft delete category
    await prisma.$executeRawUnsafe(`
      UPDATE reward_categories 
      SET is_active = false, updated_at = NOW() 
      WHERE id = ${categoryId}
    `);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting reward category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete category' 
      },
      { status: 500 }
    );
  }
}