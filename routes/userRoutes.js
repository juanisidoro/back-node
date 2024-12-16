const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware');
const { getUsers, getUserById, getAuthenticatedUser, updateUser, deleteUser } = require('../services/userService');

const router = express.Router();

// Obtener datos del usuario autenticado
router.get('/', authenticate, asyncHandler(getAuthenticatedUser));

// Listar todos los usuarios (admin)
router.get('/all', authenticate, authorizeAdmin, asyncHandler(getUsers));

// Obtener datos de un usuario específico (admin)
router.get('/:id', authenticate, authorizeAdmin, asyncHandler(getUserById));

// Actualizar datos de un usuario específico (propio o admin)
router.put('/:id', authenticate, asyncHandler(updateUser));

// Eliminar un usuario específico (admin)
router.delete('/:id', authenticate, authorizeAdmin, asyncHandler(deleteUser));

module.exports = router;
