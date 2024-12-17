const { db } = require('../firebase');
const { encrypt } = require('../utils/cryptoUtil');
const admin = require('firebase-admin');

// Crear una tienda
async function createShop({ userId, site_url, basic_auth_username, basic_auth_password }) {
  const encryptedUsername = basic_auth_username ? encrypt(basic_auth_username) : null;
  const encryptedPassword = basic_auth_password ? encrypt(basic_auth_password) : null;

  const shopData = {
    ownerUserId: userId,
    site_url,
    basic_auth_username: encryptedUsername,
    basic_auth_password: encryptedPassword,
    last_sync_date: null,
    last_sync_success: false,
    sync_status: 'idle',
    members: [] // Futuro uso
  };

  // Crear la tienda y obtener el ID
  const shopRef = await db.collection('shops').add(shopData);
  const shopId = shopRef.id;

  // Agregar shop_id al perfil del usuario propietario
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    'profile.shops': admin.firestore.FieldValue.arrayUnion({ shop_id: shopId })
  });

  return shopId;
}

// Obtener una tienda específica
async function getShop(shopId) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();
  if (!shopDoc.exists) return null;
  return { id: shopDoc.id, ...shopDoc.data() };
}

// Obtener todas las tiendas de un usuario
async function getUserShops(userId) {
  const shopsSnapshot = await db.collection('shops').where('ownerUserId', '==', userId).get();
  return shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Eliminar una tienda específica
async function deleteShop(userId, shopId, userRole) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();

  console.log(`Intentando eliminar tienda: shopId=${shopId}, userId=${userId}, role=${userRole}`);
  console.log('Datos de la tienda obtenidos:', shopDoc.exists ? shopDoc.data() : 'No existe');

  if (!shopDoc.exists) {
    console.log('Tienda no encontrada.');
    return false;
  }

  // Permitir a administradores eliminar cualquier tienda
  const shopData = shopDoc.data();
  if (userRole !== 'admin' && shopData.ownerUserId !== userId) {
    console.log('No autorizado. El usuario no es propietario de la tienda.');
    return false; // No autorizado
  }

  console.log('Validación exitosa. Eliminando la tienda...');

  // Eliminar la tienda
  await shopRef.delete();

  // Eliminar referencia de la tienda en el perfil del usuario propietario
  const ownerUserId = shopData.ownerUserId; // Usuario propietario original
  const ownerUserRef = db.collection('users').doc(ownerUserId);
  await ownerUserRef.update({
    'profile.shops': admin.firestore.FieldValue.arrayRemove({ shop_id: shopId })
  });

  console.log('Tienda eliminada y referencia actualizada en el perfil del propietario.');

  return true;
}



// Validar que un shop pertenece a un usuario
async function verifyShopOwnership(userId, shopId, userRole) {
  console.log(`Verificando propiedad de la tienda: userId=${userId}, shopId=${shopId}, role=${userRole}`);
  
  const shop = await getShop(shopId);
  console.log('Datos de la tienda obtenidos desde Firestore:', shop);

  if (!shop) {
    console.log('Tienda no encontrada.');
    return false;
  }

  // Permitir a administradores realizar la acción
  if (userRole === 'admin') {
    console.log('Usuario con rol admin. Acceso permitido.');
    return true;
  }

  // Validación para usuarios normales
  console.log(`Propietario esperado: ${shop.ownerUserId}`);
  console.log(`Usuario autenticado: ${userId}`);
  return shop.ownerUserId === userId;
}



module.exports = { createShop, getShop, getUserShops, deleteShop, verifyShopOwnership };
