// utils/cryptoService.js
const crypto = require('crypto');
const config = require('../config');

const algorithm = 'aes-256-cbc';
const secretKey = config.ENCRYPTION_KEY; // Should be 32 bytes
const iv = crypto.randomBytes(16); // Initialization vector

module.exports = {
  encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
      iv: iv.toString('hex'),
      content: encrypted
    };
  },

  decrypt(hash) {
    const decipher = crypto.createDecipheriv(
      algorithm, 
      secretKey, 
      Buffer.from(hash.iv, 'hex')
    );
    let decrypted = decipher.update(hash.content, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }
};