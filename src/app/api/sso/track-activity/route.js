/**
 * SSO API: Track Activity
 * Track user activities for point system
 */
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET;

// Point values for different activities
const ACTIVITY_POINTS = {
  login: 1,
  purchase: 10,
  review: 5,
  referral: 20,
  post_comment: 3,
  share: 2,
  course_complete: 15,
  appointment_book: 5,
  task_complete: 10,
  daily_check_in: 2,
  profile_complete: 5,
};

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const { activityType, platform, metadata } = await request.json();

    if (!activityType) {
      return NextResponse.json(
        { error: 'Activity type is required' },
        { status: 400 }
      );
    }

    const pointsEarned = ACTIVITY_POINTS[activityType] || 0;

    // Track activity
    const activityId = `activity_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    await prisma.userActivity.create({
      data: {
        id: activityId,
        member_id: decoded.memberId,
        platform: platform || 'Berkomunitas',
        activity_type: activityType,
        points_earned: pointsEarned,
        metadata: metadata || {},
      },
    });    // Update member coins AND loyalty points
    if (pointsEarned > 0) {
      await prisma.members.update({
        where: { id: decoded.memberId },
        data: {
          coin: {
            increment: pointsEarned,
          },
          loyalty_point: {
            increment: pointsEarned, // Also increment loyalty point
          },
        },
      });

      // Add coin history
      await prisma.coin_history.create({
        data: {
          member_id: decoded.memberId,
          event: `${activityType} on ${platform || 'Berkomunitas'}`,
          coin: pointsEarned,
          event_type: activityType,
        },
      });

      // Add loyalty point history
      await prisma.loyalty_point_history.create({
        data: {
          member_id: decoded.memberId,
          event: `${activityType} on ${platform || 'Berkomunitas'}`,
          loyalty_point: pointsEarned,
        },
      });
    }

    return NextResponse.json({
      success: true,
      pointsEarned,
      activityType,
    });
  } catch (error) {
    console.error('Track Activity Error:', error);
    
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
