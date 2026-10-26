#!/bin/sh
# Starts PeerTube's development stack (Express API on :9000 + Angular client on :3000)
# against the compose PostgreSQL/Redis services, from the bind-mounted source tree.
set -eu

cd "$(dirname "$0")/../.."

# Base44 sandbox preview: the dev client (host port 3000) is the only public entry point
# and proxies /api, /static, /client... to the local server. Tell PeerTube that its public
# origin is that preview URL so the absolute URLs it generates (thumbnails, avatars, HLS
# playlists...) go through the same proxy. Keep PeerTube's own default behaviour (localhost:9000)
# when the preview flag is unset, e.g. in a normal local `npm run dev` session.
if [ "${BASE44_PREVIEW_MODE:-}" = "1" ] && [ -n "${BASE44_PUBLIC_HOST_SUFFIX:-}" ]; then
  PEERTUBE_PUBLIC_HOST="3000-${BASE44_PUBLIC_HOST_SUFFIX}"
else
  PEERTUBE_PUBLIC_HOST=""
fi

# The API serves /client/* from client/dist, and the dev client fetches /client/assets (mascots,
# default avatars...) through it. `npm run dev` only copies the locales there, so publish the
# source assets too (skipped once a real client build has produced client/dist/assets).
mkdir -p client/dist
[ -d client/dist/assets ] || cp -r client/src/assets client/dist/assets

# node-config overrides, merged on top of config/default.yaml + config/dev.yaml
NODE_CONFIG="$(node -e '
const override = {
  database: { hostname: process.env.PEERTUBE_DB_HOST || "127.0.0.1" },
  redis: { hostname: process.env.PEERTUBE_REDIS_HOST || "127.0.0.1" }
}

if (process.env.PEERTUBE_PUBLIC_HOST) {
  override.webserver = { hostname: process.env.PEERTUBE_PUBLIC_HOST, port: 443, https: true }
}

process.stdout.write(JSON.stringify(override))
')"

export NODE_CONFIG
export PEERTUBE_PUBLIC_HOST
export NODE_ENV=dev

exec npm run dev
