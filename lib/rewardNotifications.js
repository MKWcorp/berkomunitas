import prisma from '../src/utils/prisma';

/**
 * Create notification for reward redemption
 * @param {Object} options - Notification options
 * @param {number} options.memberId - Member ID to send notification to
 * @param {string} options.rewardName - Name of the reward
 * @param {boolean} options.isRead - Whether notification should be marked as read (default: false)
 */
export async function createRewardRedemptionNotification({ memberId, rewardName, isRead = false }) {
  try {
    await prisma.notifications.create({
      data: {
        id_member: memberId,
        message: `Penukaran Reward ${rewardName} berhasil, menunggu verifikasi admin`,
        link_url: `/rewards-app/status`,
        is_read: isRead
      }
    });
    
    console.log(`Reward redemption notification created for member ${memberId}: ${rewardName}`);
  } catch (error) {
    console.error('Error creating reward redemption notification:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Create notification for reward status update
 * @param {Object} options - Notification options
 * @param {number} options.memberId - Member ID to send notification to
 * @param {string} options.rewardName - Name of the reward
 * @param {string} options.status - New status of redemption
 * @param {number} options.coinRefund - Amount of coins refunded (for rejected redemptions)
 * @param {boolean} options.isRead - Whether notification should be marked as read (default: false)
 */
export async function createRewardStatusNotification({ 
  memberId, 
  rewardName, 
  status, 
  coinRefund = 0, 
  isRead = false 
}) {
  try {
    let message = '';
    
    switch (status) {
      case 'menunggu_verifikasi':
        message = `Penukaran Reward ${rewardName} berhasil, menunggu verifikasi admin`;
        break;
      case 'dikirim':
        message = `${rewardName} sedang dikirim`;
        break;
      case 'diterima':
        message = `${rewardName} sudah diterima`;
        break;
      case 'ditolak':
        message = `Penukaran ${rewardName} anda Ditolak, Coin anda Senilai ${coinRefund} Dikembalikan`;
        break;
      default:
        message = `Status penukaran ${rewardName} telah diperbarui`;
    }
    
    await prisma.notifications.create({
      data: {
        id_member: memberId,
        message,
        link_url: `/rewards-app/status`,
        is_read: isRead
      }
    });
    
    console.log(`Reward status notification created for member ${memberId}: ${message}`);
  } catch (error) {
    console.error('Error creating reward status notification:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Create notifications for multiple members for reward events
 * @param {Array} members - Array of member objects with id property
 * @param {string} message - Notification message
 */
export async function createBulkRewardNotifications(members, message) {
  try {
    const notifications = members.map(member => ({
      id_member: member.id,
      message,
      link_url: `/rewards-app/status`,
      is_read: false
    }));
    
    await prisma.notifications.createMany({
      data: notifications,
      skipDuplicates: true
    });
    
    console.log(`Bulk reward notifications created for ${members.length} members`);
  } catch (error) {
    console.error('Error creating bulk reward notifications:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Get status message in Indonesian based on status code
 * @param {string} status - Status code
 * @returns {string} - Localized status message
 */
export function getStatusMessage(status) {
  const statusMessages = {
    'menunggu_verifikasi': 'Menunggu Verifikasi',
    'dikirim': 'Dikirim',
    'diterima': 'Diterima',
    'ditolak': 'Ditolak'
  };
  
  return statusMessages[status] || status;
}