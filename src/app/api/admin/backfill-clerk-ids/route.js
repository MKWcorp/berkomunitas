// DEPRECATED: This file is no longer used after SSO migration
// Clerk has been removed from the project
// This endpoint was used for Clerk ID backfill during the Clerk era
import { NextResponse } from 'next/server';

export async function GET(request) {
  return NextResponse.json({ 
    success: false, 
    error: 'This endpoint is deprecated. Clerk has been removed from the project.' 
  }, { status: 410 });
}
