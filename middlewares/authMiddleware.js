const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const SECRET_KEY = process.env.SECRET_KEY;

// Middleware de autenticación
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
});

// Middleware de autorización para admin
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
