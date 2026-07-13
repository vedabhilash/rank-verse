import Notification from '../models/Notification.js';
import { sendNotification } from './socket.service.js';

export const createNotification = async ({ recipient, type, actor, ranking }) => {
  try {
    // Avoid notifying users about their own actions
    if (recipient.toString() === actor.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      actor,
      ranking,
    });

    const populatedNotification = await notification.populate([
      { path: 'actor', select: 'name avatarUrl' },
      { path: 'ranking', select: 'title slug' },
    ]);

    // Send via socket.io
    sendNotification(recipient.toString(), populatedNotification);

    return populatedNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};
