#!/bin/bash

set -eu

(cd client/src/standalone/player && npm run build)

clientConfiguration="hmr"

if [ ! -z ${2+x} ] && [ "$2" = "--ar-locale" ]; then
  clientConfiguration="ar-locale"
fi

skipServer=false
if [ ! -z ${1+x} ] && [ "$1" = "--skip-server" ]; then
  skipServer=true
fi

playerCommand="cd client/src/standalone/player && npm run dev"
embedCommand="cd client && ./node_modules/.bin/vite -c ./src/standalone/videos/vite.config.mjs dev"
clientCommand="cd client && NODE_OPTIONS=--max_old_space_size=8192 node_modules/.bin/ng serve --proxy-config proxy.config.json --hmr --configuration $clientConfiguration --host 0.0.0.0 --port 3000"
serverCommand="ANGULAR_CLIENT_ENABLED=true NODE_ENV=dev node dist/server"

# POSIX positional parameters are used instead of a bash array because scripts/dev/index.sh runs this
# script with `sh` (dash), which has no arrays.
set -- "$playerCommand" "$clientCommand"

# The standalone embed dev server binds the instance webserver hostname (see src/standalone/videos/vite.config.mjs).
# In the Base44 preview sandbox that hostname is the proxied public origin, which cannot be bound inside the
# container, so this auxiliary server is left out there. Any other value keeps the original behavior.
if [ "${BASE44_PREVIEW_MODE:-}" != "1" ]; then
  set -- "$@" "$embedCommand"
fi

if [ "$skipServer" = "true" ]; then
  node_modules/.bin/concurrently -k "$@"
else
  npm run build:server

  node_modules/.bin/concurrently -k \
    "$@" \
    "$serverCommand"
fi
