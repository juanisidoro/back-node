const { db } = require('./firebase'); // Usa tu inicialización de Firestore

async function getAllUsers() {
  const userIds = [];
  try {
    const usersSnapshot = await db.collection('users').get();
    console.log(`Usuarios encontrados: ${usersSnapshot.size}`);
    usersSnapshot.docs.forEach((doc) => {
      userIds.push(doc.id);
      console.log(`Usuario ID: ${doc.id}`);
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
  }
  return userIds;
}

async function getShopsForUser(userId) {
  const shopIds = [];
  try {
    const shopsSnapshot = await db.collection('shops').where('ownerUserId', '==', userId).get();
    console.log(`Tiendas encontradas para el usuario ${userId}: ${shopsSnapshot.size}`);
    shopsSnapshot.docs.forEach((doc) => {
      shopIds.push(doc.id);
      console.log(`  Tienda ID: ${doc.id}`);
    });
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
    console.log(`Notificaciones encontradas para la tienda ${shopId} del usuario ${userId}: ${notificationsSnapshot.size}`);
    notificationsSnapshot.docs.forEach((doc) => {
      notifications.push({
        notificationId: doc.id,
        ...doc.data(),
      });
      console.log(`    Notificación ID: ${doc.id}`);
    });
  } catch (error) {
    console.error(`Error al listar notificaciones para la tienda ${shopId} del usuario ${userId}:`, error);
  }
  return notifications;
}

async function getAllNotifications() {
  try {
    const allNotifications = [];
    const userIds = await getAllUsers();

    for (const userId of userIds) {
      const shopIds = await getShopsForUser(userId);

      for (const shopId of shopIds) {
        const notifications = await getNotificationsForShop(userId, shopId);
        allNotifications.push(...notifications);
      }
    }

    console.log(`Total de notificaciones encontradas: ${allNotifications.length}`);
    return allNotifications;
  } catch (error) {
    console.error('Error al obtener todas las notificaciones:', error);
  }
}

// Ejecutar el script
getAllNotifications().then((notifications) => {
  console.log('Notificaciones obtenidas:', notifications);
});
