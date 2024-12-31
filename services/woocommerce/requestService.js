const axios = require('axios');

async function makeWooCommerceRequest({ method, url, headers, data }) {
  try {
    console.log('Solicitud a enviar:');
    console.log('Método:', method);
    console.log('URL:', url);
    console.log('Headers:', headers);
    if (data) {
      console.log('Datos:', data);
    }

    const response = await axios({
      method,
      url,
      headers,
      data,
    });
    return response.data;
  } catch (error) {
    console.error(`Error en la solicitud WooCommerce [${method}] ${url}:`, error.message);
    if (error.response) {
      console.error('Detalles de la respuesta:', error.response.data);
    }
    throw error;
  }
}

module.exports = { makeWooCommerceRequest };
