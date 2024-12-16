const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { createShop } = require('../services/shopService');

const router = express.Router();

// Crear una nueva tienda para el usuario autenticado
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { site_url, basic_auth_username, basic_auth_password } = req.body;

  // Crear la tienda
  const shopId = await createShop({
    userId: req.user.id,
    site_url,
    basic_auth_username,
    basic_auth_password
  });

  res.status(201).json({ shop_id: shopId });
}));

module.exports = router;
