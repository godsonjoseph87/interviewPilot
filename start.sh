#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
export PATH="$DIR/bin:/tmp/bin:$PATH"

echo "Starting InterviewPilot AI with Node $(node -v)..."
exec node "$DIR/node_modules/vite/bin/vite.js" "$@"
