const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const SECRET_KEY = process.env.SECRET_KEY;

// Middleware de autenticación
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Intentar obtener el token desde el encabezado Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // Extraer token Bearer
  }

  // 2. Si no hay token en el encabezado, buscar en las cookies
  if (!token && req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  // 3. Si no hay token, responder con error
  if (!token) {
    console.log('Solicitud sin token de autorización.');
    return res.status(401).json({ message: 'Token requerido para acceder' });
  }

  // 4. Verificar el token
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // Adjuntar información del usuario al objeto req
    console.log(`Usuario autenticado: ID=${decoded.id}, Email=${decoded.email}, Role=${decoded.role}`);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido' });
  }
});

// Middleware de autorización para admin
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    console.log(
      `Acceso denegado para usuario ID=${req.user?.id || 'N/A'}, Role=${req.user?.role || 'N/A'}`
    );
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
