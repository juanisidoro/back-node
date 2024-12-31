const { db } = require('../../firebase');

async function updateProductInFirestore(shopId, productId, productData) {
  try {
    // Referencia al documento del producto en Firestore
    const productRef = db.collection('products').doc(`${shopId}-${productId}`);

    // Actualizar (o sustituir) los datos del producto
    await productRef.set(productData);

    console.log(`Producto con ID ${productId} para la tienda ${shopId} actualizado en Firestore.`);
  } catch (error) {
    console.error(`Error actualizando el producto con ID ${productId} en Firestore:`, error.message);
    throw error;
  }
}

module.exports = { updateProductInFirestore };
