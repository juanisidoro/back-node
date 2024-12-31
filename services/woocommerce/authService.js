function generateWooCommerceHeaders(username, password) {
  const auth = Buffer.from(`${username}:${password}`).toString('base64');

  // Log para verificar la decodificación
  console.log('Credenciales decodificadas:');
  console.log('Username:', username);
  console.log('Password:', password);
  console.log('Authorization:', `Bearer ${auth}`);

  return {
    Authorization: `Basic ${auth}`,
    'Content-Type': 'application/json',
  };
}

module.exports = { generateWooCommerceHeaders };
