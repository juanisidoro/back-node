const bcrypt = require('bcrypt');
const { db } = require('../firebase');

async function createDefaultAdmin(adminConfig) {
  const adminRef = db.collection('users').where('role', '==', 'admin');
  const adminSnapshot = await adminRef.get();

  if (adminSnapshot.empty) {
    console.log('No hay usuarios administradores, creando uno por defecto...');
    const hashedPassword = await bcrypt.hash(adminConfig.password, 10);

    await db.collection('users').add({
      name: adminConfig.name,
      email: adminConfig.email,
      password: hashedPassword,
      role: 'admin',
      site_url: null,
      api_key: null,
      api_secret: null,
      registration_date: new Date().toISOString(),
    });

    console.log(
      `Usuario administrador creado con éxito: ${adminConfig.email} | Contraseña: ${adminConfig.password}`
    );
  } else {
    console.log('Ya existe un administrador en el sistema.');
  }
}

module.exports = { createDefaultAdmin };
