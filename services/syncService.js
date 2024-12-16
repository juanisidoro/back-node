// services/syncService.js
const { db } = require('../firebase');
const { verifyShopOwnership } = require('./shopService');

async function initiateSync({ userId, shopId }) {
  // Verificar que la tienda pertenece al usuario
  const isOwner = await verifyShopOwnership(userId, shopId);
  if (!isOwner) throw new Error('No autorizado');

  const shopRef = db.collection('shops').doc(shopId);

  // Marcar la tienda como "in_progress"
  await shopRef.update({
    sync_status: 'in_progress'
  });

  // Crear el documento en sync_requests para que la Cloud Function lo procese
  await db.collection('sync_requests').add({
    shopId,
    userId,
    created_at: new Date().toISOString()
  });

  // Responder inmediatamente
  return true;
}

// completeSync permanece igual
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
    // Importamos createNotification solo si no está en este archivo
    const { createNotification } = require('./notificationService');
    await createNotification({
      userId: shopData.ownerUserId,
      shopId: shopId,
      type: 'sync_completed',
      success: success,
      message: success ? 'Sincronización completada con éxito' : 'Falló la sincronización'
    });
  }
}

module.exports = { initiateSync, completeSync };
