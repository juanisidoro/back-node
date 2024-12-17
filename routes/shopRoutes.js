const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate } = require('../middlewares/authMiddleware');
const { createShop, getShop, getUserShops, deleteShop } = require('../services/shopService');

const router = express.Router();

// Crear una nueva tienda para el usuario autenticado o un usuario específico (solo admin)
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const { site_url, basic_auth_username, basic_auth_password, ownerUserId } = req.body;

  // Determinar el ID del usuario propietario de la tienda
  const userId = req.user.role === 'admin' && ownerUserId ? ownerUserId : req.user.id;

  // Crear la tienda
  const shopId = await createShop({
    userId,
    site_url,
    basic_auth_username,
    basic_auth_password
  });

  res.status(201).json({ shop_id: shopId });
}));

// Obtener todas las tiendas del usuario autenticado
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const shops = await getUserShops(req.user.id);
  res.status(200).json(shops);
}));

// Obtener una tienda específica
router.get('/:shopId', authenticate, asyncHandler(async (req, res) => {
  const shop = await getShop(req.params.shopId);
  if (!shop || shop.ownerUserId !== req.user.id) {
    return res.status(404).json({ message: 'Tienda no encontrada o no autorizada' });
  }
  res.status(200).json(shop);
}));

// Eliminar una tienda específica
router.delete('/:shopId', authenticate, asyncHandler(async (req, res) => {
  const { shopId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  console.log(`Eliminando tienda con ID: ${shopId} para usuario: ${userId}, role: ${userRole}`);

  const success = await deleteShop(userId, shopId, userRole);

  if (!success) {
    return res.status(404).json({ message: 'No se pudo eliminar la tienda. Verifica el ID o los permisos.' });
  }

  res.status(200).json({ message: 'Tienda eliminada correctamente.' });
}));


module.exports = router;
