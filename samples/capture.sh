#!/usr/bin/env bash
# Regenerates the CLI output samples shown on the website.
#
# Usage: samples/capture.sh /path/to/flowprint-checkout
#
# The checkout must be the Flowprint CLI repository (alpha.5 source) with its
# dependencies installed (`npm install` inside that checkout). This script only
# READS the checkout; it never modifies it. Output is written to samples/output/.
# Absolute fixture paths are rewritten to ~/code/ so no local paths leak.
set -euo pipefail

CLI_DIR="$(cd "${1:?path to a Flowprint CLI checkout is required}" && pwd)"
HERE="$(cd "$(dirname "$0")" && pwd)"
FIX="$HERE/fixtures"
OUT="$HERE/output"
mkdir -p "$OUT" "$FIX/empty"

run() { (cd "$CLI_DIR" && npx tsx packages/flowprint/src/cli.ts "$@"); }
clean() { sed "s#$FIX/#~/code/#g"; }

run --help                                        | clean > "$OUT/help.txt"
run "$FIX/field-notes"                            | clean > "$OUT/field-notes.default.txt"
run "$FIX/field-notes" --full                     | clean > "$OUT/field-notes.full.txt"
run "$FIX/harbor-workspace"                       | clean > "$OUT/harbor-workspace.discovery.txt"
run "$FIX/harbor-workspace" --app @harbor/web     | clean > "$OUT/harbor-workspace.app-web.txt"
run "$FIX/empty"                                  | clean > "$OUT/empty.discovery.txt"

echo "Captured with: $(run --version) @ $(git -C "$CLI_DIR" rev-parse --short HEAD 2>/dev/null || echo 'unknown commit')"
