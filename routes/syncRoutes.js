const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { initiateSync } = require('../services/syncService');

const router = express.Router();

// Iniciar la sincronización de una tienda
router.post('/:shopId', authenticate, asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  await initiateSync({ userId: req.user.id, shopId });
  res.status(202).send(); // Aceptado, la sync se hará asíncronamente
}));

module.exports = router;
