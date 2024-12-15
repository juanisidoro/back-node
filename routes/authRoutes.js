const express = require('express');
const asyncHandler = require('express-async-handler');
const { validateRegister } = require('../middlewares/sanitization');
const { register, login, refreshToken } = require('../services/authService');

const router = express.Router();

// Registro de usuario
router.post('/register', validateRegister, asyncHandler(register));

// Inicio de sesión
router.post('/login', asyncHandler(login));

// Refresh token
router.post('/refresh', asyncHandler(refreshToken));

module.exports = router;
