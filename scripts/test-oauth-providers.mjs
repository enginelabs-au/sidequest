#!/usr/bin/env node
/**
 * Probe Supabase OAuth providers — verifies Google/Apple return authorize URLs.
 * Does not complete sign-in (requires browser/device).
 */
import { createClient } from '@supabase/supabase-js';
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
const redirectTo = `${env.EXPO_PUBLIC_APP_SCHEME || 'sidequest'}://auth/callback`;

if (!url || !anonKey) {
  console.error('FAIL: missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, anonKey);

async function probe(provider) {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  if (!data?.url) {
    return { ok: false, error: 'No authorize URL returned' };
  }
  let parsed;
  try {
    parsed = new URL(data.url);
  } catch {
    return { ok: false, error: 'Invalid authorize URL' };
  }
  return { ok: true, host: parsed.host, url: data.url };
}

(async () => {
  console.log('=== OAuth provider probe ===');
  console.log(`redirectTo: ${redirectTo}`);
  console.log('');

  let fail = 0;

  for (const provider of ['google', 'apple']) {
    const result = await probe(provider);
    if (!result.ok) {
      console.log(`FAIL: ${provider} — ${result.error}`);
      fail++;
      continue;
    }
    console.log(`OK: ${provider} Supabase authorize URL generated`);

    const res = await fetch(result.url, { redirect: 'manual' });
    const loc = res.headers.get('location') || '';
    if (res.status === 400) {
      const body = await res.text();
      let msg = body;
      try {
        msg = JSON.parse(body).msg || body;
      } catch {}
      console.log(`FAIL: ${provider} — Supabase rejected authorize: ${msg}`);
      fail++;
      continue;
    }
    if (res.status >= 300 && res.status < 400 && loc) {
      const host = new URL(loc).host;
      console.log(`OK: ${provider} redirects to ${host}`);
      if (provider === 'google' && host.includes('google')) {
        const cid = new URL(loc).searchParams.get('client_id');
        if (cid?.includes('googleusercontent.com')) {
          console.log(`OK: ${provider} client_id configured`);
        }
      }
      if (provider === 'apple' && host.includes('apple')) {
        const cid = new URL(loc).searchParams.get('client_id');
        if (cid) console.log(`OK: ${provider} client_id — ${cid}`);
      }
    } else {
      console.log(`WARN: ${provider} unexpected authorize response HTTP ${res.status}`);
    }
    console.log('');
  }

  if (fail > 0) {
    console.log(`Result: FAILED (${fail} provider(s))`);
    process.exit(1);
  }
  console.log('Result: OAuth providers configured — authorize URLs generated');
  console.log('Note: Full sign-in requires device/simulator browser flow (npm start)');
})();
