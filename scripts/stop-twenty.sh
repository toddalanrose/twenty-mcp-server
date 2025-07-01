#!/bin/bash

# Stop Twenty CRM Services
# Optimized for use from Twenty MCP project directory

set -e

# Get script directory for path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TWENTY_STARTUP_DIR="$SCRIPT_DIR/twenty-startup"

echo "🛑 Stopping Twenty CRM services..."

# Navigate to Twenty startup directory
cd "$TWENTY_STARTUP_DIR"

# Stop Docker Compose services
if [ -f "docker-compose.yml" ]; then
    echo "🐳 Stopping Docker Compose services..."
    docker compose down
    echo "✅ Twenty services stopped"
else
    echo "❌ docker-compose.yml not found in $TWENTY_STARTUP_DIR"
    exit 1
fi

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️  Removing volumes (this will delete all data)..."
# docker compose down -v

echo ""
echo "✅ Twenty CRM has been stopped"
echo "   To start again: npm run twenty:quick    # Smart start (recommended)"
echo "   Force restart:  npm run twenty:start    # Full restart"