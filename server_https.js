require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const csrf = require('csurf');
const { createDefaultAdmin } = require('./services/adminService');
const securityMiddleware = require('./middlewares/security');
const rateLimiter = require('./middlewares/rateLimiter');
const loggingMiddleware = require('./middlewares/loggingMiddleware');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const syncRoutes = require('./routes/syncRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const webhookRoutes = require("./routes/webhookRoutes");
const { isProduction, sessionConfig } = require('./utils/config');

// Validar variables de entorno
[
  'DEFAULT_ADMIN_NAME',
  'DEFAULT_ADMIN_EMAIL',
  'DEFAULT_ADMIN_PASSWORD',
  'FRONTEND_URL',
  'NODE_ENV',
  'PORT',
  'SECRET_KEY',
  'REFRESH_SECRET_KEY',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'CLOUD_FUNCTION_SYNC_URL',
  'SSL_KEY_PATH',
  'SSL_CERT_PATH'
].forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`La variable de entorno ${envVar} es obligatoria`);
  }
});

const app = express();
app.use(express.json());
app.use(cookieParser());


const sslOptions = {
  key: fs.readFileSync('./certs/server.key'),
  cert: fs.readFileSync('./certs/server.crt'),
  ca: fs.readFileSync('./certs/rootCA.crt'),
};


// Cargar middlewares de seguridad generales
securityMiddleware(app);
app.use(loggingMiddleware);

// Configurar trust proxy solo en producción
const NODE_ENV = process.env.NODE_ENV || 'development';
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
} else {
  app.set('trust proxy', 'loopback');
  console.log('Modo desarrollo: trust proxy configurado para loopback');
}
app.use(rateLimiter);

// Configurar sesiones y CSRF solo en producción
if (isProduction) {
  console.log('Configuración de producción: sesiones y CSRF activados');
  app.use(session(sessionConfig));
  app.use(csrf({ cookie: false }));

  // Endpoint para obtener el token CSRF
  app.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
  });
} else {
  console.log('Modo desarrollo: sin CSRF y sesiones opcionales');
}

// Rutas
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/shops', shopRoutes);
app.use('/sync', syncRoutes);
app.use('/notifications', notificationRoutes);

//app.use("/webhook", webhookRoutes);


// Controlador de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ message: 'CSRF token inválido o faltante' });
  }
  res.status(500).json({ message: 'Ocurrió un error en el servidor' });
});

const PORT = process.env.PORT || 3000;


// Crear servidor HTTPS
https.createServer(sslOptions, app).listen(PORT, async () => {
  console.log(`Servidor HTTPS corriendo en ${isProduction ? 'PRODUCCIÓN' : 'DESARROLLO'} en https://localhost:${PORT}`);
  if (isProduction) {
    await createDefaultAdmin({
      name: process.env.DEFAULT_ADMIN_NAME,
      email: process.env.DEFAULT_ADMIN_EMAIL,
      password: process.env.DEFAULT_ADMIN_PASSWORD,
    });
  }
});

