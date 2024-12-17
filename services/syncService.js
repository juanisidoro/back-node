const { db } = require('../firebase');
const { verifyShopOwnership } = require('./shopService');
const { createNotification } = require('./notificationService');

async function initiateSync({ userId, shopId, userRole }) {
  const isOwner = await verifyShopOwnership(userId, shopId, userRole);
  if (!isOwner) throw new Error('No autorizado');

  const shopRef = db.collection('shops').doc(shopId);

  // Notificación de inicio
  await createNotification({
    userId,
    shopId,
    type: 'sync_started',
    message: 'Sincronización iniciada.',
    initiator: userRole === 'admin' ? { role: 'admin', userId } : { role: 'system' }
  });

  // Marcar la tienda como "in_progress"
  await shopRef.update({ sync_status: 'in_progress' });

  // Simulación de sincronización finalizada (para la prueba)
  setTimeout(async () => {
    const success = Math.random() > 0.5; // Simula éxito o fallo aleatorio
    await completeSync({ shopId, success });
  }, 3000);

  return true;
}

async function completeSync({ shopId, success }) {
  const shopRef = db.collection('shops').doc(shopId);
  const now = new Date().toISOString();

  await shopRef.update({
    last_sync_date: now,
    last_sync_success: success,
    sync_status: success ? 'completed' : 'failed'
  });

  const shopDoc = await shopRef.get();
  if (shopDoc.exists) {
    const shopData = shopDoc.data();
    await createNotification({
      userId: shopData.ownerUserId,
      shopId,
      type: 'sync_completed',
      success,
      message: success ? 'Sincronización completada con éxito.' : 'Falló la sincronización.',
      initiator: { role: 'system' }
    });
  }
}

module.exports = { initiateSync, completeSync };
