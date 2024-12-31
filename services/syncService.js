const { db } = require('../firebase');
const { verifyShopOwnership } = require('./shopService');
const { createNotification } = require('./notificationService');
const { decrypt } = require('../utils/cryptoUtil');
const fetch = require('node-fetch');
require('dotenv').config();
const { createFrontendShopObject } = require('./frontendShopService/createFrontendShopObject');

const CLOUD_FUNCTION_SYNC_URL = process.env.CLOUD_FUNCTION_SYNC_URL;

/* ==========================================================================
   Funciones auxiliares internas
   ========================================================================== */

// Obtener info de la tienda
async function getShopDetails(shopId) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error('Tienda no encontrada.');
  }

  const shopData = shopDoc.data();
  const owner = shopData.members?.find(member => member.isOwner === true);
  const ownerUserId = owner?.userId;

  if (!ownerUserId) {
    throw new Error('No se pudo determinar el propietario de la tienda (ownerUserId).');
  }

  return { shopRef, shopData, ownerUserId };
}

// Crear la notificación
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

// Actualizar la tienda con un estado de sincronización
async function updateShopSyncStatus(shopRef, status, additionalFields = {}) {
  await shopRef.update({
    sync_status: status,
    ...additionalFields,
  });
}

/*
// (OPCIONAL) Si ya no la usas, elimina o comenta por completo esta función.
// Función para verificar notificaciones existentes. 
// Ya NO se usa si siempre quieres crear la notificación sync.completed.
async function checkExistingNotifications(shopId, userId) {
  const notificationsRef = db
    .collection('notifications')
    .doc(shopId)
    .collection(userId);

  const querySnapshot = await notificationsRef
    .where('type', '==', 'sync.completed')
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();

  if (querySnapshot.empty) {
    return false;
  }

  const mostRecentNotification = querySnapshot.docs[0].data();
  const notificationTimestamp = new Date(mostRecentNotification.timestamp);
  const currentTimestamp = new Date();

  // Comparar si la notificación más reciente es del último minuto
  return currentTimestamp - notificationTimestamp < 60000; 
}
*/

/* ==========================================================================
   Funciones principales: initiateSync y completeSync
   ========================================================================== */

// Iniciar la sincronización
async function initiateSync({ userId, shopId, userRole }) {
  // 1. Verificar propiedad
  const isOwner = await verifyShopOwnership(userId, shopId, userRole);
  if (!isOwner) throw new Error('No autorizado');

  // 2. Obtener detalles de la tienda
  const { shopRef, shopData, ownerUserId } = await getShopDetails(shopId);
  const { site_url, basic_auth_username, basic_auth_password } = shopData;

  // 3. Notificar que inicia
  await notifySyncEvent('sync.started', shopId, userId, true, 'Sincronización iniciada.');
  // 4. Estado "in_progress"
  await updateShopSyncStatus(shopRef, 'in_progress');

  // 5. Llamar a la función externa
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

    // 6. Finalizar con éxito
    await completeSync({ shopId, success: true });
  } catch (error) {
    console.error('[initiateSync] Error:', error.message);

    // Actualizar estado a "failed"
    await updateShopSyncStatus(shopRef, 'failed');
    // Notificar error
    await notifySyncEvent('sync.failed', shopId, userId, false, 'Error durante la sincronización.');

    // Finalizar con "failed"
    await completeSync({ shopId, success: false });
  }
}

// Completar la sincronización
async function completeSync({ shopId, success }) {
  // 1. Obtener detalles de la tienda
  const { shopRef, shopData, ownerUserId } = await getShopDetails(shopId);
  const now = new Date().toISOString();

  // 2. Actualizar estado
  await updateShopSyncStatus(shopRef, success ? 'completed' : 'failed', {
    last_sync_date: now,
    last_sync_success: success,
  });

  // 3. Si es exitoso, creamos el objeto en frontend
  if (success) {
    try {
      console.log('[completeSync] Creando el objeto frontend_shops...');
      await createFrontendShopObject({ shopId, ownerUserId });
    } catch (error) {
      console.error('[completeSync] Error creando el objeto frontend_shops:', error.message);
    }
  }

  // 4. Crear SIEMPRE la notificación "sync.completed"
  await notifySyncEvent(
    'sync.completed',
    shopId,
    ownerUserId,
    success,
    success ? 'Sincronización completada con éxito.' : 'Falló la sincronización.'
  );
}

module.exports = { initiateSync, completeSync };
