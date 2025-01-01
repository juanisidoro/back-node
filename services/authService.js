const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { db } = require('../firebase');
const { cookieConfig, isProduction } = require('../utils/config');
const { getUserAssignedShopIds } = require('./userService'); // 



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
      registration_date: new Date().toISOString(),
      shops: []
    }
  };

  await db.collection('users').add(newUser);
  res.status(201).json({ message: 'Usuario registrado con éxito' });
}

async function login(req, res) {
  const { email, password } = req.body;

  // Buscar usuario por email
  const userRef = db.collection('users').where('profile.email', '==', email);
  const userSnapshot = await userRef.get();

  if (userSnapshot.empty) {
    return res.status(400).json({ message: 'Usuario no encontrado' });
  }

  const userDoc = userSnapshot.docs[0];
  const userData = userDoc.data();
  const user = userData.profile;

  // Verificar contraseña
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(400).json({ message: 'Contraseña incorrecta' });
  }

  // Obtener los shopIds solo si el usuario es de tipo "user"
  let shopIds = undefined; // Mantener indefinido para administradores
  if (user.role === 'user') {
    try {
      shopIds = await getUserAssignedShopIds(userDoc.id); // Obtener los IDs de las tiendas
    } catch (error) {
      console.error(`[LOGIN] Error al obtener tiendas para usuario ID=${userDoc.id}: ${error.message}`);
      return res.status(500).json({ message: 'Error al obtener tiendas del usuario' });
    }
  }

  // Generar token JWT
  const tokenPayload = {
    id: userDoc.id,
    email: user.email,
    role: user.role,
  };

  // Solo incluir `shopIds` en el token si el usuario es de tipo "user"
  if (shopIds) {
    tokenPayload.shopIds = shopIds;
  }

  const token = jwt.sign(tokenPayload, SECRET_KEY, {
    expiresIn: '15m',
  });

  const refreshToken = jwt.sign({ email: user.email }, REFRESH_SECRET_KEY);

  // Guardar refreshToken en la base de datos
  await db.collection('tokens').doc(userDoc.id).set({ refresh_token: refreshToken });

  console.log(`[LOGIN] Inicio de sesión exitoso. Usuario: ${email}, Rol: ${user.role}`);

  // Configurar la cookie HttpOnly en producción
  if (process.env.NODE_ENV === 'production') {
    res.cookie('token', token, {
      httpOnly: true,
      secure: true, // Solo HTTPS
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 minutos
    });
  }

  // Enviar solo el mensaje de éxito y el refreshToken en la respuesta
  res.json({
    message: 'Inicio de sesión exitoso',
    token,
    refreshToken,
  });
}


async function refreshToken(req, res) {
  const { refreshToken } = req.body;
  const decoded = jwt.verify(refreshToken, REFRESH_SECRET_KEY);

  const newToken = jwt.sign({ email: decoded.email }, SECRET_KEY, { expiresIn: '15m' });

  res.cookie('token', newToken, cookieConfig);

  res.json({ token: newToken });
}

async function logout(req, res) {
  const token = req.cookies.token;
  if (token) {
    const decoded = jwt.verify(token, SECRET_KEY);
    await db.collection('tokens').doc(decoded.id).delete();
  }

  res.clearCookie('token', cookieConfig);
  res.json({ message: 'Sesión cerrada exitosamente' });
}

module.exports = { register, login, refreshToken, logout };
