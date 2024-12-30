const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { getAllNotifications, deleteNotification } = require('../services/notificationService');
const { createNotification } = require ('../services/notificationService')

const router = express.Router();

/**
 * GET /notifications/all
 * Devuelve todas las notificaciones existentes (requiere rol admin)
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  try {
    const { sortOrder = 'desc' } = req.query; // Por defecto, 'desc'
    const notifications = await getAllNotifications(sortOrder);
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error al obtener las notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener las notificaciones' });
  }
}));


/**
 * POST /notifications/webhook
 * Recibe peticiones para procesarlas posteriormente.
 */
router.post('/events', asyncHandler(async (req, res) => {
  const notification = req.body;

  // Log del JSON recibido
  console.log('Webhook recibido:', notification);

  try {
    // Verificar y guardar la notificación en la base de datos
    if (notification && notification.type && notification.resource) {
      await createNotification(notification);
      //console.log('Notificación guardada en la base de datos:', notification);
    } else {
      console.warn('Webhook recibido con datos incompletos:', notification);
    }

    // Responder con estado 202
    res.sendStatus(202);
  } catch (error) {
    console.error('Error al procesar el webhook:', error.message);
    res.status(500).json({ message: 'Error al procesar el webhook.' });
  }
}));




/**
 * DELETE /notifications/:userId/:shopId/:notificationId
 * Elimina una notificación específica en Firebase
 */
router.delete('/:userId/:shopId/:notificationId', asyncHandler(async (req, res) => {
  const { userId, shopId, notificationId } = req.params;

  try {
    await deleteNotification(userId, shopId, notificationId);
    res.status(200).json({ message: 'Notificación eliminada correctamente.' });
  } catch (error) {
    console.error('Error al eliminar la notificación:', error);
    res.status(500).json({ message: 'Error al eliminar la notificación.' });
  }
}));


module.exports = router;
