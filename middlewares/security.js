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
      origin:  'https://18qqdw9d-4321.uks1.devtunnels.ms',
      credentials: true, // Asegúrate de permitir credenciales
      allowedHeaders: [
        'Content-Type',
        'X-CSRF-Token', // Agrega esta cabecera
        'Authorization',
      ],
    })
  );
  

  // Limpieza de entradas contra XSS
  app.use(xss());
};
