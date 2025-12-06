#!/usr/bin/env sh
set -eu

# Ensure optional test output folders exist so Trunk's watcher doesn't choke if they're missing
mkdir -p playwright-report test-results snap-test-videos

# Build Tailwind if the CLI is available; otherwise create a placeholder file so Trunk can serve
if [ -x "./node_modules/.bin/tailwindcss" ]; then
  ./node_modules/.bin/tailwindcss -i ./src/index.css -o ./tailwind.css --minify
else
  echo "tailwindcss not installed; skipping Tailwind build. Run 'npm install' to enable full styling." >&2
  : > ./tailwind.css
fi
