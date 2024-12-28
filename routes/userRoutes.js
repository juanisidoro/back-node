const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { getAuthenticatedUser, getUserById, updateUser, deleteUser} = require('../services/userService');
const {  assignShopHandler, removeShopHandler } = require('../controllers/userController');

const router = express.Router();

// Obtener datos del usuario autenticado o todos si es admin
router.get('/', authenticate, asyncHandler(getAuthenticatedUser));

// Actualizar datos del usuario autenticado (si es admin puede actualizar su propio perfil)
router.put('/', authenticate, asyncHandler(updateUser));

// Obtener datos de un usuario específico (admin)
router.get('/:id', authenticate, authorizeAdmin, asyncHandler(getUserById));

// Actualizar datos de un usuario específico (admin)
router.put('/:id', authenticate, authorizeAdmin, asyncHandler(updateUser));

// Eliminar un usuario específico (admin)
router.delete('/:id', authenticate, authorizeAdmin, asyncHandler(deleteUser));

// Asignar o actualizar una tienda para un usuario (solo admin)
router.post('/:userId/shop/:shopId', asyncHandler(assignShopHandler));

// Eliminar una tienda asignada a un usuario (solo admin)
router.delete('/:userId/shop/:shopId', asyncHandler(removeShopHandler));



  

module.exports = router;
