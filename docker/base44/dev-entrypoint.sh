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

# The override below reads PEERTUBE_PUBLIC_HOST from the environment, so export it first
export PEERTUBE_PUBLIC_HOST

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
export NODE_ENV=dev

# Sandbox preview: the Angular dev client compiles/transforms the app on its first requests,
# and that burst saturates every sandbox CPU, leaving a page that loads at that moment
# unresponsive. Warm both servers in the background as soon as they answer so that work
# happens before the first visitor (or the platform's preview check) connects.
if [ "${BASE44_PREVIEW_MODE:-}" = "1" ]; then
  (
    i=0
    while [ "$i" -lt 240 ]; do
      curl -fsS -o /dev/null --max-time 10 http://127.0.0.1:3000/ 2>/dev/null && break
      i=$((i + 1))
      sleep 5
    done

    # /main.js and /polyfills.js are the compiled dev bundles: fetching them runs the build
    for path in /main.js /polyfills.js /styles.css /api/v1/config/about; do
      curl -fsS -o /dev/null --max-time 600 "http://127.0.0.1:3000${path}" 2>/dev/null || true
    done
  ) &
fi

exec npm run dev
