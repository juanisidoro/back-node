// services/ecommerceActionHandler.js
const { getShopCredentials } = require('../services/firebase/shopService');
const { generateWooCommerceHeaders } = require('../services/woocommerce/authService');
const { makeWooCommerceRequest } = require('../services/woocommerce/requestService');
const { updateProductInFirestore } = require('../services/firebase/productService');

async function handlerActionWoo(notification) {
  const { type, payload, resource } = notification;

  if (!payload || !payload.origin || !payload.object_id) {
    throw new Error('La notificación convertida no contiene las propiedades necesarias para procesar.');
  }

  console.log(`Generando petición a ${payload.origin}, para obtener el ${payload.object_id}`);

  if (type === 'product.updated') {
    try {
      // Obtener credenciales de la tienda desde Firebase
      const { site_url, basic_auth_username, basic_auth_password } = await getShopCredentials(resource.shopId);

      // Generar headers de autenticación para WooCommerce
      const headers = generateWooCommerceHeaders(basic_auth_username, basic_auth_password);

      // Hacer solicitud GET al endpoint de WooCommerce
      const productData = await makeWooCommerceRequest({
        method: 'GET',
        url: `${site_url}/wp-json/wc/v3/products/${payload.object_id}`,
        headers,
      });

      // Mostrar el objeto obtenido
      console.log('Producto obtenido de WooCommerce correctamente:', productData);

      // Actualizar el producto en Firestore
      await updateProductInFirestore(resource.shopId, payload.object_id, productData);
    } catch (error) {
      console.error('Error procesando product.updated:', error.message);
    }
  }
}

module.exports = { handlerActionWoo };
