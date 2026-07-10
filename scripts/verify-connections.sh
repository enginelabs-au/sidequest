#!/usr/bin/env bash
# End-to-end connection checks: Supabase API, legal URLs, env safety, DB smoke.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Side Quest connection verification ==="

if [[ ! -f .env ]]; then
  echo "FAIL: .env missing"
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

fail=0
warn=0

warn_if() {
  echo "WARN: $1"
  warn=$((warn + 1))
}

fail_if() {
  echo "FAIL: $1"
  fail=$((fail + 1))
}

ok() {
  echo "OK: $1"
}

# --- Env safety ---
if env | grep -q '^EXPO_PUBLIC_.*SECRET='; then
  fail_if "EXPO_PUBLIC_*SECRET found — remove from .env; secrets belong in Supabase Dashboard only"
fi

if grep -qE '^EXPO_PUBLIC_.*SECRET=' .env 2>/dev/null; then
  fail_if "EXPO_PUBLIC_*SECRET in .env — never bundle OAuth secrets in the mobile client"
fi

if grep -qE '^SUPABASE_SERVICE_ROLE_KEY=' .env 2>/dev/null; then
  fail_if "SUPABASE_SERVICE_ROLE_KEY uncommented in .env — remove; never use in client"
fi

# --- Supabase REST (venues) ---
if [[ -z "${EXPO_PUBLIC_SUPABASE_URL:-}" || -z "${EXPO_PUBLIC_SUPABASE_ANON_KEY:-}" ]]; then
  fail_if "Supabase URL or anon key missing"
else
  http_code="$(curl -sS -o /tmp/sq-venues.json -w '%{http_code}' \
    -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
    "${EXPO_PUBLIC_SUPABASE_URL}/rest/v1/venues?select=id,name&limit=10")"
  if [[ "$http_code" == "200" ]]; then
    count="$(python3 -c 'import json; print(len(json.load(open("/tmp/sq-venues.json"))))' 2>/dev/null || echo "?")"
    if [[ "$count" == "5" ]]; then
      ok "Supabase REST venues — HTTP 200, $count seed venues"
    elif [[ "$count" == "?" ]]; then
      ok "Supabase REST venues — HTTP 200 (count parse skipped)"
    else
      warn_if "Supabase REST venues — HTTP 200 but count=$count (expected 5 after seed)"
    fi
  else
    fail_if "Supabase REST venues — HTTP $http_code"
  fi
fi

# --- Supabase Auth health ---
if [[ -n "${EXPO_PUBLIC_SUPABASE_URL:-}" ]]; then
  auth_code="$(curl -sS -o /dev/null -w '%{http_code}' \
    -H "apikey: ${EXPO_PUBLIC_SUPABASE_ANON_KEY}" \
    "${EXPO_PUBLIC_SUPABASE_URL}/auth/v1/health")"
  if [[ "$auth_code" == "200" ]]; then
    ok "Supabase Auth health — HTTP 200"
  else
    warn_if "Supabase Auth health — HTTP $auth_code"
  fi
fi

# --- Google client ID format ---
if [[ -n "${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:-}" ]]; then
  if [[ "${EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID}" == *".apps.googleusercontent.com" ]]; then
    ok "Google Web Client ID format looks valid"
  else
    warn_if "Google Web Client ID format unexpected"
  fi
else
  warn_if "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID not set"
fi

# --- Legal URLs ---
for label in PRIVACY TERMS; do
  var="EXPO_PUBLIC_${label}_POLICY_URL"
  if [[ "$label" == "TERMS" ]]; then var="EXPO_PUBLIC_TERMS_URL"; fi
  url="${!var:-}"
  if [[ -z "$url" || "$url" == *"example.com"* ]]; then
    warn_if "$var not set or placeholder"
    continue
  fi
  code="$(curl -sS -o /dev/null -w '%{http_code}' -L --max-time 15 "$url" || echo "000")"
  if [[ "$code" == "200" ]]; then
    ok "$var reachable — HTTP 200"
  else
    warn_if "$var — HTTP $code (enable GitHub Pages or alternate host)"
  fi
done

# --- Expo public config ---
if command -v npx >/dev/null 2>&1; then
  cfg="$(npx expo config --type public 2>/dev/null || true)"
  if echo "$cfg" | grep -q "googleWebClientId"; then
    if echo "$cfg" | grep -qE "googleWebClientId: undefined|googleWebClientId: ''"; then
      warn_if "Expo config googleWebClientId empty — restart Metro after .env change"
    else
      ok "Expo config includes googleWebClientId"
    fi
  fi
  if echo "$cfg" | grep -q "supabaseUrl"; then
    ok "Expo config includes supabaseUrl"
  fi
fi

# --- DB smoke (optional, needs SUPABASE_DATABASE_PASSWORD) ---
if [[ -n "${SUPABASE_DATABASE_PASSWORD:-}" && -n "${EXPO_PUBLIC_SUPABASE_URL:-}" ]]; then
  ref="$(echo "$EXPO_PUBLIC_SUPABASE_URL" | sed -n 's|https://\([^.]*\)\.supabase\.co.*|\1|p')"
  if command -v psql >/dev/null 2>&1 && [[ -n "$ref" ]]; then
    export PGPASSWORD="${SUPABASE_DATABASE_PASSWORD}"
    tables="$(psql -h "db.${ref}.supabase.co" -p 5432 -U postgres -d postgres -t -A -c \
      "select count(*) from information_schema.tables where table_schema='public' and table_name in ('profiles','venues','check_ins','connections','messages');" 2>/dev/null || echo "")"
    if [[ "$tables" == "5" ]]; then
      ok "Postgres smoke — 5 core public tables present"
    elif [[ -n "$tables" ]]; then
      warn_if "Postgres smoke — core table count $tables (expected 5)"
    else
      warn_if "Postgres smoke skipped (psql connection failed)"
    fi
    rpc="$(psql -h "db.${ref}.supabase.co" -p 5432 -U postgres -d postgres -t -A -c \
      "select count(*) from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='public' and p.proname in ('get_room_peers','request_connection','checkout_user');" 2>/dev/null || echo "")"
    if [[ "$rpc" == "3" ]]; then
      ok "Postgres smoke — 3 core RPCs present"
    elif [[ -n "$rpc" ]]; then
      warn_if "Postgres smoke — RPC count $rpc (expected 3)"
    fi
  fi
fi

# --- CLI migration sync ---
if command -v supabase >/dev/null 2>&1; then
  if supabase migration list --linked 2>/dev/null | grep -q "20260709164005"; then
    if supabase migration list --linked 2>/dev/null | awk -F'|' 'NF>=3 && $1 !~ /Local/ && $1 !~ /^-/ && $1 !~ /^$/ {gsub(/ /,"",$1); gsub(/ /,"",$2); if($1!="" && $2!="" && $1!=$2) bad=1} END{exit bad?1:0}' 2>/dev/null; then
      ok "Supabase migrations — linked list includes 20260709164005"
    else
      warn_if "Supabase migrations — local/remote mismatch detected"
    fi
  else
    warn_if "Supabase CLI — run supabase link if not linked"
  fi
fi

echo ""
if [[ $fail -gt 0 ]]; then
  echo "Result: FAILED ($fail critical, $warn warnings)"
  exit 1
fi
if [[ $warn -gt 0 ]]; then
  echo "Result: PASS with $warn warning(s) — see above"
  exit 0
fi
echo "Result: ALL CONNECTION CHECKS PASSED"
exit 0
