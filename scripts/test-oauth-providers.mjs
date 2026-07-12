#!/usr/bin/env node
/**
 * Verify native auth configuration (Google/Apple env + Supabase providers).
 * Does not complete sign-in (requires device).
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function googleIosUrlScheme(iosClientId) {
  if (!iosClientId?.trim()) return undefined;
  const match = iosClientId.trim().match(/^([\w-]+)\.apps\.googleusercontent\.com$/);
  return match ? `com.googleusercontent.apps.${match[1]}` : undefined;
}

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
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !line.includes('-----BEGIN')) {
      flush();
      key = m[1];
      val = [m[2]];
    } else if (key === 'APPLE_AUTH_KEY') {
      val.push(line);
    } else if (key) {
      val.push(line);
    }
  }
  flush();
  return env;
}

const root = path.join(__dirname, '..');
const env = loadEnv(path.join(root, '.env'));
const url = env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const googleWeb = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
const googleIos = env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();
const iosScheme = googleIosUrlScheme(googleIos);

if (!url || !anonKey) {
  console.error('FAIL: missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

let fail = 0;

console.log('=== Native auth configuration ===\n');

if (!googleWeb) {
  console.log('FAIL: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID missing (required for Google native sign-in)');
  fail++;
} else {
  console.log(`OK: Google Web client ID set (${googleWeb.slice(0, 12)}…)`);
}

if (!googleIos) {
  console.log('WARN: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID missing — required for iOS Google Sign-In builds');
} else if (!iosScheme) {
  console.log('FAIL: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID format invalid');
  fail++;
} else {
  console.log(`OK: Google iOS client ID set; iosUrlScheme=${iosScheme}`);
}

const supabase = createClient(url, anonKey);

async function probeProvider(provider) {
  const { error } = await supabase.auth.signInWithIdToken({
    provider,
    token: 'invalid-token-for-probe',
  });
  if (!error) return { ok: false, error: 'unexpected success with invalid token' };
  const msg = error.message.toLowerCase();
  if (msg.includes('invalid') || msg.includes('jwt') || msg.includes('token')) {
    return { ok: true };
  }
  if (msg.includes('provider') && msg.includes('disabled')) {
    return { ok: false, error: `${provider} provider disabled in Supabase Dashboard` };
  }
  return { ok: true, note: error.message };
}

(async () => {
  for (const provider of ['google', 'apple']) {
    const result = await probeProvider(provider);
    if (!result.ok) {
      console.log(`FAIL: ${provider} — ${result.error}`);
      fail++;
    } else {
      console.log(`OK: ${provider} provider reachable in Supabase${result.note ? ` (${result.note})` : ''}`);
    }
  }

  console.log('');
  if (fail > 0) {
    console.log(`Result: FAILED (${fail} check(s))`);
    process.exit(1);
  }
  console.log('Result: Native auth config looks good — test sign-in on a dev build (not Expo Go)');
})();
