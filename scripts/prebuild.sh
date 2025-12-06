#!/usr/bin/env sh
# Be resilient in CI/dev: never fail the build if Tailwind or mkdir steps hiccup.
set -u

# Ensure optional test output folders exist so Trunk's watcher doesn't choke if they're missing
mkdir -p playwright-report test-results snap-test-videos || true

# Build Tailwind if the CLI is available; otherwise create a placeholder file so Trunk can serve
if [ -x "./node_modules/.bin/tailwindcss" ]; then
  ./node_modules/.bin/tailwindcss -i ./src/index.css -o ./tailwind.css --minify || {
    echo "tailwindcss failed; creating empty stylesheet so build continues." >&2
    : > ./tailwind.css
  }
else
  echo "tailwindcss not installed; skipping Tailwind build. Run 'npm install' to enable full styling." >&2
  : > ./tailwind.css
fi

exit 0
