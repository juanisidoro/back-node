const express = require('express');
const asyncHandler = require('express-async-handler');
const { authenticate, authorizeAdmin } = require('../middlewares/authMiddleware'); // Verifica esta ruta
const { getUsers, getUserById, updateUser, deleteUser } = require('../services/userService');

const router = express.Router();

// Rutas de usuarios
router.get('/', authenticate, authorizeAdmin, asyncHandler(getUsers));
router.get('/:id', authenticate, asyncHandler(getUserById));
router.put('/:id', authenticate, asyncHandler(updateUser));
router.delete('/:id', authenticate, asyncHandler(deleteUser));

module.exports = router;
