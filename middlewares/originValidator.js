const { CLIENT_HOST, ADMIN_HOST } = process.env;

const validateOriginForLogin = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return res.status(403).json({ message: 'Origin no detectado en la cabecera' });
  }

  if (origin === CLIENT_HOST) {
    req.expectedRole = 'user';
    console.log(`[LOGIN] Solicitud desde CLIENT_HOST: ${origin}. Rol esperado: user`);
    next();
  } else if (origin === ADMIN_HOST) {
    req.expectedRole = 'admin';
    console.log(`[LOGIN] Solicitud desde ADMIN_HOST: ${origin}. Rol esperado: admin`);
    next();
  } else {
    console.log(`[LOGIN] Acceso denegado desde origen no permitido: ${origin}`);
    return res.status(403).json({ message: 'Accesso denegado desde este dominio' });
  }
};

module.exports = validateOriginForLogin;

