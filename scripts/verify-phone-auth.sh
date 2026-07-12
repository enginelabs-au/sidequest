#!/usr/bin/env bash
# Verify Twilio + Supabase phone OTP wiring (credentials in .env; Twilio also in Supabase Dashboard).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Side Quest phone auth verification ==="

if [[ ! -f .env ]]; then
  echo "FAIL: .env missing"
  exit 1
fi

# shellcheck disable=SC1091
source "$(dirname "$0")/load-dotenv.sh"
load_dotenv .env

fail=0

for var in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_MESSAGING_SERVICE_SID; do
  val="${!var:-}"
  if [[ -z "$val" ]]; then
    echo "FAIL: $var not set in .env"
    fail=1
  fi
done

if [[ "${TWILIO_MESSAGING_SERVICE_SID:-}" == PN* ]]; then
  echo "FAIL: TWILIO_MESSAGING_SERVICE_SID starts with PN (phone number SID)."
  echo "      Use Messaging Service SID (MG…) from Twilio → Messaging → Services → sidequest → Properties."
  fail=1
elif [[ "${TWILIO_MESSAGING_SERVICE_SID:-}" != MG* ]]; then
  echo "WARN: TWILIO_MESSAGING_SERVICE_SID does not start with MG — confirm it is a Messaging Service SID."
fi

if [[ $fail -eq 1 ]]; then
  exit 1
fi

echo ""
echo "--- Supabase OTP endpoint ---"
otp_resp="$(curl -s -X POST "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/otp" \
  -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"phone":"+61400000001"}')"

otp_code="$(echo "$otp_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_code') or d.get('code') or 'ok')" 2>/dev/null || echo "parse_error")"

if [[ "$otp_code" == "ok" ]]; then
  echo "OK: Supabase accepted OTP request (check phone for SMS on real numbers)."
elif [[ "$otp_code" == "phone_provider_disabled" ]]; then
  echo "FAIL: Supabase Phone provider disabled or Twilio not saved."
  echo "      Dashboard → Authentication → Providers → Phone → Enable"
  echo "      SMS provider: Twilio | paste AC…, Auth Token, MG… (not PN…)"
  fail=1
else
  echo "INFO: Supabase OTP response: $otp_resp"
  if echo "$otp_resp" | grep -qi 'twilio\|sms\|provider'; then
    echo "      Provider is enabled; review message above for rate limits or number format."
  fi
fi

echo ""
echo "--- Twilio Messaging Service ---"
twilio_resp="$(curl -s -u "${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}" \
  "https://messaging.twilio.com/v1/Services/${TWILIO_MESSAGING_SERVICE_SID}")"

twilio_sid="$(echo "$twilio_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sid',''))" 2>/dev/null || true)"
if [[ "$twilio_sid" == "$TWILIO_MESSAGING_SERVICE_SID" ]]; then
  twilio_name="$(echo "$twilio_resp" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('friendly_name',''))" 2>/dev/null || true)"
  echo "OK: Messaging Service found (${twilio_name:-unnamed})"
else
  echo "FAIL: Could not load Messaging Service ${TWILIO_MESSAGING_SERVICE_SID}"
  echo "      $twilio_resp"
  fail=1
fi

echo ""
if [[ $fail -eq 0 ]]; then
  echo "PASS: Phone auth prerequisites look good."
  echo "      Test on device: auth → Continue with phone → E.164 number → verify code."
else
  echo "FAIL: Fix items above, then re-run: bash scripts/verify-phone-auth.sh"
  exit 1
fi
