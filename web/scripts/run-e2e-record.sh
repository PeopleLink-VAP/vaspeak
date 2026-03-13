#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# run-e2e-record.sh
#
# Runs all E2E tests using the "record" Playwright project (video on, 800×450).
# Publishes videos + JSON results into static/e2e-recordings/<timestamp>/
# so the /admin/e2e-testing page can display them.
#
# Usage:
#   bash scripts/run-e2e-record.sh [--grep=<pattern>] [--base-url=<url>]
#
# Examples:
#   bash scripts/run-e2e-record.sh
#   bash scripts/run-e2e-record.sh --grep="@smoke"
#   TEST_BASE_URL=http://localhost:19301 bash scripts/run-e2e-record.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(dirname "$SCRIPT_DIR")"

TIMESTAMP=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
RECORD_OUT="$WEB_DIR/static/e2e-recordings/$TIMESTAMP"
RESULTS_DIR="$WEB_DIR/test-results"

mkdir -p "$RECORD_OUT"
mkdir -p "$RESULTS_DIR"

# ── Parse args ────────────────────────────────────────────────────────────────
GREP_ARG=""
for arg in "$@"; do
  case "$arg" in
    --grep=*) GREP_ARG="--grep=${arg#--grep=}" ;;
    --base-url=*) export TEST_BASE_URL="${arg#--base-url=}" ;;
  esac
done

echo "▶ Starting E2E recording run: $TIMESTAMP"
echo "  Output: $RECORD_OUT"
echo "  Base URL: ${TEST_BASE_URL:-http://localhost:5173}"
echo ""

# ── Run Playwright with record project ────────────────────────────────────────
set +e
npx playwright test \
  --project=record \
  --output="$RESULTS_DIR/recordings-raw" \
  $GREP_ARG \
  2>&1 | tee "$RECORD_OUT/run.log"
EXIT_CODE=$?
set -e

# ── Copy videos + screenshots into output dir ─────────────────────────────────
if [ -d "$RESULTS_DIR/recordings-raw" ]; then
  find "$RESULTS_DIR/recordings-raw" -name "*.webm" -o -name "*.png" | while read -r f; do
    # Flatten: replace path separators with double-dashes for a readable filename
    REL="${f#$RESULTS_DIR/recordings-raw/}"
    FLAT="${REL//\//__}"
    cp "$f" "$RECORD_OUT/$FLAT"
  done
fi

# ── Copy JSON results ─────────────────────────────────────────────────────────
if [ -f "$RESULTS_DIR/results.json" ]; then
  cp "$RESULTS_DIR/results.json" "$RECORD_OUT/results.json"
fi

# ── Write run metadata ────────────────────────────────────────────────────────
STATUS=$([ $EXIT_CODE -eq 0 ] && echo "passed" || echo "failed")
cat > "$RECORD_OUT/meta.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "status": "$STATUS",
  "exitCode": $EXIT_CODE,
  "baseUrl": "${TEST_BASE_URL:-http://localhost:5173}",
  "grepFilter": "${GREP_ARG}",
  "runBy": "script"
}
EOF

echo ""
echo "✅ Recording run complete: $STATUS"
echo "   Files saved to: $RECORD_OUT"

exit $EXIT_CODE
