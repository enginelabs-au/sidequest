#!/usr/bin/env bash
# Patch Supabase Auth for native Apple + Google (requires Management API token).
# Usage: SUPABASE_ACCESS_TOKEN=... bash scripts/patch-supabase-native-auth.sh
set -euo pipefail

PROJECT_REF="${SUPABASE_PROJECT_REF:-xzfxkybnjzlpguespkco}"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  if command -v security >/dev/null 2>&1; then
    RAW="$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null || true)"
    if [[ "$RAW" == go-keyring-base64:* ]]; then
      TOKEN="$(printf '%s' "${RAW#go-keyring-base64:}" | base64 -d 2>/dev/null || true)"
    elif [[ -n "$RAW" ]]; then
      TOKEN="$RAW"
    fi
  fi
fi

if [[ -z "$TOKEN" ]]; then
  echo "Need SUPABASE_ACCESS_TOKEN (from https://supabase.com/dashboard/account/tokens after: supabase login)"
  echo "Usage: SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/patch-supabase-native-auth.sh"
  exit 1
fi

# Load .env for known IDs
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^(EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID|EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID|APPLE_SERVICES_CLIENT_ID)=' "$ROOT/.env" | sed 's/\r$//')
  set +a
fi

WEB_ID="${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-}"
IOS_ID="${EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:-}"
APPLE_BUNDLE="au.enginelabs.sidequest"
APPLE_SERVICES="${APPLE_SERVICES_CLIENT_ID:-au.enginelabs.sidequest.web}"
APPLE_CLIENT_IDS="${APPLE_BUNDLE},${APPLE_SERVICES}"

if [[ -z "$WEB_ID" ]]; then
  echo "FAIL: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID missing in .env"
  exit 1
fi

GOOGLE_AUTH_IDS="$WEB_ID"
if [[ -n "$IOS_ID" ]]; then
  GOOGLE_AUTH_IDS="$WEB_ID,$IOS_ID"
else
  echo "WARN: EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID not set — Google iOS native will fail until added"
fi

echo "Patching project $PROJECT_REF ..."
echo "  Apple Client IDs → $APPLE_CLIENT_IDS"
echo "  Google Authorized Client IDs → $GOOGLE_AUTH_IDS"

# Fetch current auth config (preserve secrets)
CURRENT=$(curl -sS "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${TOKEN}")

APPLE_SECRET=$(echo "$CURRENT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.external_apple_secret||'')}catch{}})")
GOOGLE_SECRET=$(echo "$CURRENT" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{const j=JSON.parse(d);console.log(j.external_google_secret||'')}catch{}})")

BODY=$(node -e "
const appleSecret = process.argv[1];
const googleSecret = process.argv[2];
console.log(JSON.stringify({
  external_apple_enabled: true,
  external_apple_client_id: process.env.APPLE_CLIENT_IDS,
  ...(appleSecret ? { external_apple_secret: appleSecret } : {}),
  external_google_enabled: true,
  external_google_client_id: process.env.WEB_ID,
  external_google_authorized_client_ids: process.env.GOOGLE_AUTH_IDS,
  external_google_skip_nonce_check: true,
  ...(googleSecret ? { external_google_secret: googleSecret } : {}),
}));
" "$APPLE_SECRET" "$GOOGLE_SECRET")

APPLE_CLIENT_IDS="$APPLE_CLIENT_IDS" WEB_ID="$WEB_ID" GOOGLE_AUTH_IDS="$GOOGLE_AUTH_IDS" \
  curl -sS -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$BODY" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try {
    const j=JSON.parse(d);
    if (j.message) { console.error('FAIL:', j.message); process.exit(1); }
    console.log('OK: Supabase native auth config updated');
    console.log('  Apple client_id:', j.external_apple_client_id);
    console.log('  Google authorized:', j.external_google_authorized_client_ids || j.external_google_client_id);
  } catch (e) { console.log(d); }
})"
