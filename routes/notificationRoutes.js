const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { getAllNotifications } = require('../services/notificationService');

const router = express.Router();

/**
 * GET /notifications/all
 * Devuelve todas las notificaciones existentes (requiere rol admin)
 */
router.get('/all', authenticate, asyncHandler(async (req, res) => {
  // Verificar si el usuario tiene rol de admin
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'No autorizado' });
  }

  try {
    // Obtener todas las notificaciones utilizando el servicio
    const notifications = await getAllNotifications();
    res.status(200).json(notifications);
  } catch (error) {
    console.error('Error al obtener las notificaciones:', error);
    res.status(500).json({ message: 'Error al obtener las notificaciones' });
  }
}));

module.exports = router;
