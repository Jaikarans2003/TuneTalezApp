#!/usr/bin/env bash
# Upload local media/posters/*.jpg to remote staging R2. Always use --remote.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
for f in media/posters/*.jpg; do
  name="$(basename "$f")"
  npx wrangler r2 object put "tunetalez-media-staging/posters/$name" \
    --file "$f" --content-type image/jpeg --remote
done
