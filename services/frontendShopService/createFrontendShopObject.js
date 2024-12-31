const { db } = require('../../firebase'); // Conexión a Firestore
const { buildCategories } = require('./buildCategories');
const { buildTags } = require('./buildTags');


// Función principal
async function createFrontendShopObject({ shopId, ownerUserId }) {
  console.log('[createFrontendShopObject] Iniciando construcción del objeto frontend_shops...');

  // 1. Obtener la referencia al documento en 'frontend_shops'
  const userFrontendShopRef = getFrontendShopRef(shopId);

  // 2. Revisar si ya existe un documento 'frontend_shop' para este shopId
  const frontendShopExists = await checkFrontendShopExists(userFrontendShopRef);
  logFrontendShopStatus(shopId, frontendShopExists);

  // 3. Obtener datos de la tienda (para extraer site_url, etc.)
  const shopData = await getShopData(shopId);

  // 4. Obtener datos del usuario propietario (puede ser útil en el futuro)
  const ownerData = await getOwnerData(ownerUserId);

  // 5. Construir la lista de miembros enriquecida
  const members = await buildMembersList(shopId, ownerUserId);

    // 6. Armar el objeto final para guardar en 'frontend_shops'
    const updatedFrontendShop = buildFrontendShopObject({
        frontendShopExists,
        shopId,
        shopData,
        members,
        ownerData,
    });

    // 7. Guardar/actualizar el documento en Firestore
    await saveFrontendShopData(userFrontendShopRef, updatedFrontendShop);

    // 8. Construcción de categorías y tags
    await buildCategories({ shopId, userFrontendShopRef });
    await buildTags({ shopId, userFrontendShopRef });


  console.log(`[createFrontendShopObject] Datos actualizados para la tienda con shopId ${shopId}.`);
}

/* ==========================================================================
   Funciones auxiliares
   ========================================================================== */

// Obtener la referencia al documento de 'frontend_shops'
function getFrontendShopRef(shopId) {
  return db.collection('frontend_shops').doc(shopId);
}

// Verificar si existe un frontend_shop
async function checkFrontendShopExists(userFrontendShopRef) {
  const frontendShopDoc = await userFrontendShopRef.get();
  return frontendShopDoc.exists ? frontendShopDoc.data() : null;
}

// Registrar en consola si se machacarán o crearán datos
function logFrontendShopStatus(shopId, frontendShopExists) {
  if (frontendShopExists) {
    console.log(`[createFrontendShopObject] La tienda con shopId ${shopId} ya existe. Se machacarán todos los datos.`);
  } else {
    console.log(`[createFrontendShopObject] La tienda con shopId ${shopId} es nueva. Creando todos los datos.`);
  }
}

// Obtener los datos de la tienda (p.ej. para extraer site_url, etc.)
async function getShopData(shopId) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error(`[getShopData] No se encontró la tienda con ID ${shopId}.`);
  }

  return shopDoc.data(); // De aquí obtenemos site_url, name, etc.
}

// Obtener datos del propietario
async function getOwnerData(ownerUserId) {
  const ownerUserRef = db.collection('users').doc(ownerUserId);
  const ownerUserDoc = await ownerUserRef.get();

  if (!ownerUserDoc.exists) {
    throw new Error(`[createFrontendShopObject] No se encontró el usuario propietario con ID ${ownerUserId}.`);
  }

  return ownerUserDoc.data();
}

// Construir la lista de miembros enriquecida
async function buildMembersList(shopId, ownerUserId) {
  const shopRef = db.collection('shops').doc(shopId);
  const shopDoc = await shopRef.get();

  if (!shopDoc.exists) {
    throw new Error(`[buildMembersList] No se encontró la tienda ${shopId}.`);
  }

  const shopData = shopDoc.data();

  // Enriquecemos cada miembro con datos del usuario
  return Promise.all(
    shopData.members.map(async member => {
      const userRef = db.collection('users').doc(member.userId);
      const userDoc = await userRef.get();

      if (userDoc.exists) {
        const userData = userDoc.data();
        return {
          ...member,
          name: userData.profile?.name || 'Sin nombre',
          email: userData.profile?.email || 'Sin email',
          mainUser: member.userId === ownerUserId, // Determinar si es el usuario principal
        };
      }

      // Si no existe el usuario en 'users'
      return {
        ...member,
        name: 'Sin nombre',
        email: 'Sin email',
        mainUser: member.userId === ownerUserId,
      };
    })
  );
}

// Construir el objeto frontend_shop
function buildFrontendShopObject({
  frontendShopExists,
  shopId,
  shopData,
  members,
  ownerData,
}) {
  return {
    // Fecha de última sincronización (se actualiza siempre)
    last_sync_date: new Date().toISOString(),

    information: {
      // El ID de la tienda
      shopId,

      // Si existía un valor, lo mantenemos; si no, podemos tomar el de shopData o usar cadena vacía
      // (Si deseas siempre sobrescribir, usa shopData.name || '')
      name: frontendShopExists?.information?.name || '',

      description: frontendShopExists?.information?.description || '',

      // Aquí forzamos a que venga de la tienda, si existe
      site_url: shopData.site_url || '',

      members,
    },

    // Mantener estadísticas existentes si ya había un documento, sino un objeto vacío
    stats: frontendShopExists?.stats || {},

    // Mantener 'createdAt' si ya existía; si no, crearlo
    createdAt: frontendShopExists?.createdAt || new Date().toISOString(),

    // Siempre actualizar 'updatedAt'
    updatedAt: new Date().toISOString(),
  };
}

// Guardar el objeto frontend_shop en Firestore
async function saveFrontendShopData(userFrontendShopRef, updatedFrontendShop) {
  // Se usa merge:false para sobrescribir por completo (o "machacar") el documento
  await userFrontendShopRef.set(updatedFrontendShop, { merge: false });
}

/* ==========================================================================
   Exportar la función principal
   ========================================================================== */

module.exports = { createFrontendShopObject };
