const { db } = require('../firebase');

async function createNotification({ type, timestamp, actor, resource, status, message }) {
  const notificationRef = db.collection(`notifications/${resource.userId}/${resource.shopId}`);
  await notificationRef.add({
    type,
    timestamp,
    actor,
    resource,
    status,
    message
  });
  console.log(`Notificación creada: ${message}`);
}

async function getAllUsers() {
  const userIds = [];
  try {
    const usersSnapshot = await db.collection('users').get();
    usersSnapshot.forEach((doc) => userIds.push(doc.id));
  } catch (error) {
    console.error('Error al listar usuarios:', error);
  }
  return userIds;
}

async function getShopsForUser(userId) {
  const shopIds = [];
  try {
    const shopsSnapshot = await db.collection('shops').where('ownerUserId', '==', userId).get();
    shopsSnapshot.forEach((doc) => shopIds.push(doc.id));
  } catch (error) {
    console.error(`Error al listar tiendas para el usuario ${userId}:`, error);
  }
  return shopIds;
}

async function getNotificationsForShop(userId, shopId) {
  const notifications = [];
  try {
    const notificationsRef = db.collection(`notifications/${userId}/${shopId}`);
    const notificationsSnapshot = await notificationsRef.get();
    notificationsSnapshot.forEach((doc) => notifications.push({ notificationId: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error al listar notificaciones para la tienda ${shopId} del usuario ${userId}:`, error);
  }
  return notifications;
}

async function getAllNotifications() {
  try {
    const allNotifications = [];
    const userIds = await getAllUsers();
    console.log(userIds);
    for (const userId of userIds) {
      const shopIds = await getShopsForUser(userId);
      console.log(shopIds);
      for (const shopId of shopIds) {
        const notifications = await getNotificationsForShop(userId, shopId);
        allNotifications.push(...notifications);
      }
      console.log(allNotifications);
    }
    return allNotifications;
  } catch (error) {
    console.error('Error al obtener todas las notificaciones:', error);
  }
}

async function deleteNotification(userId, shopId, notificationId) {
  try {
    const notificationRef = db.collection(`notifications/${userId}/${shopId}`).doc(notificationId);
    await notificationRef.delete();
    console.log(`Notificación con ID ${notificationId} eliminada correctamente.`);
  } catch (error) {
    console.error(`Error al eliminar la notificación ${notificationId}:`, error);
    throw new Error('No se pudo eliminar la notificación.');
  }
}

module.exports = { createNotification, getAllNotifications,deleteNotification };
