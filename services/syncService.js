const { db } = require('../firebase');
const { verifyShopOwnership } = require('./shopService');
const { createNotification } = require('./notificationService');
const { decrypt } = require('../utils/cryptoUtil');
const fetch = require('node-fetch');
require('dotenv').config();
const { createFrontendShopObject } = require('./frontendShopService/createFrontendShopObject');

const CLOUD_FUNCTION_SYNC_URL = process.env.CLOUD_FUNCTION_SYNC_URL;

// Función para obtener detalles de la tienda
async function getShopDetails(shopId) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error('Tienda no encontrada.');
  }

  const shopData = shopDoc.data();

  // Extraer ownerUserId del array members
  const owner = shopData.members?.find(member => member.isOwner === true);
  const ownerUserId = owner?.userId;

  if (!ownerUserId) {
    throw new Error('No se pudo determinar el propietario de la tienda (ownerUserId).');
  }

  return { shopRef, shopData, ownerUserId };
}

// Función para notificar eventos
async function notifySyncEvent(type, shopId, userId, success, message) {
  const timestamp = new Date().toISOString();
  const actor = userId ? { role: 'system', id: userId } : { role: 'system', id: null };
  const status = { success, read: false };

  await createNotification({
    type,
    timestamp,
    actor,
    resource: { shopId, userId },
    status,
    message,
  });
}

// Función para actualizar el estado de la tienda
async function updateShopSyncStatus(shopRef, status, additionalFields = {}) {
  await shopRef.update({
    sync_status: status,
    ...additionalFields,
  });
}

// Función para verificar notificaciones existentes (sin requerir índice compuesto)
async function checkExistingNotifications(shopId) {
  const notificationsRef = db.collection('notifications');
  const querySnapshot = await notificationsRef
    .where('type', '==', 'sync.completed')
    .where('resource.shopId', '==', shopId)
    .get();

  const notifications = querySnapshot.docs.filter(doc => {
    const data = doc.data();
    const timestamp = new Date(data.timestamp);
    return timestamp >= new Date(Date.now() - 60000); // Filtrar manualmente por tiempo
  });

  return notifications.length > 0;
}

// Función para iniciar la sincronización
async function initiateSync({ userId, shopId, userRole }) {
  const isOwner = await verifyShopOwnership(userId, shopId, userRole);
  if (!isOwner) throw new Error('No autorizado');

  const { shopRef, shopData, ownerUserId } = await getShopDetails(shopId);
  const { site_url, basic_auth_username, basic_auth_password } = shopData;

  await notifySyncEvent('sync.started', shopId, userId, true, 'Sincronización iniciada.');
  await updateShopSyncStatus(shopRef, 'in_progress');

  try {
    const username = decrypt(basic_auth_username);
    const password = decrypt(basic_auth_password);

    if (!site_url || !username || !password) {
      throw new Error('Faltan parámetros obligatorios para la sincronización.');
    }

    const response = await fetch(CLOUD_FUNCTION_SYNC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId,
        ownerUserId,
        site_url,
        basic_auth_username: username,
        basic_auth_password: password,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || `Error desconocido. Código de estado: ${response.status}`);
    }

    await completeSync({ shopId, success: true });
  } catch (error) {
    await updateShopSyncStatus(shopRef, 'failed');
    await notifySyncEvent('sync.failed', shopId, userId, false, 'Error durante la sincronización.');
    await completeSync({ shopId, success: false });
  }
}

// Función para completar la sincronización
async function completeSync({ shopId, success }) {
  const { shopRef, shopData, ownerUserId } = await getShopDetails(shopId);
  const now = new Date().toISOString();

  await updateShopSyncStatus(shopRef, success ? 'completed' : 'failed', {
    last_sync_date: now,
    last_sync_success: success,
  });

  const hasExistingNotification = await checkExistingNotifications(shopId);
  if (hasExistingNotification) {
    return;
  }

  if (success) {
    try {
      console.log('[completeSync] Creando el objeto frontend_shops...');
      await createFrontendShopObject({ shopId, ownerUserId });
    } catch (error) {
      console.error('[completeSync] Error creando el objeto frontend_shops:', error.message);
    }
  }

  await notifySyncEvent(
    'sync.completed',
    shopId,
    ownerUserId,
    success,
    success ? 'Sincronización completada con éxito.' : 'Falló la sincronización.'
  );
}

module.exports = { initiateSync, completeSync };
