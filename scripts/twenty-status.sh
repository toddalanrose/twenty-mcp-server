#!/bin/bash

# Twenty CRM Status Checker
# Quick status overview without starting anything

set -e

# Get script directory for path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TWENTY_STARTUP_DIR="$SCRIPT_DIR/twenty-startup"

echo "📊 Twenty CRM Status Check"
echo "=========================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running"
    exit 1
fi

# Navigate to Twenty startup directory
cd "$TWENTY_STARTUP_DIR"

# Check if compose file exists
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Docker Compose file not found"
    exit 1
fi

# Get container status
echo "🐳 Container Status:"
CONTAINERS_STATUS=$(docker compose ps --format json 2>/dev/null || echo "[]")

if [ "$CONTAINERS_STATUS" = "[]" ]; then
    echo "   No containers running"
else
    docker compose ps
fi

echo ""

# Check ports
echo "🌐 Port Status:"
echo -n "   Port 3000 (Twenty): "
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ In use"
else
    echo "⚪ Available"
fi

echo -n "   Port 5432 (PostgreSQL): "
if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ In use"
else
    echo "⚪ Available"
fi

echo -n "   Port 6379 (Redis): "
if lsof -Pi :6379 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ In use"
else
    echo "⚪ Available"
fi

echo ""

# Check Twenty health
echo "❤️  Health Status:"
if curl -f http://localhost:3000/healthz >/dev/null 2>&1; then
    echo "   ✅ Twenty is healthy and responding"
    echo "   🌐 Access: http://localhost:3000"
else
    echo "   ❌ Twenty not responding on port 3000"
fi

echo ""

# Check volumes
echo "💾 Data Volumes:"
if docker volume ls | grep -q "twenty_db-data"; then
    echo "   ✅ Database volume exists"
else
    echo "   ⚪ No database volume"
fi

if docker volume ls | grep -q "twenty_server-local-data"; then
    echo "   ✅ Server data volume exists"
else
    echo "   ⚪ No server data volume"
fi

echo ""

# Quick actions
echo "🔧 Quick Actions:"
echo "   Start: npm run twenty:quick"
echo "   Stop:  npm run twenty:stop"
echo "   Setup: npm run twenty:setup"
echo "   Test:  npm run discover"