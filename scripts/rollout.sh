#!/usr/bin/env bash
# Rolling (gradual) deployment to Cloudflare Workers.
#
#   1. Upload the built site as a new Worker version (no traffic yet).
#   2. Smoke-test that version on its own preview URL.
#   3. Shift traffic in stages (ROLLOUT_STAGES, default "10 50 100"),
#      health-checking production and waiting ROLLOUT_WAIT seconds between stages.
#   4. If any check fails, route 100% back to the previous version.
#
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, a built ./dist, jq, curl.
# Optional: PRODUCTION_URL (e.g. https://meotechnologies.com), ROLLOUT_STAGES, ROLLOUT_WAIT, DEPLOY_MESSAGE.

set -euo pipefail

WORKER="meo-technologies"
STAGES="${ROLLOUT_STAGES:-10 50 100}"
WAIT="${ROLLOUT_WAIT:-180}"
MESSAGE="${DEPLOY_MESSAGE:-$(git log -1 --pretty=%s 2>/dev/null || echo 'Deploy')}"
MESSAGE="$(head -n1 <<<"$MESSAGE" | cut -c1-90)"
TAG="$(git rev-parse --short HEAD 2>/dev/null || echo manual)"
WRANGLER="npx --no-install wrangler"

log() { printf '\n\033[1;32m▸ %s\033[0m\n' "$*"; }
fail() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; }

# Retry a URL a few times; succeed only on HTTP 2xx and expected content.
check_url() {
  local url="$1" header="${2:-}" attempt code body
  for attempt in 1 2 3 4 5; do
    if [[ -n "$header" ]]; then
      body="$(curl -sS -L --max-time 15 -H "$header" -w '\n%{http_code}' "$url" || true)"
    else
      body="$(curl -sS -L --max-time 15 -w '\n%{http_code}' "$url" || true)"
    fi
    code="${body##*$'\n'}"
    if [[ "$code" =~ ^2 ]] && grep -q "Meo Technologies" <<<"$body"; then
      echo "  ✓ $url ($code)"
      return 0
    fi
    echo "  … $url returned ${code:-no response}, retrying ($attempt/5)"
    sleep 6
  done
  return 1
}

smoke_test() {
  local base="${1%/}" header="${2:-}"
  check_url "$base/" "$header" && check_url "$base/privacy/" "$header"
}

# --- 1. Current production version -----------------------------------------
PREVIOUS=""
if STATUS="$($WRANGLER deployments status --json 2>/dev/null)"; then
  PREVIOUS="$(jq -r '.versions | max_by(.percentage) | .version_id' <<<"$STATUS")"
fi

if [[ -z "$PREVIOUS" || "$PREVIOUS" == "null" ]]; then
  log "No existing deployment found — doing first full deploy"
  $WRANGLER deploy --message "$MESSAGE" --tag "$TAG"
  [[ -n "${PRODUCTION_URL:-}" ]] && smoke_test "$PRODUCTION_URL"
  exit 0
fi
echo "Current production version: $PREVIOUS"

# --- 2. Upload new version (0% traffic) ------------------------------------
OUT="$(mktemp)"
log "Uploading new version ($TAG)"
WRANGLER_OUTPUT_FILE_PATH="$OUT" $WRANGLER versions upload --message "$MESSAGE" --tag "$TAG"
NEW="$(jq -r 'select(.type=="version-upload") | .version_id' "$OUT" | tail -1)"
PREVIEW="$(jq -r 'select(.type=="version-upload") | .preview_url // empty' "$OUT" | tail -1)"
[[ -n "$NEW" && "$NEW" != "null" ]] || { fail "Could not read new version ID"; exit 1; }
echo "New version: $NEW"

if [[ "$NEW" == "$PREVIOUS" ]]; then
  log "New version is already live — nothing to roll out"
  exit 0
fi

rollback() {
  fail "$1 — rolling back to $PREVIOUS"
  $WRANGLER versions deploy "$PREVIOUS@100" --message "Auto-rollback: $1" --yes || true
  exit 1
}

# --- 3. Smoke-test the new version before it gets any traffic -------------
log "Smoke-testing new version"
if [[ -n "$PREVIEW" ]]; then
  smoke_test "$PREVIEW" || { fail "Preview URL checks failed — new version never received traffic"; exit 1; }
elif [[ -n "${PRODUCTION_URL:-}" ]]; then
  smoke_test "$PRODUCTION_URL" "Cloudflare-Workers-Version-Overrides: $WORKER=\"$NEW\"" \
    || { fail "Version-override checks failed — new version never received traffic"; exit 1; }
else
  echo "  (no preview URL or PRODUCTION_URL — skipping pre-traffic smoke test)"
fi

# --- 4. Staged traffic shift ---------------------------------------------------
for PCT in $STAGES; do
  if (( PCT >= 100 )); then
    log "Promoting $NEW to 100%"
    $WRANGLER versions deploy "$NEW@100" --message "$MESSAGE" --yes
  else
    log "Shifting $PCT% of traffic to $NEW"
    $WRANGLER versions deploy "$NEW@$PCT" "$PREVIOUS@$((100 - PCT))" --message "$MESSAGE ($PCT%)" --yes
  fi

  if [[ -n "${PRODUCTION_URL:-}" ]]; then
    smoke_test "$PRODUCTION_URL" || rollback "Production health check failed at $PCT%"
    smoke_test "$PRODUCTION_URL" "Cloudflare-Workers-Version-Overrides: $WORKER=\"$NEW\"" \
      || rollback "New version failed health check at $PCT%"
  fi

  if (( PCT < 100 )); then
    echo "  Holding at $PCT% for ${WAIT}s…"
    sleep "$WAIT"
  fi
done

log "Rollout complete — $NEW is serving 100% of traffic"
