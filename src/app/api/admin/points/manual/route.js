import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/ssoAuth';

// POST - Tambah poin manual
export async function POST(request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin privilege
    const adminPrivilege = await prisma.user_privileges.findFirst({
      where: { member_id: user.id,
        privilege: 'admin',
        is_active: true
      }
    });

    if (!adminPrivilege) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { member_id, points, reason } = await request.json();

    // Validasi input
    if (!member_id || !points || !reason) {
      return NextResponse.json({ 
        error: 'member_id, points, dan reason harus diisi' 
      }, { status: 400 });
    }

    if (isNaN(points)) {
      return NextResponse.json({ 
        error: 'Poin harus berupa angka' 
      }, { status: 400 });
    }

    // Pastikan member ada dan cek balance
    const member = await prisma.members.findUnique({
      where: { id: parseInt(member_id) },
      select: { id: true, nama_lengkap: true, loyalty_point: true, coin: true }
    });

    if (!member) {
      return NextResponse.json({ 
        error: 'Member tidak ditemukan' 
      }, { status: 404 });
    }

    // Validasi untuk pengurangan poin
    const pointsToAdd = parseInt(points);
    if (pointsToAdd < 0 && member.loyalty_point < Math.abs(pointsToAdd)) {
      return NextResponse.json({ 
        error: `Tidak dapat mengurangi ${Math.abs(pointsToAdd)} poin. Member ${member.nama_lengkap} hanya memiliki ${member.loyalty_point} loyalty points.` 
      }, { status: 400 });
    }

    // Buat transaksi untuk menambah poin dan mencatat history
    const result = await prisma.$transaction(async (tx) => {
      // Get member current balances
      const memberBefore = await tx.members.findUnique({
        where: { id: parseInt(member_id) },
        select: { loyalty_point: true, coin: true }
      });

      // Get transaction type for admin_manual
      const transactionType = await tx.$queryRaw`
        SELECT id FROM transaction_types WHERE type_code = 'admin_manual' LIMIT 1
      `;
      
      const transactionTypeId = transactionType[0]?.id;
      if (!transactionTypeId) {
        throw new Error('Transaction type admin_manual not found');
      }

      // Tambah record ke loyalty_point_history (biarkan trigger DB yang update loyalty_point)
      const pointHistory = await tx.loyalty_point_history.create({
        data: {
          member_id: parseInt(member_id),
          event: `Admin Manual: ${reason}`,
          point: parseInt(points),
          event_type: 'admin_manual',
          created_at: new Date()
        }
      });

      // Check if reducing points and validate balance
      const pointsToAdd = parseInt(points);
      if (pointsToAdd < 0 && memberBefore.loyalty_point < Math.abs(pointsToAdd)) {
        throw new Error(`Insufficient loyalty points. Current: ${memberBefore.loyalty_point}, Requested reduction: ${Math.abs(pointsToAdd)}`);
      }

      // Update member loyalty points using raw SQL to avoid trigger conflicts
      await tx.$executeRaw`
        UPDATE members 
        SET loyalty_point = loyalty_point + ${pointsToAdd}
        WHERE id = ${parseInt(member_id)}
      `;

      // Get updated member data
      const updatedMember = await tx.members.findUnique({
        where: { id: parseInt(member_id) },
        select: { loyalty_point: true, coin: true }
      });

      // Create transaction log for loyalty points only
      await tx.$queryRaw`
        INSERT INTO member_transactions (
          member_id, transaction_type_id, loyalty_amount, coin_amount,
          description, reference_table, reference_id,
          loyalty_balance_before, loyalty_balance_after,
          coin_balance_before, coin_balance_after
        ) VALUES (
          ${parseInt(member_id)}, ${transactionTypeId}, ${pointsToAdd}, ${0},
          ${`Admin Manual: ${reason}`}, 'loyalty_point_history', ${pointHistory.id},
          ${memberBefore.loyalty_point}, ${updatedMember.loyalty_point},
          ${memberBefore.coin}, ${memberBefore.coin}
        )
      `;

      // Buat notifikasi untuk member
      const notification = await tx.notifications.create({
        data: {
          id_member: parseInt(member_id),
          message: `Admin telah ${points > 0 ? 'menambahkan' : 'mengurangi'} ${Math.abs(points)} poin ke akun Anda. Alasan: ${reason}`,
          is_read: false,
          created_at: new Date()
        }
      });

      return {
        member: updatedMember,
        pointHistory,
        notification
      };
    });

    return NextResponse.json({
      success: true,
      message: `Berhasil ${points > 0 ? 'menambahkan' : 'mengurangi'} ${Math.abs(points)} poin`,
      data: result
    });

  } catch (error) {
    console.error('Error adding manual points:', error);
    
    // Handle specific error messages
    if (error.message.includes('Insufficient loyalty points')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    if (error.message.includes('Coin balance cannot be negative')) {
      return NextResponse.json(
        { error: 'Tidak dapat mengurangi poin karena akan membuat balance menjadi negatif' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal memproses transaksi poin manual' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
