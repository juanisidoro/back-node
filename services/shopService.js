const { db } = require('../firebase');
const { encrypt } = require('../utils/cryptoUtil');

async function createShop({ userId, site_url, basic_auth_username, basic_auth_password }) {
  // Encriptar credenciales
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

  const shopRef = await db.collection('shops').add(shopData);
  const shopId = shopRef.id;

  // Actualizar el usuario con el nuevo shop_id
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    'profile.shops': db.FieldValue.arrayUnion({ shop_id: shopId })
  });

  return shopId;
}

async function getShop(shopId) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();
  if (!shopDoc.exists) return null;
  return { id: shopDoc.id, ...shopDoc.data() };
}

// Validar que un shop pertenece a un usuario
async function verifyShopOwnership(userId, shopId) {
  const shop = await getShop(shopId);
  if (!shop) return false;
  return shop.ownerUserId === userId;
}

module.exports = { createShop, getShop, verifyShopOwnership };
