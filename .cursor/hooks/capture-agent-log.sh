#!/usr/bin/env bash
# Automatic prompt/response capture for 8x assignment (.agent-logs/).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
INPUT="$(cat)"
printf '%s' "$INPUT" | python3 "$ROOT/.cursor/hooks/capture-agent-log.py" "$ROOT"
exit 0
