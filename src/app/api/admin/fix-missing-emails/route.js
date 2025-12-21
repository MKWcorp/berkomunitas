// DEPRECATED: This file is no longer used after SSO migration
// Clerk has been removed from the project
import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  return NextResponse.json({
    success: false,
    error: 'This endpoint is deprecated. Clerk has been removed from the project.'
  }, { status: 410 });
}
