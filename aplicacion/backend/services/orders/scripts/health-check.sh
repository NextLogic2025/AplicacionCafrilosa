#!/usr/bin/env bash
set -euo pipefail
curl -f http://localhost:3000/health || exit 1
