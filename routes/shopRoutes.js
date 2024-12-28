const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { createShop, getShop, getUserShops, deleteShop, getAllShops } = require('../services/shopService');
const { removeShopWithNoMembersHandler } = require('../controllers/shopController');



const router = express.Router();

// Crear una nueva tienda (solo admin)
//router.post('/', authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
router.post('/', asyncHandler(async (req, res) => {
  const { site_url, basic_auth_username, basic_auth_password } = req.body;

  // Crear la tienda
  const shopId = await createShop({
    site_url,
    basic_auth_username,
    basic_auth_password,
  });

  res.status(201).json({ shop_id: shopId });
}));

// Obtener todas las tiendas del usuario autenticado
//router.get('/', authenticate, asyncHandler(async (req, res) => {
router.get('/', asyncHandler(async (req, res) => {
  const shops = await getUserShops(req.user.id);
  res.status(200).json(shops);
}));

// Obtener todas las tiendas de todos los usuarios (solo admin)
//router.get('/getall', authenticate, authorizeAdmin, asyncHandler(async (req, res) => {
router.get('/getall', asyncHandler(async (req, res) => {
  const allShops = await getAllShops();
  res.status(200).json(allShops);
}));

// Obtener una tienda específica
//router.get('/:shopId', authenticate, asyncHandler(async (req, res) => {
router.get('/:shopId', asyncHandler(async (req, res) => {
  const shop = await getShop(req.params.shopId);
  if (!shop) {
    return res.status(404).json({ message: 'Tienda no encontrada o no autorizada' });
  }
  res.status(200).json(shop);
}));

// Eliminar una tienda específica
//router.delete('/:shopId', authenticate, asyncHandler(async (req, res) => {
// Eliminar una tienda sin usuarios asignados
router.delete('/:shopId', asyncHandler(removeShopWithNoMembersHandler));


module.exports = router;
