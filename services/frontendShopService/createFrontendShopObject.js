const { db } = require('../../firebase'); // Conexión a Firestore

async function createFrontendShopObject({ shopId, ownerUserId }) {
    console.log('[createFrontendShopObject] Iniciando construcción del objeto frontend_shops...');

    // Referencia principal a la colección de frontend_shops
    const frontendShopsCollectionRef = db.collection('frontend_shops');
    const userFrontendShopRef = frontendShopsCollectionRef.doc(ownerUserId);

    // Verificar si ya existe el frontend_shop para el usuario
    const frontendShopDoc = await userFrontendShopRef.get();

    if (!frontendShopDoc.exists) {
        console.log(`[createFrontendShopObject] frontend_shop para el usuario ${ownerUserId} no existe. Creando...`);

        // Crear el objeto inicial para el usuario
        const initialFrontendShop = {
            id: ownerUserId, // ID del frontend_shop basado en el usuario
            shopId, // Tienda asociada
            ownerUserId, // ID del propietario
            information: {
                name: '', // Se llenará posteriormente
                description: '', // Se llenará posteriormente
                last_sync_date: '', // Fecha de última sincronización
                site_url: '', // URL del sitio
                members: [] // Lista de miembros
            },
            stats: {}, // Para estadísticas futuras
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await userFrontendShopRef.set(initialFrontendShop);
    } else {
        console.log(`[createFrontendShopObject] frontend_shop ya existe para el usuario ${ownerUserId}.`);
    }

    // Continuar con la construcción de información
    await buildInformation({ shopId, ownerUserId });
}

// Función para construir la información básica
async function buildInformation({ shopId, ownerUserId }) {
    console.log(`[buildInformation] Construyendo información para la tienda ${shopId} y usuario ${ownerUserId}...`);

    const shopRef = db.collection('shops').doc(shopId);
    const shopDoc = await shopRef.get();

    if (!shopDoc.exists) {
        console.error(`[buildInformation] No se encontró la tienda ${shopId}.`);
        return;
    }

    const shopData = shopDoc.data();
    const userFrontendShopRef = db.collection('frontend_shops').doc(ownerUserId);

    // Actualizar la información básica en frontend_shops
    await userFrontendShopRef.update({
        'information.name': shopData.name || 'Sin nombre',
        'information.description': shopData.description || 'Sin descripción',
        'information.last_sync_date': shopData.last_sync_date || '',
        'information.site_url': shopData.site_url || '',
        'information.members': shopData.members || [],
        updatedAt: new Date().toISOString()
    });

    console.log(`[buildInformation] Información actualizada para la tienda ${shopId} y usuario ${ownerUserId}.`);
}

module.exports = { createFrontendShopObject };
