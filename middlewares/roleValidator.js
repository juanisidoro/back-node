const bcrypt = require('bcrypt');
const { db } = require('../firebase');

const validateRoleForLogin = async (req, res, next) => {
  const { email, password } = req.body;
  const expectedRole = req.expectedRole;

  try {
    const userRef = db.collection('users').where('profile.email', '==', email);
    const userSnapshot = await userRef.get();

    if (userSnapshot.empty) {
      console.log(`[LOGIN] Usuario no encontrado: ${email}`);
      return res.status(400).json({ message: 'Usuario no encontrado' });
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const user = userData.profile;

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`[LOGIN] Contraseña incorrecta para usuario: ${email}`);
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    if (user.role !== expectedRole) {
      console.log(
        `[LOGIN] Rol incorrecto para usuario: ${email}. Rol recibido: ${user.role}. Rol esperado: ${expectedRole}`
      );
      return res.status(403).json({
        message: `Acceso denegado. Este usuario no tiene permisos para acceder desde este dominio.`,
      });
    }

    console.log(`[LOGIN] Usuario autenticado correctamente: ${email}. Rol: ${user.role}`);
    req.user = { id: userDoc.id, ...user };
    next();
  } catch (error) {
    console.error(`[LOGIN] Error durante la validación del rol para usuario: ${email}`, error.message);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

module.exports = validateRoleForLogin;
