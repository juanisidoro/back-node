require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const { createDefaultAdmin } = require('./services/adminService');
const securityMiddleware = require('./middlewares/security');
const csrfProtection = require('./middlewares/csrfProtection');
const rateLimiter = require('./middlewares/rateLimiter');
const loggingMiddleware = require('./middlewares/loggingMiddleware');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');

// Validar variables de entorno
['SECRET_KEY', 'REFRESH_SECRET_KEY', 'DEFAULT_ADMIN_NAME', 'DEFAULT_ADMIN_EMAIL', 'DEFAULT_ADMIN_PASSWORD'].forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`La variable de entorno ${envVar} es obligatoria`);
  }
});

const app = express();
app.use(express.json());
app.use(cookieParser());

// Configuración de seguridad
securityMiddleware(app); // Helmet, CORS, XSS-clean
//app.use(rateLimiter); // Limitar solicitudes
app.use(csrfProtection); // Protección CSRF
app.use(loggingMiddleware); //Middleware de logging

// Ejemplo de token CSRF
app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Rutas
app.use('/auth', authRoutes); // Rutas de autenticación
app.use('/users', userRoutes); // Rutas de usuarios

// Controlador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Ocurrió un error en el servidor' });
});

// Inicia servidor
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, async () => {
  console.log(`Servidor corriendo en ${NODE_ENV.toUpperCase()} en http://localhost:${PORT}`);
  await createDefaultAdmin({
    name: process.env.DEFAULT_ADMIN_NAME,
    email: process.env.DEFAULT_ADMIN_EMAIL,
    password: process.env.DEFAULT_ADMIN_PASSWORD,
  });
});
