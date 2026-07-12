#!/usr/bin/env bash
# Load single-line vars from .env; skip multiline APPLE_AUTH_KEY PEM block.
load_dotenv() {
  local file="${1:-.env}"
  [[ -f "$file" ]] || return 1
  local in_pem=0
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$in_pem" -eq 1 ]]; then
      [[ "$line" == *"-----END PRIVATE KEY-----"* ]] && in_pem=0
      continue
    fi
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^APPLE_AUTH_KEY= ]]; then
      in_pem=1
      continue
    fi
    if [[ "$line" =~ ^([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]]; then
      export "${BASH_REMATCH[1]}=${BASH_REMATCH[2]}"
    fi
  done < "$file"
}
