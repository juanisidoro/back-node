const { db } = require('../../firebase');

// Función principal que coordina las subfunciones
async function buildTags({ shopId, userFrontendShopRef }) {
    //console.log(`[buildTags] Iniciando la construcción de tags para la tienda ${shopId}...`);

    // 1. Obtener los tags desde Firestore
    const tagsData = await fetchTagsByShopId(shopId);

    // 2. Transformar los tags al formato necesario
    const tagsForFrontend = transformTagsForFrontend(tagsData);

    // 3. Guardar los tags en la base de datos frontend_shops
    await saveTagsToFrontendShop(userFrontendShopRef, tagsForFrontend);

    //console.log(`[buildTags] Tags procesados y guardados para la tienda ${shopId}.`);
}

// Subfunción 1: Obtener los tags desde Firestore filtrando por shopId en el ID
async function fetchTagsByShopId(shopId) {
    //console.log(`[fetchTagsByShopId] Obteniendo tags para la tienda ${shopId} filtrando por prefijo en los IDs...`);

    // Recuperar todos los tags (Firestore no permite filtrar por prefijo directamente)
    const tagsSnapshot = await db.collection('tags').get();

    // Filtrar localmente los tags cuyo ID empiece con el `shopId`
    const tags = tagsSnapshot.docs
        .filter(doc => doc.id.startsWith(`${shopId}-`))
        .map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

    //console.log(`[fetchTagsByShopId] Tags filtrados:`, tags);

    return tags;
}

// Subfunción 2: Transformar los tags para el frontend
function transformTagsForFrontend(tagsData) {
    //console.log('[transformTagsForFrontend] Transformando tags para el frontend...');

    const transformedTags = tagsData.map(tag => ({
        id: tag.id,
        name: tag.name || 'Sin nombre',
        slug: tag.slug || '',
    }));

    //console.log('[transformTagsForFrontend] Tags transformados:', transformedTags);

    return transformedTags;
}

// Subfunción 3: Guardar los tags en frontend_shops
async function saveTagsToFrontendShop(userFrontendShopRef, tags) {
    //console.log('[saveTagsToFrontendShop] Guardando tags en frontend_shops...');

    await userFrontendShopRef.update({
        tags,
        updatedAt: new Date().toISOString(),
    });

    console.log('[saveTagsToFrontendShop] Tags guardados correctamente.');
}

module.exports = { buildTags };
