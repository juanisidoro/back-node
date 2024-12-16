const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { db } = require('../firebase');

const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

async function register(req, res) {
  const { name = null, email, password } = req.body;

  const userRef = db.collection('users').where('profile.email', '==', email);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.empty) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    profile: {
      name,
      email,
      password: hashedPassword,
      role: 'user',
      site_url: null,
      basic_auth_username: null,
      basic_auth_password: null,
      registration_date: new Date().toISOString()
    }
  };

  await db.collection('users').add(newUser);
  res.status(201).json({ message: 'Usuario registrado con éxito' });
}

async function login(req, res) {
  const { email, password } = req.body;

  const userRef = db.collection('users').where('profile.email', '==', email);
  const userSnapshot = await userRef.get();
  if (userSnapshot.empty) {
    return res.status(400).json({ message: 'Usuario no encontrado' });
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();
  const user = userData.profile;

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Contraseña incorrecta' });
  }

  const token = jwt.sign({ id: userDoc.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ email: user.email }, REFRESH_SECRET_KEY);

  await db.collection('tokens').doc(userDoc.id).set({ refresh_token: refreshToken });

  // Configura la cookie HttpOnly
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutos
  });

  res.json({ message: 'Inicio de sesión exitoso', refreshToken });
}

async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
  const newToken = jwt.sign({ email: decoded.email }, SECRET_KEY, { expiresIn: '15m' });

  // Opcional: Actualizar el token en la cookie
  res.cookie('token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutos
  });

  res.json({ token: newToken });
}

async function logout(req, res) {
  const token = req.cookies.token;
  if (token) {
    const decoded = jwt.verify(token, SECRET_KEY);
    await db.collection('tokens').doc(decoded.id).delete();
  }

  // Limpiar la cookie de autenticación
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.json({ message: 'Sesión cerrada exitosamente' });
}

module.exports = { register, login, refreshToken, logout };
