#!/bin/bash

# Twenty CRM Startup Script for MCP Server Testing
# Optimized for use from Twenty MCP project directory

set -e

# Get script directory for path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TWENTY_STARTUP_DIR="$SCRIPT_DIR/twenty-startup"

echo "🚀 Starting Twenty CRM for MCP Server Testing..."
echo "Project Root: $PROJECT_ROOT"
echo "Twenty Startup Directory: $TWENTY_STARTUP_DIR"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! docker compose version > /dev/null 2>&1; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Navigate to Twenty startup directory
cd "$TWENTY_STARTUP_DIR"

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate random APP_SECRET
    APP_SECRET=$(openssl rand -base64 32)
    sed -i "s|# APP_SECRET=replace_me_with_a_random_string|APP_SECRET=$APP_SECRET|g" .env
    
    echo "✅ Environment file created with random APP_SECRET"
fi

# Check for port conflicts
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 3000 is already in use. Please stop the service using port 3000."
    echo "To find what's using port 3000: lsof -i :3000"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Stop any existing Twenty containers
echo "🧹 Cleaning up existing Twenty containers..."
docker compose down 2>/dev/null || true

# Start Twenty services
echo "🐳 Starting Twenty services with Docker Compose..."
docker compose up -d

# Wait for services to be ready
echo "⏳ Waiting for Twenty to be ready..."
echo "This may take a few minutes on first startup..."

# Wait for health check
timeout=120
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
    echo "❌ Timeout waiting for Twenty to start. Check logs with:"
    echo "   cd $TWENTY_STARTUP_DIR && docker compose logs"
    exit 1
fi

echo ""
echo "🎉 Twenty CRM is now running!"
echo ""
echo "📍 Access URLs:"
echo "   • Twenty CRM: http://localhost:3000"
echo "   • GraphQL API: http://localhost:3000/graphql"
echo "   • REST API: http://localhost:3000/rest"
echo "   • Health Check: http://localhost:3000/healthz"
echo ""
echo "🔧 For MCP Server Testing:"
echo "   • Set TWENTY_API_URL=http://localhost:3000"
echo "   • Create workspace & API key at http://localhost:3000"
echo "   • Setup: npm run twenty:setup"
echo "   • Test MCP server: npm run discover"
echo ""
echo "📊 Management Commands:"
echo "   • Smart start: npm run twenty:quick     # Recommended daily use"
echo "   • Check status: npm run twenty:status"
echo "   • View logs: npm run twenty:logs"
echo "   • Stop Twenty: npm run twenty:stop"
echo ""
echo "🐛 Database Access (if needed):"
echo "   • Host: localhost"
echo "   • Port: 5432"
echo "   • Database: default"
echo "   • Username: postgres"
echo "   • Password: postgres"