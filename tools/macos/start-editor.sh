#!/bin/bash
set -euo pipefail

repo="$1"
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
url=http://127.0.0.1:5173
log="$HOME/Library/Logs/PPTist.log"

editor_ready() {
  /usr/bin/curl -fsS --max-time 1 "$url/" | /usr/bin/grep -F 'PPTist - プレゼンテーションエディター' >/dev/null
}

if editor_ready; then
  exit 0
fi

cd "$repo"
if ! command -v node >/dev/null || [ ! -f node_modules/vite/bin/vite.js ]; then
  echo 'PPTist の起動に必要な Node.js または依存パッケージが見つかりません。' >&2
  exit 1
fi
mkdir -p "$(dirname "$log")"
# Strict port prevents another instance from starting on an alternate port.
nohup node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort </dev/null >>"$log" 2>&1 &
for (( attempt=0; attempt<40; attempt++ )); do
  if editor_ready; then
    exit 0
  fi
  sleep 0.25
done
echo "PPTist を起動できませんでした。ログ: $log" >&2
exit 1
