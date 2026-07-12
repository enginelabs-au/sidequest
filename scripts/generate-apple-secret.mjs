#!/usr/bin/env node
/**
 * Generate Apple OAuth Client Secret (JWT) for Supabase Apple provider.
 * Per https://supabase.com/docs/guides/auth/social-login/auth-apple
 *
 * Usage: node scripts/generate-apple-secret.mjs [services-id]
 * Default services-id: au.enginelabs.sidequest.web
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv(file) {
  const env = {};
  if (!fs.existsSync(file)) return env;
  const text = fs.readFileSync(file, 'utf8');
  let key = null;
  let val = [];
  const flush = () => {
    if (key) env[key] = val.join('\n').trim();
    key = null;
    val = [];
  };
  for (const line of text.split('\n')) {
    if (line.startsWith('#') || !line.trim()) continue;
    if (line.startsWith('APPLE_AUTH_KEY=')) {
      flush();
      key = 'APPLE_AUTH_KEY';
      val = [line.slice('APPLE_AUTH_KEY='.length)];
      continue;
    }
    if (key === 'APPLE_AUTH_KEY') {
      val.push(line);
      if (line.includes('-----END PRIVATE KEY-----')) continue;
      continue;
    }
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      flush();
      key = m[1];
      val = [m[2]];
    }
  }
  flush();
  return env;
}

function base64urlJson(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function signEs256(privateKeyPem, signingInput) {
  const sign = crypto.createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  const derSig = sign.sign(privateKeyPem);
  // Convert DER ECDSA signature to JOSE raw r||s (64 bytes for P-256)
  const rLen = derSig[3];
  let r = derSig.slice(4, 4 + rLen);
  let s = derSig.slice(4 + rLen + 2);
  if (r.length > 32) r = r.slice(r.length - 32);
  if (s.length > 32) s = s.slice(s.length - 32);
  if (r.length < 32) r = Buffer.concat([Buffer.alloc(32 - r.length), r]);
  if (s.length < 32) s = Buffer.concat([Buffer.alloc(32 - s.length), s]);
  return Buffer.concat([r, s]).toString('base64url');
}

const env = loadEnv(path.join(__dirname, '..', '.env'));
const teamId = env.APPLE_TEAM_ID;
const keyId = env.APPLE_AUTH_KEY_ID;
const privateKey = env.APPLE_AUTH_KEY;
const servicesId = process.argv[2] || env.APPLE_SERVICES_CLIENT_ID || 'au.enginelabs.sidequest.web';

const missing = [];
if (!teamId) missing.push('APPLE_TEAM_ID');
if (!keyId) missing.push('APPLE_AUTH_KEY_ID');
if (!privateKey?.includes('BEGIN PRIVATE KEY')) missing.push('APPLE_AUTH_KEY');

if (missing.length) {
  console.error(`FAIL: missing in .env: ${missing.join(', ')}`);
  process.exit(1);
}

const now = Math.floor(Date.now() / 1000);
// Apple max client secret lifetime ~6 months (15777000s)
const exp = now + 15777000;

const header = { alg: 'ES256', kid: keyId };
const payload = {
  iss: teamId,
  iat: now,
  exp,
  aud: 'https://appleid.apple.com',
  sub: servicesId,
};

const signingInput = `${base64urlJson(header)}.${base64urlJson(payload)}`;
let jwt;
try {
  jwt = `${signingInput}.${signEs256(privateKey, signingInput)}`;
} catch (e) {
  console.error('FAIL: could not sign JWT — check APPLE_AUTH_KEY PEM format');
  console.error(e.message);
  process.exit(1);
}

console.log('=== Apple Client Secret (JWT) ===');
console.log('');
console.log('Paste this into Supabase → Authentication → Providers → Apple → Secret Key:');
console.log('');
console.log(jwt);
console.log('');
console.log(`Services ID (Client IDs): ${servicesId}`);
console.log(`Valid until: ${new Date(exp * 1000).toISOString().slice(0, 10)} (~6 months)`);
console.log('');
console.log('NOT your Supabase anon key. NOT your .p8 private key.');
