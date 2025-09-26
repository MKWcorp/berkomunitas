import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleNotifications() {
  try {
    // Get first user to create notifications for
    const firstUser = await prisma.members.findFirst({
      where: {
        clerk_id: { not: null }
      }
    });

    if (!firstUser) {
      console.log('No users found with clerk_id');
      return;
    }

    console.log(`Creating sample notifications for user: ${firstUser.nama_lengkap} (ID: ${firstUser.id})`);    // Sample notifications data
    const notifications = [
      {
        id_member: firstUser.id,
        message: "Selamat! Anda telah mendapatkan lencana 'Penulis Aktif' karena telah menulis 5 komentar!",
        link_url: "/profil",
        is_read: false
      },      {
        id_member: firstUser.id,
        message: "Tugas baru tersedia: 'Komentar di Instagram Post XYZ'. Dapatkan 10 poin!",
        link_url: "/tugas/1",
        is_read: false
      },
      {
        id_member: firstUser.id,
        message: "John Doe menulis di wall profil Anda: \"Halo! Semangat terus ya untuk tugas-tugasnya!\"",
        link_url: `/profil/${firstUser.id}`,
        is_read: true
      },
      {
        id_member: firstUser.id,
        message: "Anda telah mendapatkan 15 poin dari menyelesaikan tugas 'Komentar di Facebook Post ABC'",
        link_url: "/loyalty",
        is_read: false
      },
      {
        id_member: firstUser.id,
        message: "Anda naik ke Level 2! Total poin Anda sekarang 150 poin.",
        link_url: "/leaderboard",
        is_read: true
      },
      {
        id_member: firstUser.id,
        message: "Sistem akan maintenance pada tanggal 15 Agustus 2025 pukul 02:00-04:00 WIB",
        link_url: null,
        is_read: false
      },
      {
        id_member: firstUser.id,
        message: "Reward baru telah tersedia di toko poin! Cek sekarang untuk penawaran terbatas.",
        link_url: "/tukar-poin",
        is_read: true
      },      {
        id_member: firstUser.id,
        message: "Tugas 'Komentar di TikTok Video DEF' akan berakhir dalam 2 hari. Segera selesaikan!",
        link_url: "/tugas/2",
        is_read: false
      },
      {
        id_member: firstUser.id,
        message: "Jane Smith menulis di wall profil Anda: \"Terima kasih sudah membantu saya kemarin!\"",
        link_url: `/profil/${firstUser.id}`,
        is_read: false
      },
      {
        id_member: firstUser.id,
        message: "Selamat! Anda telah mencapai target 100 komentar bulan ini dan mendapat bonus 50 poin!",
        link_url: "/leaderboard",
        is_read: true
      }
    ];

    // Create notifications with different timestamps
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      const createdAt = new Date();
      // Space out notifications over the last few days
      createdAt.setHours(createdAt.getHours() - (i * 6));

      await prisma.notifications.create({
        data: {
          ...notification,
          created_at: createdAt
        }
      });
    }    console.log(`✓ Successfully created ${notifications.length} sample notifications`);

    // Show summary
    const totalNotifications = await prisma.notifications.count({
      where: { id_member: firstUser.id }
    });

    const unreadCount = await prisma.notifications.count({
      where: { 
        id_member: firstUser.id,
        is_read: false 
      }
    });

    console.log(`📊 Total notifications for user: ${totalNotifications}`);
    console.log(`📬 Unread notifications: ${unreadCount}`);

  } catch (error) {
    console.error('Error creating sample notifications:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleNotifications();
