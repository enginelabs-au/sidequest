#!/usr/bin/env bash
# Print exact Supabase Dashboard values for native Google + Apple auth.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WEB=$(grep '^EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=' "$ROOT/.env" | cut -d= -f2- | tr -d '\r')
IOS=$(grep '^EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=' "$ROOT/.env" | cut -d= -f2- | tr -d '\r')
ANDROID=$(grep '^EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=' "$ROOT/.env" | cut -d= -f2- | tr -d '\r')
APPLE_SERVICES=$(grep '^APPLE_SERVICES_CLIENT_ID=' "$ROOT/.env" | cut -d= -f2- | tr -d '\r')
APPLE_SERVICES="${APPLE_SERVICES:-au.enginelabs.sidequest.web}"

GOOGLE_AUTH_IDS="$WEB"
[[ -n "$IOS" ]] && GOOGLE_AUTH_IDS="${GOOGLE_AUTH_IDS},${IOS}"
[[ -n "$ANDROID" ]] && GOOGLE_AUTH_IDS="${GOOGLE_AUTH_IDS},${ANDROID}"

echo "=== Supabase Dashboard — paste these values ==="
echo ""
echo "## Authentication → Providers → Google"
echo "Client ID (unchanged):"
echo "  $WEB"
echo ""
echo "Skip nonce check: ON (required for native iOS Google Sign-In)"
echo ""
echo "Authorized Client IDs (comma-separated, no spaces):"
if [[ -n "$IOS" || -n "$ANDROID" ]]; then
  echo "  $GOOGLE_AUTH_IDS"
else
  echo "  (add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID and/or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID to .env)"
fi
echo ""
echo "## Authentication → Providers → Apple"
echo "Client IDs (comma-separated, no spaces):"
echo "  au.enginelabs.sidequest,$APPLE_SERVICES"
echo ""
echo "Secret Key: keep your existing JWT (unchanged)"
echo ""
echo "Optional API patch (needs token from https://supabase.com/dashboard/account/tokens):"
echo "  SUPABASE_ACCESS_TOKEN=sbp_... bash scripts/patch-supabase-native-auth.sh"
