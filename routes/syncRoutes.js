const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { initiateSync } = require('../services/syncService');

const router = express.Router();

// Iniciar la sincronización de una tienda
router.post('/:shopId', authenticate, asyncHandler(async (req, res) => {
  const { shopId } = req.params;

  console.log(`ID del usuario autenticado: ${req.user.id}`);
  console.log(`ShopId recibido: ${shopId}`);

  await initiateSync({
    userId: req.user.id, // Verifica que este userId sea correcto
    shopId
  });

  res.status(202).send();
}));


module.exports = router;
