#!/bin/bash
set -euo pipefail

# Only run in remote (Claude Code on the web) environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

# Install root dependencies
npm install

# Install backend dependencies (skip Puppeteer's Chrome download)
PUPPETEER_SKIP_DOWNLOAD=true npm install --prefix backend

# Install frontend dependencies
npm install --prefix frontend-web
