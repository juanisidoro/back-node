const { db } = require('../firebase');
const admin = require('firebase-admin');
const dayjs = require('dayjs');

// Middleware para registrar logs
const loggingMiddleware = async (req, res, next) => {
  const start = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - start;
    const today = dayjs().format('YYYY-MM-DD');

    // Crear una copia del cuerpo de la solicitud
    let sanitizedBody = { ...req.body };

    // Excluir contraseñas si la ruta es auth/login o auth/register
    if (req.originalUrl.includes('/auth/login') || req.originalUrl.includes('/auth/register')) {
      delete sanitizedBody.password;
    }

    // Crear una copia de los encabezados, excluyendo Authorization y X-CSRF-Token
    const sanitizedHeaders = { ...req.headers };
    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders['x-csrf-token'];
    // Excluir cookies sensibles
    if (sanitizedHeaders.cookie) {
      const cookies = sanitizedHeaders.cookie.split('; ');
      // Filtrar las cookies, eliminando las sensibles
      sanitizedHeaders.cookie = cookies
        .filter(cookie => !cookie.startsWith('_csrf=') && !cookie.startsWith('sessionId='))
        .join('; ');
    }


    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      route: req.originalUrl,
      ip: req.headers['x-forwarded-for'] || req.ip,
      host: req.hostname,
      user_agent: req.headers['user-agent'] || 'unknown',
      referer: req.headers['referer'] || 'none',
      response_status: res.statusCode,
      duration_ms: duration,
      body: sanitizedBody, // Cuerpo sin contraseñas
      headers: sanitizedHeaders, // Encabezados sin Authorization ni X-CSRF-Token
      params: req.params || {},
      content_length: req.headers['content-length'] || JSON.stringify(req.body || {}).length,
      server_time: new Date().toISOString(),
    };

    try {
      const logDoc = db.collection('logs').doc(today);

      const logSnapshot = await logDoc.get();
      if (logSnapshot.exists) {
        await logDoc.update({
          requests: admin.firestore.FieldValue.arrayUnion(logEntry),
        });
      } else {
        await logDoc.set({
          date: today,
          requests: [logEntry],
        });
      }
    } catch (error) {
      console.error('Error al guardar el log en Firestore:', error.message);
    }
  });

  next();
};

module.exports = loggingMiddleware;
