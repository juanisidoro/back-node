const rateLimit = require('express-rate-limit');

const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limitar a 100 solicitudes por IP
  message: 'Demasiadas solicitudes, intenta de nuevo más tarde.',
});

module.exports = rateLimiter;
