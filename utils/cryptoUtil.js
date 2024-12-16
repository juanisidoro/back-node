const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm'; // Ejemplo, un algoritmo con autenticación
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Debe ser de 32 bytes
const IV_LENGTH = 16; // Longitud del IV

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'base64'), iv);

  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  
  const authTag = cipher.getAuthTag().toString('base64');
  const ivStr = iv.toString('base64');

  return `${ivStr}:${authTag}:${encrypted}`;
}

function decrypt(data) {
  const parts = data.split(':');
  if (parts.length !== 3) throw new Error('Invalid data format');

  const iv = Buffer.from(parts[0], 'base64');
  const authTag = Buffer.from(parts[1], 'base64');
  const encryptedText = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'base64'), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

module.exports = { encrypt, decrypt };
