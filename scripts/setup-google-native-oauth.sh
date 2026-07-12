#!/usr/bin/env bash
# Print Side Quest Google native OAuth setup steps (Step 1 manual walkthrough).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^(EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID|EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID|EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)=' "$ROOT/.env" | sed 's/\r$//')
  set +a
fi
WEB_ID="${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-300778226594-mu3gs5cci1reed6ag0b30oc03j4gtqfm.apps.googleusercontent.com}"
IOS_ID="${EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:-}"
ANDROID_ID="${EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID:-}"
PROJECT_NUM="${WEB_ID%%-*}"

GOOGLE_AUTH_IDS="$WEB_ID"
[[ -n "$IOS_ID" ]] && GOOGLE_AUTH_IDS="${GOOGLE_AUTH_IDS},${IOS_ID}"
[[ -n "$ANDROID_ID" ]] && GOOGLE_AUTH_IDS="${GOOGLE_AUTH_IDS},${ANDROID_ID}"

echo "=== Side Quest — Google native OAuth (Step 1) ==="
echo ""
echo "Your existing Web client ID:"
echo "  $WEB_ID"
echo "Google Cloud project number (from Web client): $PROJECT_NUM"
echo ""
echo "Open Google Cloud Console:"
echo "  https://console.cloud.google.com/apis/credentials?project=$PROJECT_NUM"
echo ""
echo "--- A) Create iOS OAuth client (required for iPhone) ---"
echo "1. Credentials → + CREATE CREDENTIALS → OAuth client ID"
echo "2. Application type: iOS"
echo "3. Name: Side Quest iOS"
echo "4. Bundle ID: au.enginelabs.sidequest"
echo "5. Create → copy the Client ID (ends with .apps.googleusercontent.com)"
echo "6. Add to .env:"
echo "     EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<paste-ios-client-id>"
echo "7. Rebuild native app:"
echo "     npx expo prebuild --clean --platform ios"
echo "     npx expo run:ios --device \"Free Malware\""
echo ""
echo "--- B) Create Android OAuth client (for Android builds) ---"
echo "1. Credentials → + CREATE CREDENTIALS → OAuth client ID"
echo "2. Application type: Android"
echo "3. Name: Side Quest Android"
echo "4. Package name: au.enginelabs.sidequest"
echo "5. SHA-1 certificate fingerprint (debug keystore):"
if command -v keytool >/dev/null 2>&1; then
  keytool -list -v -keystore "$HOME/.android/debug.keystore" -alias androiddebugkey -storepass android -keypass android 2>/dev/null | awk '/SHA1:/{print "     "$2; exit}' || echo "     (run keytool manually — see docs/ANDROID_GOOGLE_AUTH.md)"
else
  echo "     keytool not found — install JDK or use Android Studio → Gradle signingReport"
fi
echo "6. Add to .env:"
echo "     EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=<paste-android-client-id>"
echo "7. Rebuild native app:"
echo "     npx expo prebuild --clean --platform android"
echo "     npx expo run:android"
echo ""
echo "--- C) Supabase Dashboard → Auth → Google (after native clients exist) ---"
echo "Client ID: $WEB_ID (unchanged)"
echo "Authorized Client IDs (comma-separated):"
echo "  $GOOGLE_AUTH_IDS"
echo ""
echo "Verify:"
echo "  npm run test:oauth"
