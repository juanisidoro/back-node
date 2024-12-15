const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { db } = require('../firebase');

const SECRET_KEY = process.env.SECRET_KEY;
const REFRESH_SECRET_KEY = process.env.REFRESH_SECRET_KEY;

async function register(req, res) {
  const { name, email, password } = req.body;

  const userRef = db.collection('users').where('email', '==', email);
  const userSnapshot = await userRef.get();
  if (!userSnapshot.empty) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    name,
    email,
    password: hashedPassword,
    role: 'user',
    registration_date: new Date().toISOString(),
  };

  await db.collection('users').add(newUser);
  res.status(201).json({ message: 'Usuario registrado con éxito' });
}

async function login(req, res) {
  const { email, password } = req.body;

  const userRef = db.collection('users').where('email', '==', email);
  const userSnapshot = await userRef.get();
  if (userSnapshot.empty) {
    return res.status(400).json({ message: 'Usuario no encontrado' });
  }

  const userDoc = userSnapshot.docs[0];
  const user = userDoc.data();

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Contraseña incorrecta' });
  }

  const token = jwt.sign({ id: userDoc.id, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ email: user.email }, REFRESH_SECRET_KEY);

  await db.collection('tokens').doc(userDoc.id).set({ refresh_token: refreshToken });
  res.json({ token, refreshToken });
}

async function refreshToken(req, res) {
  const { refreshToken } = req.body;

  const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);
  const newToken = jwt.sign({ email: decoded.email }, SECRET_KEY, { expiresIn: '15m' });
  res.json({ token: newToken });
}

module.exports = { register, login, refreshToken };
