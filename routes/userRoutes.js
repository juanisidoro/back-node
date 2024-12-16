const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { getAuthenticatedUser, getUserById, updateUser, deleteUser } = require('../services/userService');

const router = express.Router();

// Obtener datos del usuario autenticado o todos si es admin
router.get('/', authenticate, asyncHandler(getAuthenticatedUser));

// Actualizar datos del usuario autenticado o de otro usuario (admin)
router.put('/', authenticate, asyncHandler(updateUser));
router.put('/:id', authenticate, authorizeAdmin, asyncHandler(updateUser));

// Obtener datos de un usuario específico (admin)
router.get('/:id', authenticate, authorizeAdmin, asyncHandler(getUserById));

// Eliminar un usuario específico (admin)
router.delete('/:id', authenticate, authorizeAdmin, asyncHandler(deleteUser));

module.exports = router;
