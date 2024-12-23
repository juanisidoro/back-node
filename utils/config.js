require('dotenv').config();

const isProduction = process.env.NODE_ENV === 'production';

const cookieConfig = {
  httpOnly: true,
  secure: isProduction, // En prod: true, en dev: false
  sameSite: isProduction ? 'strict' : 'lax',
  //maxAge: 15 * 60 * 1000 // 15 minutos
};

const sessionConfig = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'lax' : 'lax', // se puede usar 'lax' incluso en prod, a discreción
    maxAge: 1000 * 60 * 60 * 2 // 2 horas
  }
};

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: [
    'Content-Type',
    'X-CSRF-Token',
    'Authorization'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
};

module.exports = {
  isProduction,
  cookieConfig,
  sessionConfig,
  corsOptions
};
