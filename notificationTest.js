const { createNotification } = require('./notificationService');

async function simulateNotificationFlow() {
  const userId = 'user123'; // Simula el ID del usuario
  const shopId = 'shop123'; // Simula el ID de la tienda

  // Notificación inicial
  await createNotification({
    userId,
    shopId,
    type: 'sync_started',
    message: 'Sincronización iniciada.',
    initiator: { role: 'system' }
  });

  console.log('Esperando 3-5 segundos...');
  setTimeout(async () => {
    const success = Math.random() > 0.5; // Simula éxito o fallo aleatorio
    await createNotification({
      userId,
      shopId,
      type: 'sync_completed',
      success,
      message: success
        ? 'Sincronización completada con éxito.'
        : 'Sincronización fallida.',
      initiator: { role: 'system' }
    });
    console.log('Sincronización finalizada.');
  }, 3000);
}

simulateNotificationFlow();
