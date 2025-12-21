import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWallPostNotification() {
  try {
    // Get two different users
    const users = await prisma.members.findMany({
      where: { google_id: { not: null }
      },
      take: 2,
      include: {
        user_usernames: {
          select: {
            username: true
          }
        }
      }
    });

    if (users.length < 2) {
      console.log('Need at least 2 users to test wall post notifications');
      return;
    }

    const [user1, user2] = users;
    console.log(`Testing wall post from ${user1.nama_lengkap} to ${user2.nama_lengkap}`);

    // Create a wall post
    const wallPost = await prisma.profile_wall_posts.create({
      data: {
        profile_owner_id: user2.id,
        author_id: user1.id,
        message: 'Halo! Ini adalah test message untuk notifikasi wall post. Semoga sistem notifikasinya berfungsi dengan baik! 🎉'
      }
    });

    console.log(`✅ Wall post created with ID: ${wallPost.id}`);

    // Create notification for the profile owner
    const notification = await prisma.notifications.create({
      data: {
        id_member: user2.id,
        message: `${user1.nama_lengkap || 'Seseorang'} menulis di wall profil Anda: "${wallPost.message.length > 50 ? wallPost.message.substring(0, 50) + '...' : wallPost.message}"`,
        link_url: `/profil/${user2.user_usernames?.username || user2.id}`,
        is_read: false
      }
    });

    console.log(`✅ Notification created with ID: ${notification.id}`);

    // Show notification summary for user2
    const unreadCount = await prisma.notifications.count({
      where: {
        id_member: user2.id,
        is_read: false
      }
    });

    console.log(`📬 ${user2.nama_lengkap} now has ${unreadCount} unread notifications`);

    // Show latest notifications for user2
    const latestNotifications = await prisma.notifications.findMany({
      where: {
        id_member: user2.id
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 3
    });

    console.log('\n📋 Latest notifications for user2:');
    latestNotifications.forEach((notif, index) => {
      console.log(`${index + 1}. ${notif.is_read ? '✅' : '📬'} ${notif.message}`);
    });

  } catch (error) {
    console.error('Error testing wall post notification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testWallPostNotification();
