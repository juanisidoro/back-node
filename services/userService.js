const { db } = require('../firebase');

async function getUsers(req, res) {
  const usersSnapshot = await db.collection('users').get();
  const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.json(users);
}

async function getUserById(req, res) {
  const { id } = req.params;
  const userRef = db.collection('users').doc(id);
  const userDoc = await userRef.get();

  if (!userDoc.exists) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  res.json({ id: userDoc.id, ...userDoc.data() });
}

async function updateUser(req, res) {
  const { id } = req.params;
  const updates = req.body;

  const userRef = db.collection('users').doc(id);
  await userRef.update(updates);
  res.json({ message: 'Usuario actualizado con éxito' });
}

async function deleteUser(req, res) {
  const { id } = req.params;

  const userRef = db.collection('users').doc(id);
  await userRef.delete();
  res.json({ message: 'Usuario eliminado con éxito' });
}

module.exports = { getUsers, getUserById, updateUser, deleteUser };
