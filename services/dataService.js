// 4. Backend: dataService.js
const { firestore } = require("../firebase");

async function SaveDataShopObjectInDatabase(data) {
  const { shop_id, products, product_variations, attributes, attributes_terms, categories, tags } = data;

  await SaveProductsInFirebaseDB(shop_id, products);
  await SaveProductVariationsInFirebaseDB(shop_id, product_variations);
  await SaveProductAttributesInFirebaseDB(shop_id, attributes);
  await SaveProductAttributesTermsInFirebaseDB(shop_id, attributes_terms);
  await SaveProductCategoriesInFirebaseDB(shop_id, categories);
  await SaveProductTagsInFirebaseDB(shop_id, tags);
}

async function SaveProductsInFirebaseDB(shop_id, products) {
  const batch = firestore.batch();
  products.forEach((product) => {
    const docRef = firestore.collection("products").doc(`${shop_id}-${product.id}`);
    batch.set(docRef, product);
  });
  await batch.commit();
}

async function SaveProductVariationsInFirebaseDB(shop_id, product_variations) {
  const batch = firestore.batch();
  product_variations.forEach((variation) => {
    const docRef = firestore.collection("product_variations").doc(`${shop_id}-${variation.id}`);
    batch.set(docRef, variation);
  });
  await batch.commit();
}

async function SaveProductAttributesInFirebaseDB(shop_id, attributes) {
  const batch = firestore.batch();
  attributes.forEach((attribute) => {
    const docRef = firestore.collection("product_attributes").doc(`${shop_id}-${attribute.id}`);
    batch.set(docRef, attribute);
  });
  await batch.commit();
}

async function SaveProductAttributesTermsInFirebaseDB(shop_id, attributes_terms) {
  const batch = firestore.batch();
  attributes_terms.forEach((term) => {
    const docRef = firestore.collection("product_attributes_terms").doc(`${shop_id}-${term.id}`);
    batch.set(docRef, term);
  });
  await batch.commit();
}

async function SaveProductCategoriesInFirebaseDB(shop_id, categories) {
  const batch = firestore.batch();
  categories.forEach((category) => {
    const docRef = firestore.collection("product_categories").doc(`${shop_id}-${category.id}`);
    batch.set(docRef, category);
  });
  await batch.commit();
}

async function SaveProductTagsInFirebaseDB(shop_id, tags) {
  const batch = firestore.batch();
  tags.forEach((tag) => {
    const docRef = firestore.collection("product_tags").doc(`${shop_id}-${tag.id}`);
    batch.set(docRef, tag);
  });
  await batch.commit();
}

module.exports = {
  SaveDataShopObjectInDatabase,
};
