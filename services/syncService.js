const { db } = require('../firebase');
const { verifyShopOwnership } = require('./shopService');
const { createNotification } = require('./notificationService');
const { decrypt } = require('../utils/cryptoUtil'); // Importa la función decrypt
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

  // Notificación de inicio
  await createNotification({
    userId,
    shopId,
    type: 'sync_started',
    message: 'Sincronización iniciada.',
    initiator: userRole === 'admin' ? { role: 'admin', userId } : { role: 'system' }
  });

  // Actualizar estado de la tienda
  await shopRef.update({ sync_status: 'in_progress' });

  // Ejecutar la llamada a la Cloud Function en segundo plano
  (async () => {
    try {
      console.log(`Enviando sincronización a la Cloud Function para tienda: ${shopId}`);

      // DESCIFRAR credenciales antes de enviarlas
      const username = decrypt(basic_auth_username);
      const password = decrypt(basic_auth_password);

      console.log(`CLOUD_FUNCTION_SYNC_URL: ${CLOUD_FUNCTION_SYNC_URL}`);
      console.log(`Credenciales descifradas: Usuario=${username}`);


      if (!shopId || !ownerUserId || !site_url || !username || !password) {
        throw new Error('Faltan parámetros obligatorios para la sincronización.');
      }
      
      console.log(`Parámetros enviados a la Cloud Function:
        shopId: ${shopId},
        ownerUserId: ${ownerUserId},
        site_url: ${site_url},
        basic_auth_username: ${username ? '****' : 'MISSING'},
        basic_auth_password: ${password ? '****' : 'MISSING'}
      `);
      

      // Llamar a la Cloud Function
      const response = await fetch(CLOUD_FUNCTION_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopId,
          ownerUserId,
          site_url,
          basic_auth_username: username,
          basic_auth_password: password
        })
      });

      result = await response.json();

      if (response.ok) {
        console.log(`Cloud Function completada: ${result.message}`);
      } else {
        throw new Error(result.message || 'Error desconocido en la Cloud Function');
      }
    } catch (error) {
      console.error(`Error al enviar sincronización a la Cloud Function: ${error.message}`);
      await shopRef.update({ sync_status: 'failed' });

      await createNotification({
        userId: ownerUserId,
        shopId,
        type: 'sync_failed',
        message: 'Error durante la sincronización.',
        initiator: { role: 'system' }
      });
    }
  })(); // Lógica asíncrona ejecutada en segundo plano

  // Respuesta inmediata al cliente
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
/*
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
*/

}

module.exports = { initiateSync, completeSync };
