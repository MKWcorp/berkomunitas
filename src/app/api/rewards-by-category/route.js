import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch rewards filtered by category and privilege
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const userPrivileges = searchParams.get('privileges')?.split(',') || [];
    const includeExclusive = searchParams.get('includeExclusive') === 'true';

    let whereClause = 'r.is_active = true';
    const queryParams = [];

    // Filter by category if specified
    if (categoryId) {
      whereClause += ' AND r.category_id = $' + (queryParams.length + 1);
      queryParams.push(parseInt(categoryId));
    }

    // Filter by privilege access
    if (!includeExclusive) {
      // Only show rewards that user can access
      const privilegeConditions = [
        'r.required_privilege IS NULL', // Public rewards
      ];
      
      if (userPrivileges.length > 0) {
        userPrivileges.forEach(privilege => {
          queryParams.push(privilege);
          privilegeConditions.push(`r.required_privilege = $${queryParams.length}`);
        });
      }
      
      whereClause += ` AND (${privilegeConditions.join(' OR ')})`;
    }

    const query = `
      SELECT 
        r.id,
        r.reward_name,
        r.description,
        r.point_cost,
        r.stock,
        r.foto_url,
        r.is_active,
        r.required_privilege,
        r.privilege_description,
        r.is_exclusive,
        r.created_at,
        c.id as category_id,
        c.name as category_name,
        c.icon as category_icon,
        c.color as category_color
      FROM rewards r
      LEFT JOIN reward_categories c ON r.category_id = c.id
      WHERE ${whereClause}
      ORDER BY c.sort_order ASC, r.reward_name ASC
    `;

    const rewards = await prisma.$queryRawUnsafe(query, ...queryParams);

    // Group rewards by category
    const groupedRewards = rewards.reduce((acc, reward) => {
      const categoryName = reward.category_name || 'Uncategorized';
      if (!acc[categoryName]) {
        acc[categoryName] = {
          id: reward.category_id,
          name: categoryName,
          icon: reward.category_icon,
          color: reward.category_color,
          rewards: []
        };
      }
      acc[categoryName].rewards.push({
        id: reward.id,
        reward_name: reward.reward_name,
        description: reward.description,
        point_cost: reward.point_cost,
        stock: reward.stock,
        foto_url: reward.foto_url,
        required_privilege: reward.required_privilege,
        privilege_description: reward.privilege_description,
        is_exclusive: reward.is_exclusive,
        created_at: reward.created_at
      });
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        grouped: groupedRewards,
        flat: rewards
      }
    });

  } catch (error) {
    console.error('Error fetching rewards by category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch rewards' 
      },
      { status: 500 }
    );
  }
}