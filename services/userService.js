const { db } = require('../firebase');

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
  const userRole = req.user.role;

  if (userRole === 'admin') {
    // Si es admin, devolver todos los usuarios
    const allUsers = await getUsers();
    return res.json(allUsers);
  }

  // Si es user, devolver solo su información
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const userData = userDoc.data();
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
    profileUpdates[`profile.${key}`] = value;
  }

  if (Object.keys(profileUpdates).length === 0) {
    // No se realizan cambios
    return res.status(204).send(); // Sin contenido
  }

  await targetUserRef.update(profileUpdates);
  // Operación exitosa sin contenido en la respuesta
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
