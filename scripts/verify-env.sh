#!/usr/bin/env bash
# Verify Side Quest .env and Expo public config before Phase 9 push / live validation.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Side Quest env verification ==="

if [[ ! -f .env ]]; then
  echo "FAIL: .env missing. Run: cp .env.example .env"
  echo "See docs/FINAL_CHECKLIST.md for required variables."
  exit 1
fi

# shellcheck disable=SC1091
source "$(dirname "$0")/load-dotenv.sh"
load_dotenv .env

missing=0
for var in EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY; do
  val="${!var:-}"
  if [[ -z "$val" || "$val" == *"<"* || "$val" == *"placeholder"* ]]; then
    echo "FAIL: $var not set or still placeholder"
    missing=1
  else
    echo "OK: $var is set"
  fi
done

if [[ "${EXPO_PUBLIC_SUPABASE_URL:-}" == "https://placeholder.supabase.co" ]]; then
  echo "FAIL: EXPO_PUBLIC_SUPABASE_URL is still placeholder"
  missing=1
fi

if [[ "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" == "placeholder-anon-key" ]]; then
  echo "FAIL: EXPO_PUBLIC_SUPABASE_ANON_KEY is still placeholder"
  missing=1
fi

# Extract project ref for supabase link
if [[ -n "${EXPO_PUBLIC_SUPABASE_URL:-}" ]]; then
  ref="$(echo "$EXPO_PUBLIC_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')"
  if [[ -n "$ref" && "$ref" != *"<"* ]]; then
    echo "INFO: Supabase project ref for CLI: $ref"
    echo "      supabase link --project-ref $ref --yes"
  fi
fi

echo ""
echo "--- Optional vars ---"
for var in EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID EXPO_PUBLIC_PRIVACY_POLICY_URL EXPO_PUBLIC_TERMS_URL; do
  val="${!var:-}"
  if [[ -z "$val" || "$val" == *"example.com"* ]]; then
    echo "SKIP: $var (not set or placeholder)"
  else
    echo "OK: $var is set"
  fi
done

if grep -qE '^EXPO_PUBLIC_.*SECRET=' .env 2>/dev/null; then
  echo "FAIL: EXPO_PUBLIC_*SECRET in .env — remove; use Supabase Dashboard for OAuth secrets"
  missing=1
fi

echo ""
echo "--- EXPO_PUBLIC safety ---"
if bash "$(dirname "$0")/check-expo-public-safety.sh" .env; then
  echo "OK: EXPO_PUBLIC_ vars pass safety check"
else
  missing=1
fi

echo ""
echo "--- Expo public config ---"
if command -v npx >/dev/null 2>&1; then
  npx expo config --type public 2>/dev/null | grep -E 'supabaseUrl|scheme|bundleIdentifier|package' || true
else
  echo "SKIP: npx not available"
fi

echo ""
if [[ $missing -eq 1 ]]; then
  echo "Result: NOT READY. See docs/FINAL_CHECKLIST.md"
  exit 1
fi

echo "Result: READY for supabase link + db push"
echo "Next: supabase login && supabase link --project-ref <ref> --yes"
exit 0
