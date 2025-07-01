#!/bin/bash

# Twenty CRM Quick Start - Smart startup without resets
# Only starts what's not already running

set -e

# Get script directory for path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TWENTY_STARTUP_DIR="$SCRIPT_DIR/twenty-startup"

echo "🚀 Twenty CRM Quick Start..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Navigate to Twenty startup directory
cd "$TWENTY_STARTUP_DIR"

# Check current status
echo "🔍 Checking current status..."

# Get container status using simple docker compose ps
CONTAINERS_OUTPUT=$(docker compose ps --format "table {{.Service}}\t{{.State}}" 2>/dev/null || echo "")

# Parse status for each service using grep
DB_RUNNING=$(echo "$CONTAINERS_OUTPUT" | grep "^db" | awk '{print $2}' || echo "")
REDIS_RUNNING=$(echo "$CONTAINERS_OUTPUT" | grep "^redis" | awk '{print $2}' || echo "")
SERVER_RUNNING=$(echo "$CONTAINERS_OUTPUT" | grep "^server" | awk '{print $2}' || echo "")
WORKER_RUNNING=$(echo "$CONTAINERS_OUTPUT" | grep "^worker" | awk '{print $2}' || echo "")

# Check health status
if [ "$SERVER_RUNNING" = "running" ]; then
    SERVER_HEALTHY=$(curl -f http://localhost:3000/healthz >/dev/null 2>&1 && echo "healthy" || echo "unhealthy")
else
    SERVER_HEALTHY="not_running"
fi

echo "📊 Current Status:"
echo "   Database: ${DB_RUNNING:-not_running}"
echo "   Redis: ${REDIS_RUNNING:-not_running}" 
echo "   Server: ${SERVER_RUNNING:-not_running} (${SERVER_HEALTHY})"
echo "   Worker: ${WORKER_RUNNING:-not_running}"

# Smart startup logic
NEED_START=false

if [ "$DB_RUNNING" != "running" ] || [ "$REDIS_RUNNING" != "running" ] || [ "$SERVER_RUNNING" != "running" ] || [ "$WORKER_RUNNING" != "running" ]; then
    NEED_START=true
fi

if [ "$SERVER_HEALTHY" = "unhealthy" ]; then
    echo "⚠️  Server is running but unhealthy, will restart it"
    NEED_START=true
fi

if [ "$NEED_START" = "false" ] && [ "$SERVER_HEALTHY" = "healthy" ]; then
    echo "✅ Twenty CRM is already running and healthy!"
    echo ""
    echo "📍 Access URLs:"
    echo "   • Twenty CRM: http://localhost:3000"
    echo "   • GraphQL API: http://localhost:3000/graphql"
    echo "   • Health Check: http://localhost:3000/healthz"
    echo ""
    echo "🔧 For MCP Testing:"
    echo "   • Setup: npm run twenty:setup"
    echo "   • Test: npm run discover"
    exit 0
fi

echo ""
echo "🔧 Starting missing/unhealthy services..."

# Start services (only missing ones will actually start)
docker compose up -d

echo "⏳ Waiting for services to be ready..."

# Wait for health check with timeout
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:3000/healthz >/dev/null 2>&1; then
        echo "✅ Twenty is ready!"
        break
    fi
    if [ $counter -eq 0 ]; then
        echo -n "Waiting"
    fi
    echo -n "."
    sleep 2
    counter=$((counter + 2))
done

if [ $counter -ge $timeout ]; then
    echo ""
    echo "❌ Timeout waiting for Twenty to be healthy. Check logs:"
    echo "   cd $TWENTY_STARTUP_DIR && docker compose logs server"
    exit 1
fi

echo ""
echo "🎉 Twenty CRM is ready!"
echo ""
echo "📍 Access URLs:"
echo "   • Twenty CRM: http://localhost:3000"
echo "   • GraphQL API: http://localhost:3000/graphql"
echo "   • REST API: http://localhost:3000/rest"
echo "   • Health Check: http://localhost:3000/healthz"
echo ""
echo "🔧 For MCP Testing:"
echo "   • Setup: npm run twenty:setup"
echo "   • Test: npm run discover"
echo ""
echo "📊 Management:"
echo "   • View logs: cd $TWENTY_STARTUP_DIR && docker compose logs -f"
echo "   • Stop: npm run twenty:stop"
echo "   • Force restart: npm run twenty:start"