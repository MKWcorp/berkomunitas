import prisma from '@/utils/prisma';

/**
 * Create notification for task-related events
 * @param {Object} options - Notification options
 * @param {number} options.memberId - Member ID to send notification to
 * @param {string} options.message - Notification message
 * @param {number} options.taskId - Task ID for link generation
 * @param {boolean} options.isRead - Whether notification should be marked as read (default: false)
 */
export async function createTaskNotification({ memberId, message, taskId, isRead = false }) {
  try {
    await prisma.notifications.create({
      data: {
        id_member: memberId,
        message,
        link_url: `/tugas/${taskId}`,
        is_read: isRead
      }
    });
    
    console.log(`Task notification created for member ${memberId}: ${message}`);
  } catch (error) {
    console.error('Error creating task notification:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Create notifications for multiple members
 * @param {Array} members - Array of member objects with id property
 * @param {string} message - Notification message
 * @param {number} taskId - Task ID for link generation
 */
export async function createBulkTaskNotifications(members, message, taskId) {
  try {
    const notificationData = members.map(member => ({
      id_member: member.id,
      message,
      link_url: `/tugas/${taskId}`,
      is_read: false
    }));
    
    await prisma.notifications.createMany({
      data: notificationData,
      skipDuplicates: true
    });
    
    console.log(`Created ${notificationData.length} bulk task notifications for task ${taskId}`);
  } catch (error) {
    console.error('Error creating bulk task notifications:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Create notification when task is completed
 * @param {Object} submission - Task submission object with member and task data
 * @param {number} points - Points awarded (optional)
 */
export async function createTaskCompletionNotification(submission, points = 0) {
  const pointsMessage = points > 0 ? ` dan mendapatkan ${points} poin` : '';
  const taskName = submission.tugas_ai?.nama_tugas || submission.tugas_ai?.keyword_tugas || 'tugas';
  
  await createTaskNotification({
    memberId: submission.id_member,
    message: `Selamat! Tugas "${taskName}" telah diselesaikan${pointsMessage}!`,
    taskId: submission.id_task
  });
}

/**
 * Create notification when task is rejected
 * @param {Object} submission - Task submission object with member and task data
 * @param {string} reason - Rejection reason (optional)
 */
export async function createTaskRejectionNotification(submission, reason = '') {
  const reasonMessage = reason ? ` Alasan: ${reason}` : '';
  const taskName = submission.tugas_ai?.nama_tugas || submission.tugas_ai?.keyword_tugas || 'tugas';
  
  await createTaskNotification({
    memberId: submission.id_member,
    message: `Tugas "${taskName}" ditolak.${reasonMessage} Anda dapat mencoba lagi.`,
    taskId: submission.id_task
  });
}

/**
 * Create notification when task validation is successful and points are awarded
 * @param {Object} options - Notification options
 * @param {number} options.memberId - Member ID to send notification to
 * @param {number} options.points - Points awarded
 * @param {string} options.taskName - Name of the task (optional)
 */
export async function createTaskValidationSuccessNotification({ memberId, points, taskName }) {
  const taskDisplayName = taskName || 'tugas';
  
  // Use /loyalty instead of non-existent /profil/poin
  await prisma.notifications.create({
    data: {
      id_member: memberId,
      message: `Selamat! Tugas "${taskDisplayName}" telah berhasil divalidasi dan Anda mendapatkan ${points} poin baru!`,
      link_url: `/loyalty`,
      is_read: false,
      created_at: new Date()
    }
  });
}

/**
 * Create notification for new task available
 * @param {Object} task - Task object
 * @param {Array} members - Array of member objects to notify
 */
export async function createNewTaskNotification(task, members) {
  const pointsMessage = task.point_value ? ` Dapatkan ${task.point_value} poin!` : '';
  const message = `Tugas baru tersedia: "${task.keyword_tugas}".${pointsMessage}`;
  
  await createBulkTaskNotifications(members, message, task.id);
}
