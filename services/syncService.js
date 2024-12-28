const { db } = require('../firebase');
const { verifyShopOwnership } = require('./shopService');
const { createNotification } = require('./notificationService');
const { decrypt } = require('../utils/cryptoUtil');
const fetch = require('node-fetch');
require('dotenv').config();

const CLOUD_FUNCTION_SYNC_URL = process.env.CLOUD_FUNCTION_SYNC_URL;

async function initiateSync({ userId, shopId, userRole }) {
  const isOwner = await verifyShopOwnership(userId, shopId, userRole);
  if (!isOwner) throw new Error('No autorizado');

  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) throw new Error('Tienda no encontrada.');
  const { site_url, basic_auth_username, basic_auth_password, ownerUserId } = shopDoc.data();
  const resource = { shopId, userId };
  console.log('Datos de resource antes de createNotification:', resource);
  
  // Notificación de inicio
  await createNotification({
    type: 'sync.started',
    timestamp: new Date().toISOString(),
    actor: userRole === 'admin' ? { role: 'admin', id: userId } : { role: 'system', id: null },
    resource: { shopId, userId },
    status: { success: true, read: false },
    message: 'Sincronización iniciada.'
  });

  // Actualizar estado de la tienda
  await shopRef.update({ sync_status: 'in_progress' });

  (async () => {
    try {
      const username = decrypt(basic_auth_username);
      const password = decrypt(basic_auth_password);

      if (!shopId || !userId || !site_url || !username || !password) {
        throw new Error('Faltan parámetros obligatorios para la sincronización.');
      }

      const response = await fetch(CLOUD_FUNCTION_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          ownerUserId:userId ,
          site_url,
          basic_auth_username: username,
          basic_auth_password: password
        })
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Error desconocido en la Cloud Function');
    } catch (error) {
      await shopRef.update({ sync_status: 'failed' });
      await createNotification({
        type: 'sync.failed',
        timestamp: new Date().toISOString(),
        actor: { role: 'system', id: null },
        resource: { shopId, userId },
        status: { success: false, read: false },
        message: 'Error durante la sincronización.'
      });
    }
  })();

  return { message: 'Sincronización iniciada correctamente.', shopId };
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
    const { ownerUserId } = shopDoc.data();
    await createNotification({
      type: 'sync.completed',
      timestamp: now,
      actor: { role: 'system', id: null },
      resource: { shopId, userId: ownerUserId },
      status: { success, read: false },
      message: success ? 'Sincronización completada con éxito.' : 'Falló la sincronización.'
    });
  }
}

module.exports = { initiateSync, completeSync };
