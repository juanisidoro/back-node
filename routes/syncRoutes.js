const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { initiateSync } = require('../services/syncService');

const router = express.Router();

// Iniciar la sincronización de una tienda
router.post('/:shopId', authenticate, asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  console.log(`ID del usuario autenticado: ${req.user.id}, Rol: ${req.user.role}`);
  console.log(`ShopId recibido: ${shopId}`);

  const response = await initiateSync({
    userId: req.user.id,
    shopId,
    userRole: req.user.role
  });

  res.status(202).json(response); // Respuesta inmediata
}));

module.exports = router;

