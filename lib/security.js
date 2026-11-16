const { randomBytes, scrypt, timingSafeEqual, createHash } = require('node:crypto');
const { promisify } = require('node:util');

const derive = promisify(scrypt);
const tokenHash = token => createHash('sha256').update(token).digest('hex');

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64);
  return salt + '.' + key.toString('hex');
}

async function matches(password, stored) {
  const [salt, hex] = stored.split('.');
  const key = await derive(password, salt, 64);
  return timingSafeEqual(key, Buffer.from(hex, 'hex'));
}
module.exports = { hashPassword, matches, tokenHash };
