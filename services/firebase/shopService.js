const { db } = require('../../firebase');
const { decrypt } = require('../../utils/cryptoUtil');


async function getShopAndOwnerByOrigin(origin) {
    try {
      // Normalizar el origin
      if (!origin.startsWith('https://')) {
        throw new Error(`El origin debe comenzar con 'https://'. Origin proporcionado: ${origin}`);
      }
  
      if (!origin.endsWith('/')) {
        origin = `${origin}/`;
      }
  
      const shopsSnapshot = await db.collection('shops').get();
  
      for (const shopDoc of shopsSnapshot.docs) {
        const shopData = shopDoc.data();
  
        // Verificar si el site_url coincide con el origin
        if (shopData.site_url === origin) {
          const shopId = shopDoc.id;
  
          // Buscar el miembro que es dueño (isOwner: true)
          const owner = shopData.members.find(member => member.isOwner);
  
          if (owner && owner.userId) {
            return {
              shopId,
              userId: owner.userId,
            };
          } else {
            throw new Error(`No se encontró un propietario en la tienda con origin: ${origin}`);
          }
        }
      }
  
      throw new Error(`No se encontró ninguna tienda con el origin: ${origin}`);
    } catch (error) {
      console.error(`Error al buscar el shopId y userId para origin ${origin}:`, error.message);
      throw error;
    }
  }
  

  async function getShopCredentials(shopId) {
    try {
      const shopDoc = await db.collection('shops').doc(shopId).get();
  
      if (!shopDoc.exists) {
        throw new Error(`No se encontró la tienda con shopId: ${shopId}`);
      }
  
      const shopData = shopDoc.data();
      const basic_auth_username = decrypt(shopData.basic_auth_username);
      const basic_auth_password = decrypt(shopData.basic_auth_password); // Desencriptar contraseña
      const site_url = shopData.site_url;
  
      if (!basic_auth_username || !basic_auth_password || !site_url) {
        throw new Error(`Credenciales o URL incompletas para la tienda con shopId: ${shopId}`);
      }
  
      return { basic_auth_username, basic_auth_password, site_url };
    } catch (error) {
      console.error(`Error obteniendo credenciales de la tienda con shopId ${shopId}:`, error.message);
      throw error;
    }
  }

module.exports = { getShopAndOwnerByOrigin, getShopCredentials  };
