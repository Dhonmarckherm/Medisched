#!/usr/bin/env node
/**
 * License Key Generator for MEDISCHED CERT
 * Run: node scripts/generate-license.cjs
 */
const crypto = require('crypto');

function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    const segment = crypto.randomBytes(2).toString('hex').toUpperCase();
    segments.push(segment);
  }
  return `MSCHED-${segments.join('-')}`;
}

const key = generateLicenseKey();

console.log('========================================');
console.log('  MEDISCHED CERT - License Key Generator');
console.log('========================================');
console.log('');
console.log('Your License Key:');
console.log('');
console.log(`  ${key}`);
console.log('');
console.log('========================================');
console.log('');
console.log('IMPORTANT: Save this key somewhere safe!');
console.log('');
console.log('Add this to your Vercel Environment Variables:');
console.log(`  LICENSE_KEY=${key}`);
console.log('');
console.log('Give this key to your client ONLY when they pay.');
console.log('========================================');
