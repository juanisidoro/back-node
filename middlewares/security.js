const helmet = require('helmet');
const cors = require('cors');
const xss = require('xss-clean');

// Asegúrate de cargar la variable de entorno NODE_ENV
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = (app) => {
  app.use(helmet()); // Configura cabeceras de seguridad HTTP

  // Configuración de CORS
  app.use(
    cors({
      origin: NODE_ENV === 'production' ? 'https://mi-app.com' : 'http://localhost:3000',
      credentials: true, // Permitir cookies
    })
  );

  // Limpieza de entradas contra XSS
  app.use(xss());
};
