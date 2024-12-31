const { db } = require('../../firebase');

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
  

module.exports = { getShopAndOwnerByOrigin };
