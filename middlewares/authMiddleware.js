const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const SECRET_KEY = process.env.SECRET_KEY;

// Middleware de autenticación
const authenticate = asyncHandler(async (req, res, next) => {
  const token = req.cookies.token; // Solo lee el token desde las cookies
  if (!token) {
    console.log('Solicitud sin token de autorización en cookies.');
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Adjunta la información del usuario al objeto `req`
    console.log(`Usuario autenticado: ID=${decoded.id}, Email=${decoded.email}, Role=${decoded.role}`);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
});

// Middleware de autorización para admin
const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    console.log(`Acceso denegado para usuario ID=${req.user.id}, Email=${req.user.email}, Role=${req.user.role}`);
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
