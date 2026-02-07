import { NextResponse } from 'next/server';
import prisma from '../../../../../../lib/prisma';
import { getCurrentUser } from '@/lib/ssoAuth';

// GET /api/drwcorp/employees/[id] - Get employee detail
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const employee = await prisma.drwcorp_employees.findUnique({
      where: { id: Number(id) },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true,
            loyalty_point: true,
            foto_profil_url: true,
            task_submissions: {
              where: {
                status_submission: 'selesai'
              },
              select: {
                id: true,
                tanggal_submission: true,
                tugas_ai: {
                  select: {
                    id: true,
                    keyword_tugas: true,
                    point_value: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee });

  } catch (error) {
    console.error('Error fetching employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/drwcorp/employees/[id] - Confirm member match
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { member_id } = body;

    // Get current user for audit trail
    const user = await getCurrentUser(request);
    const confirmedBy = user?.email || 'unknown';

    const employee = await prisma.drwcorp_employees.update({
      where: { id: Number(id) },
      data: {
        member_id: member_id ? Number(member_id) : null,
        matching_status: member_id ? 'matched' : 'unmatched',
        matching_confidence: member_id ? 1.0 : 0.0,
        confirmed_at: new Date(),
        confirmed_by: confirmedBy
      },
      include: {
        members: {
          select: {
            id: true,
            nama_lengkap: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ success: true, employee });

  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
