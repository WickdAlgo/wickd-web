#!/usr/bin/env bash
# Validate a design-system component: barrel export present, no hardcoded colors.
# Usage: validate.sh <kebab-case-name>   (or no arg to scan the whole library)
set -euo pipefail

UI_DIR="src/components/ui"
FAIL=0

if [ $# -ge 1 ]; then
  NAME="$1"
  FILE="$UI_DIR/$NAME.tsx"
  [ -f "$FILE" ] || { echo "FAIL: $FILE does not exist"; exit 1; }
  grep -q "\"./$NAME\"" "$UI_DIR/index.ts" \
    || { echo "FAIL: $NAME is not exported from $UI_DIR/index.ts"; FAIL=1; }
  TARGETS="$FILE"
else
  TARGETS=$(ls "$UI_DIR"/*.tsx)
fi

# Hardcoded hex colors don't belong in components — use tokens from globals.css.
for f in $TARGETS; do
  if grep -nE '#[0-9a-fA-F]{3,8}\b' "$f" | grep -v 'currentColor' >/dev/null; then
    echo "FAIL: hardcoded hex color in $f:"
    grep -nE '#[0-9a-fA-F]{3,8}\b' "$f"
    FAIL=1
  fi
done

[ "$FAIL" -eq 0 ] && echo "OK: validation passed"
exit $FAIL
