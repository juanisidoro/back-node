const { db } = require('../firebase');
const { encrypt } = require('../utils/cryptoUtil');
const admin = require('firebase-admin');

// Crear una tienda
async function createShop({ site_url, basic_auth_username, basic_auth_password }) {
  const encryptedUsername = basic_auth_username ? encrypt(basic_auth_username) : null;
  const encryptedPassword = basic_auth_password ? encrypt(basic_auth_password) : null;

  const shopData = {
    site_url,
    basic_auth_username: encryptedUsername,
    basic_auth_password: encryptedPassword,
    last_sync_date: null,
    last_sync_success: false,
    sync_status: 'idle',
    members: []
  };

  // Crear la tienda y obtener el ID
  const shopRef = await db.collection('shops').add(shopData);
  return shopRef.id;
}


// Obtener una tienda específica
async function getShop(shopId) {
  try {
    const shopRef = db.collection('shops').doc(shopId);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
      console.error(`Tienda con ID ${shopId} no encontrada.`);
      return null;
    }

    return { id: shopDoc.id, ...shopDoc.data() };
  } catch (error) {
    console.error(`Error al obtener la tienda con ID ${shopId}:`, error);
    throw new Error('Error al acceder a la tienda.');
  }
}


// Obtener todas las tiendas de un usuario
async function getUserShops(userId) {
  const shopsSnapshot = await db.collection('shops').where('ownerUserId', '==', userId).get();
  return shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Obtener todas las tiendas de todos los usuarios
async function getAllShops() {
  const shopsSnapshot = await db.collection('shops').get();
  return shopsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Eliminar una tienda solo si no tiene usuarios asignados
async function deleteShopWithNoMembers(shopId) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    console.log('Tienda no encontrada:', shopId);
    throw new Error('La tienda especificada no existe.');
  }

  const shopData = shopDoc.data();

  // Verificar si la tienda tiene usuarios asignados
  if (shopData.members && shopData.members.length > 0) {
    console.log('La tienda tiene usuarios asignados:', shopData.members);
    return false; // No eliminar si hay usuarios
  }

  // Eliminar la tienda de la colección 'shops'
  await shopRef.delete();

  console.log('Tienda eliminada de la colección shops:', shopId);

  // Actualizar las referencias en la colección 'users'
  const usersRef = db.collection('users');
  const usersSnapshot = await usersRef.where('profile.shops', 'array-contains', { shop_id: shopId }).get();

  const batch = db.batch();
  usersSnapshot.forEach(userDoc => {
    const userRef = usersRef.doc(userDoc.id);
    batch.update(userRef, {
      'profile.shops': admin.firestore.FieldValue.arrayRemove({ shop_id: shopId }),
    });
  });

  await batch.commit();

  console.log('Referencias a la tienda eliminadas de los usuarios:', shopId);

  return true; // Eliminación exitosa
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



module.exports = { createShop, getShop, getAllShops, getUserShops, deleteShopWithNoMembers, verifyShopOwnership };
