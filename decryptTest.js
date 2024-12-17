const crypto = require('crypto');

// Configuración de cifrado
const ALGORITHM = 'aes-256-gcm'; // Algoritmo
const ENCRYPTION_KEY = '0HOIsxxEKQ5Xr4/T9ZavvcAQ2iEUyv0kTbkkdppTs18='; 

function decrypt(data) {
  console.log("Cadena recibida para descifrado:", data);

  const parts = data.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid data format. Debe tener el formato IV:authTag:encryptedData');
  }

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'base64'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

try {
  // Cadena a descifrar
  const encryptedString = "1/Ih413XaWQGhAeodnMEWw==:1cC4aelySqoZr2fd8RL/zA==:pe62";
  const result = decrypt(encryptedString);

  console.log("Resultado descifrado:", result);
} catch (error) {
  console.error("Error al descifrar:", error.message);
}
