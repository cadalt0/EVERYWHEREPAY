// hash-api-key.js
// Usage: node hash-api-key.js <your-api-key>
import { createHash } from 'crypto';

const [,, apiKey] = process.argv;

if (!apiKey) {
  console.error('Usage: node hash-api-key.js <your-api-key>');
  process.exit(1);
}

const hash = createHash('sha256').update(apiKey).digest('hex');
console.log('Input value:', apiKey);
console.log('SHA-256 hash:', hash);
