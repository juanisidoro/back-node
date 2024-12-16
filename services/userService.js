const { db } = require('../firebase');

// Obtener datos del usuario autenticado
async function getAuthenticatedUser(req, res) {
  const userId = req.user.id; // Extraer el ID del usuario autenticado del token
  const userRef = db.collection('users').doc(userId);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  res.json({ id: userDoc.id, ...userDoc.data() });
}

// Listar todos los usuarios (solo admin)
async function getUsers(req, res) {
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  res.json(users);
}

// Obtener datos de un usuario específico (solo admin)
async function getUserById(req, res) {
  const { id } = req.params;
  const userRef = db.collection('users').doc(id);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  res.json({ id: userDoc.id, ...userDoc.data() });
}

// Actualizar datos de un usuario específico (propio o admin)
async function updateUser(req, res) {
  const { id } = req.params;
  const updates = req.body;

  // Verificar que el usuario puede actualizar sus datos o un admin puede actualizar cualquier usuario
  if (req.user.role !== 'admin' && req.user.id !== id) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }

  const userRef = db.collection('users').doc(id);
  await userRef.update(updates);
  res.json({ message: 'Usuario actualizado con éxito' });
}

// Eliminar un usuario específico (solo admin)
async function deleteUser(req, res) {
  const { id } = req.params;

  const userRef = db.collection('users').doc(id);
  await userRef.delete();
  res.json({ message: 'Usuario eliminado con éxito' });
}

module.exports = { getAuthenticatedUser, getUsers, getUserById, updateUser, deleteUser };
