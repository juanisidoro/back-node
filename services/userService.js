const { db } = require('../firebase');
const admin = require('firebase-admin');
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

/**
 * Validar la existencia de un usuario y una tienda.
 * @param {string} userId
 * @param {string} shopId
 * @returns {Promise<{userDoc: DocumentSnapshot, shopDoc: DocumentSnapshot}>}
 */
async function validateUserAndShop(userId, shopId) {
  if (!userId || typeof userId !== 'string' || !userId.trim()) {
    const error = new Error('El ID del usuario es inválido o está vacío.');
    error.statusCode = 400; // HTTP 400: Bad Request
    throw error;
  }

  if (!shopId || typeof shopId !== 'string' || !shopId.trim()) {
    const error = new Error('El ID de la tienda es inválido o está vacío.');
    error.statusCode = 400; // HTTP 400: Bad Request
    throw error;
  }

  const userRef = db.collection('users').doc(userId);
  const shopRef = db.collection('shops').doc(shopId);

  const [userDoc, shopDoc] = await Promise.all([userRef.get(), shopRef.get()]);

  if (!userDoc.exists) {
    const error = new Error(`Usuario con ID ${userId} no encontrado.`);
    error.statusCode = 404; // HTTP 404: Not Found
    throw error;
  }

  if (!shopDoc.exists) {
    const error = new Error(`Tienda con ID ${shopId} no encontrada.`);
    error.statusCode = 404; // HTTP 404: Not Found
    throw error;
  }

  return { userDoc, shopDoc };
}

/**
 * Asignar o actualizar una tienda para un usuario.
 * @param {string} userId
 * @param {string} shopId
 * @param {boolean} isOwner
 * @param {boolean} notifications_enabled
 * @returns {Promise<{message: string}>}
 */
async function assignShopToUser(userId, shopId, isOwner = false, notifications_enabled = true) {
  const { userDoc, shopDoc } = await validateUserAndShop(userId, shopId);

  const shopData = shopDoc.data();
  const userData = userDoc.data();

  // Actualizar miembros de la tienda
  let members = shopData.members || [];
  const existingMemberIndex = members.findIndex(member => member.userId === userId);

  if (existingMemberIndex !== -1) {
    // Actualizar miembro existente
    members[existingMemberIndex] = {
      ...members[existingMemberIndex],
      isOwner,
      notifications_enabled
    };
  } else {
    // Agregar nuevo miembro
    members.push({ userId, isOwner, notifications_enabled });
  }

  await db.collection('shops').doc(shopId).update({ members });

  // Actualizar perfil del usuario
  const userProfileShops = userData.profile.shops || [];
  const shopExistsInProfile = userProfileShops.some(shop => shop.shop_id === shopId);

  if (!shopExistsInProfile) {
    await db.collection('users').doc(userId).update({
      'profile.shops': admin.firestore.FieldValue.arrayUnion({ shop_id: shopId })
    });
  }

  return { message: 'Tienda asignada o actualizada correctamente.' };
}

/**
 * Eliminar una tienda asignada a un usuario.
 * @param {string} userId
 * @param {string} shopId
 * @returns {Promise<{message: string}>}
 */
async function removeShopFromUser(userId, shopId) {
  const { userDoc, shopDoc } = await validateUserAndShop(userId, shopId);

  const shopData = shopDoc.data();
  const userData = userDoc.data();

  // Actualizar miembros de la tienda
  const updatedMembers = (shopData.members || []).filter(member => member.userId !== userId);
  await db.collection('shops').doc(shopId).update({ members: updatedMembers });

  // Actualizar perfil del usuario
  const updatedShops = (userData.profile.shops || []).filter(shop => shop.shop_id !== shopId);
  await db.collection('users').doc(userId).update({ 'profile.shops': updatedShops });

  return { message: 'Relación tienda-usuario eliminada correctamente.' };
}

/**
 * Obtiene los IDs de las tiendas asociadas a un usuario.
 * @param {string} userId - ID del usuario.
 * @returns {Promise<string[]>} - Array de IDs de las tiendas asociadas.
 */
async function getUserAssignedShopIds(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      throw new Error(`Usuario con ID=${userId} no encontrado`);
    }

    const userData = userDoc.data();
    const shopIds = userData.profile?.shops || []; // Extrae los shop IDs del perfil

    return shopIds;
  } catch (error) {
    console.error(`[USER SERVICE] Error al obtener las tiendas del usuario ID=${userId}: ${error.message}`);
    throw error;
  }
}






module.exports = { assignShopToUser,removeShopFromUser, getUserAssignedShopIds, getAuthenticatedUser, getUserById, updateUser, deleteUser, validateUserAndShop };
