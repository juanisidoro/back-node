const { db } = require('../firebase');

async function createNotification({ userId, shopId, type, message, initiator, success = null }) {
  const notificationRef = db.collection(`notifications/${userId}/${shopId}`);
  await notificationRef.add({
    shop_id: shopId,
    user_id: userId,
    type,
    message,
    created_at: new Date().toISOString(),
    success,
    initiator,
    read: false
  });
  console.log(`Notificación creada: ${message}`);
}

module.exports = { createNotification };
