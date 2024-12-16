const { db } = require('../firebase');
const { encrypt } = require('../utils/cryptoUtil');

// Obtener todos los usuarios (para admin)
async function getUsers() {
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map((doc) => {
    const data = doc.data();
    return { id: doc.id, profile: data.profile };
  });
  return users;
}

// Obtener datos del usuario autenticado o todos si es admin
async function getAuthenticatedUser(req, res) {
  const userId = req.user.id;
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const userData = userDoc.data();
  // Si es admin, devolver lista completa de usuarios (como se hizo antes)
  if (req.user.role === 'admin') {
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return { id: doc.id, profile: data.profile };
    });
    return res.json(users);
  }

  // Si es user, devolver solo su información
  res.json({ id: userDoc.id, profile: userData.profile });
}

// Obtener datos de un usuario específico (solo admin)
async function getUserById(req, res) {
  const { id } = req.params;
  const userRef = db.collection('users').doc(id);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const userData = userDoc.data();
  res.json({ id: userDoc.id, profile: userData.profile });
}

// Actualizar datos de un usuario
async function updateUser(req, res) {
  const { id } = req.params;
  const targetUserId = id || req.user.id; 
  const targetUserRef = db.collection('users').doc(targetUserId);
  const targetUserDoc = await targetUserRef.get();

  if (!targetUserDoc.exists) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const requestingUserRole = req.user.role;

  // Si el rol es user, no puede actualizar nada
  if (requestingUserRole === 'user') {
    return res.status(403).json({ message: 'Acceso denegado. Los usuarios sin rol admin no pueden actualizar datos.' });
  }

  // Si es admin, puede actualizar cualquier campo de profile excepto registration_date.
  const updates = req.body;
  const profileUpdates = {};

  for (const [key, value] of Object.entries(updates)) {
    if (key === 'registration_date') {
      continue; // No actualizar registration_date
    }
    // Si se actualizan las credenciales, encriptarlas antes de guardar
    if (key === 'basic_auth_username' && value) {
      profileUpdates['profile.basic_auth_username'] = encrypt(value);
      continue;
    }
    if (key === 'basic_auth_password' && value) {
      profileUpdates['profile.basic_auth_password'] = encrypt(value);
      continue;
    }
    profileUpdates[`profile.${key}`] = value;
  }

  if (Object.keys(profileUpdates).length === 0) {
    // No se realizan cambios
    return res.status(204).send();
  }

  await targetUserRef.update(profileUpdates);
  // 204 indica que se realizó la actualización sin contenido en el cuerpo
  res.status(204).send();
}

// Eliminar un usuario específico (solo admin)
async function deleteUser(req, res) {
  const { id } = req.params;

  const userRef = db.collection('users').doc(id);
  await userRef.delete();
  res.json({ message: 'Usuario eliminado con éxito' });
}

module.exports = { getAuthenticatedUser, getUserById, updateUser, deleteUser };
