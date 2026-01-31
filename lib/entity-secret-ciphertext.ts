import dotenv from 'dotenv';
const forge = require('node-forge');

dotenv.config();

const ENTITY_SECRET = process.env.ENTITY_SECRET;
const ENTITY_PUBLIC_KEY = process.env.ENTITY_PUBLIC_KEY;

export async function getEntitySecretCiphertext() {
  const forge = await import('node-forge');
  const publicKeyString = ENTITY_PUBLIC_KEY;
  const hexEncodedEntitySecret = ENTITY_SECRET;
  const entitySecret = forge.util.hexToBytes(hexEncodedEntitySecret);
  if (entitySecret.length !== 32) throw new Error('invalid entity secret');
  const publicKey = forge.pki.publicKeyFromPem(publicKeyString);
  const encryptedData = publicKey.encrypt(entitySecret, 'RSA-OAEP', {
    md: forge.md.sha256.create(),
    mgf1: { md: forge.md.sha256.create() },
  });
  return forge.util.encode64(encryptedData);
}
