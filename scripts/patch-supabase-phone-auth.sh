#!/usr/bin/env bash
# Enable Supabase Phone + Twilio SMS for OTP (Management API).
# Usage: SUPABASE_ACCESS_TOKEN=... bash scripts/patch-supabase-phone-auth.sh
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
  echo "Need SUPABASE_ACCESS_TOKEN (https://supabase.com/dashboard/account/tokens)"
  echo "Usage: SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/patch-supabase-phone-auth.sh"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/load-dotenv.sh"
load_dotenv "$ROOT/.env"

SID="${TWILIO_ACCOUNT_SID:-}"
AUTH="${TWILIO_AUTH_TOKEN:-}"
MSG="${TWILIO_MESSAGING_SERVICE_SID:-}"

for var in SID AUTH MSG; do
  if [[ -z "${!var}" ]]; then
    echo "FAIL: TWILIO_* missing in .env (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID)"
    exit 1
  fi
done

if [[ "$MSG" == PN* ]]; then
  echo "FAIL: TWILIO_MESSAGING_SERVICE_SID must be Messaging Service MG… not phone PN…"
  exit 1
fi

echo "Patching project $PROJECT_REF — Phone + Twilio…"

BODY="$(SID="$SID" AUTH="$AUTH" MSG="$MSG" node -e "
console.log(JSON.stringify({
  external_phone_enabled: true,
  sms_provider: 'twilio',
  sms_twilio_account_sid: process.env.SID,
  sms_twilio_auth_token: process.env.AUTH,
  sms_twilio_message_service_sid: process.env.MSG,
  sms_autoconfirm: true,
  sms_template: 'Side Quest: Your code is {{ .Code }}',
}));
")"

curl -sS -X PATCH "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$BODY" | node -e "
let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{
  try {
    const j=JSON.parse(d);
    if (j.message) { console.error('FAIL:', j.message); process.exit(1); }
    console.log('OK: Phone provider enabled');
    console.log('  external_phone_enabled:', j.external_phone_enabled);
    console.log('  sms_provider:', j.sms_provider);
    console.log('  sms_twilio_message_service_sid:', j.sms_twilio_message_service_sid ? '(set)' : '(missing)');
  } catch (e) { console.log(d); }
})"

echo ""
echo "Verify: bash scripts/verify-phone-auth.sh"
