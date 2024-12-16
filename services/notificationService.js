const { db } = require('../firebase');
const admin = require('firebase-admin');

// Crear una notificación para un usuario y una tienda
async function createNotification({ userId, shopId, type, success, message }) {
  const timestamp = new Date().toISOString();

  const notifRef = db.collection('notifications')
    .doc(userId)
    .collection('shops')
    .doc(shopId)
    .collection('notifications');

  await notifRef.add({
    type,
    success,
    message,
    timestamp
  });
}

module.exports = { createNotification };
