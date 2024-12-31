const { db } = require('../../firebase');

// Función principal que coordina las subfunciones
async function buildCategories({ shopId, userFrontendShopRef }) {
    //console.log(`[buildCategories] Iniciando la construcción de categorías para la tienda ${shopId}...`);

    // 1. Obtener las categorías desde Firestore filtrando por prefijo del ID
    const categoriesData = await fetchCategoriesByShopId(shopId);

    // 2. Transformar las categorías al formato necesario
    const categoriesForFrontend = transformCategoriesForFrontend(categoriesData);

    // 3. Guardar las categorías en la base de datos frontend_shops
    await saveCategoriesToFrontendShop(userFrontendShopRef, categoriesForFrontend);

    //console.log(`[buildCategories] Categorías procesadas y guardadas para la tienda ${shopId}.`);
}

// Subfunción 1: Obtener las categorías desde Firestore filtrando por shopId en el ID
async function fetchCategoriesByShopId(shopId) {
   // console.log(`[fetchCategoriesByShopId] Obteniendo categorías para la tienda ${shopId} filtrando por prefijo en los IDs...`);

    // Recuperar todas las categorías (Firestore no permite filtrar por prefijo directamente)
    const categoriesSnapshot = await db.collection('categories').get();

    // Filtrar localmente las categorías cuyo ID empiece con el `shopId`
    const categories = categoriesSnapshot.docs
        .filter(doc => doc.id.startsWith(`${shopId}-`))
        .map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));

    //console.log(`[fetchCategoriesByShopId] Categorías filtradas:`, categories);

    return categories;
}

// Subfunción 2: Transformar las categorías para el frontend
function transformCategoriesForFrontend(categoriesData) {
   // console.log('[transformCategoriesForFrontend] Transformando categorías para el frontend...');

    const transformedCategories = categoriesData.map(category => ({
        id: category.id,
        name: category.name || 'Sin nombre',
        slug: category.slug || '',
    }));

   // console.log('[transformCategoriesForFrontend] Categorías transformadas:', transformedCategories);

    return transformedCategories;
}

// Subfunción 3: Guardar las categorías en frontend_shops
async function saveCategoriesToFrontendShop(userFrontendShopRef, categories) {
   // console.log('[saveCategoriesToFrontendShop] Guardando categorías en frontend_shops...');

    await userFrontendShopRef.update({
        categories,
        updatedAt: new Date().toISOString(),
    });

    console.log('[saveCategoriesToFrontendShop] Categorías guardadas correctamente.');
}

module.exports = { buildCategories };
