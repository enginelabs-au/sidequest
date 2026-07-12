#!/usr/bin/env bash
# Scan .env for EXPO_PUBLIC_ variables that must not ship in the mobile client.
# Usage: check-expo-public-safety.sh [path-to-.env]
set -euo pipefail

ENV_FILE="${1:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "SKIP: $ENV_FILE not found"
  exit 0
fi

fail=0

fail_msg() {
  echo "FAIL: $1"
  fail=1
}

# Secrets, credentials, API keys must never use EXPO_PUBLIC_
while IFS= read -r line; do
  fail_msg "Unsafe EXPO_PUBLIC var bundles a secret: $line"
done < <(grep -nE '^EXPO_PUBLIC_.*(SECRET|PASSWORD|TOKEN|PRIVATE|API_KEY)=' "$ENV_FILE" 2>/dev/null || true)

# Dev-only flags/credentials belong in DEV_* (app.config.ts extra), not EXPO_PUBLIC_
while IFS= read -r line; do
  fail_msg "Dev-only var must not be EXPO_PUBLIC_: $line — use DEV_* instead"
done < <(grep -nE '^EXPO_PUBLIC_DEV_' "$ENV_FILE" 2>/dev/null || true)

# Allowed EXPO_PUBLIC_ (documented whitelist)
ALLOWED=(
  EXPO_PUBLIC_SUPABASE_URL
  EXPO_PUBLIC_SUPABASE_ANON_KEY
  EXPO_PUBLIC_APP_SCHEME
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  EXPO_PUBLIC_PRIVACY_POLICY_URL
  EXPO_PUBLIC_TERMS_URL
)

while IFS= read -r line; do
  name="${line%%=*}"
  allowed=0
  for a in "${ALLOWED[@]}"; do
    if [[ "$name" == "$a" ]]; then
      allowed=1
      break
    fi
  done
  if [[ $allowed -eq 0 ]]; then
    fail_msg "Unexpected EXPO_PUBLIC var (not in whitelist): $name — use app.config.ts extra or server-only env"
  fi
done < <(grep -E '^EXPO_PUBLIC_[A-Z0-9_]+=' "$ENV_FILE" 2>/dev/null || true)

exit $fail
