const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { getAllNotifications, deleteNotification } = require('../services/notificationService');
const { createNotification } = require ('../services/notificationService')
const { convertEcommerceEvent } = require('../adapter/eventToNotificationAdapter');
const { handlerActionWoo } = require('../services/ecommerceActionHandler');

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

  try {
    if (notification && notification.type && notification.resource) {
      // Procesar notificaciones tradicionales
      console.log('Notificación estándar detectada:', notification);
      await createNotification(notification);
    } else if (notification && notification.object_type && notification.action) {
      // Procesar eventos de eCommerce
      console.log('Evento de eCommerce detectado:', notification);

      // Convertir el evento al nuevo formato
      const convertedNotification = await convertEcommerceEvent(notification);
      console.log(convertedNotification);
      // Guardar la notificación en la base de datos
      await createNotification(convertedNotification);

      // Procesar la acción específica
      await handlerActionWoo(convertedNotification);
    } else {
      console.warn('Evento no reconocido recibido:', notification);
      return res.status(400).json({ message: 'Evento no reconocido.' });
    }

    res.sendStatus(202);
  } catch (error) {
    console.error('Error al procesar el evento:', error.message);
    res.status(500).json({ message: 'Error al procesar el evento.' });
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
