#!/bin/bash

# Twenty CRM Development Mode Startup
# Uses individual Docker containers for databases only
# Requires Twenty source code for development mode

set -e

# Get script directory for path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TWENTY_STARTUP_DIR="$SCRIPT_DIR/twenty-startup"

# Path to Twenty source code (modify this to point to your Twenty installation)
TWENTY_SOURCE_PATH="/home/igorw/Projects/Twenty"

echo "🔧 Starting Twenty CRM in Development Mode..."
echo "Project Root: $PROJECT_ROOT"
echo "Twenty Source: $TWENTY_SOURCE_PATH"

# Check if Twenty source exists
if [ ! -d "$TWENTY_SOURCE_PATH" ]; then
    echo "❌ Twenty source code not found at: $TWENTY_SOURCE_PATH"
    echo "Please modify TWENTY_SOURCE_PATH in this script or use the Docker mode instead:"
    echo "   $SCRIPT_DIR/start-twenty.sh"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Navigate to Twenty startup directory for Makefile
cd "$TWENTY_STARTUP_DIR"

echo "🗄️  Starting PostgreSQL..."
make postgres-on-docker

echo "🔴 Starting Redis..."
make redis-on-docker

echo "⏳ Waiting for databases to be ready..."
sleep 5

# Navigate to Twenty source
cd "$TWENTY_SOURCE_PATH"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Setup server environment
cd "$TWENTY_SOURCE_PATH/packages/twenty-server"
if [ ! -f ".env" ]; then
    echo "📝 Setting up server environment..."
    cp .env.example .env
    # Override for development
    cat > .env << EOF
NODE_ENV=development
PG_DATABASE_URL=postgres://postgres:postgres@localhost:5432/default
REDIS_URL=redis://localhost:6379
APP_SECRET=$(openssl rand -base64 32)
SIGN_IN_PREFILLED=true
FRONTEND_URL=http://localhost:3001
SERVER_URL=http://localhost:3000
EOF
fi

# Setup frontend environment
cd "$TWENTY_SOURCE_PATH/packages/twenty-front"
if [ ! -f ".env" ]; then
    echo "📝 Setting up frontend environment..."
    cp .env.example .env
fi

# Initialize database
cd "$TWENTY_SOURCE_PATH/packages/twenty-server"
echo "🗄️  Initializing database..."
yarn database:reset

echo ""
echo "✅ Development environment ready!"
echo ""
echo "🚀 To start Twenty in development mode:"
echo "   cd $TWENTY_SOURCE_PATH"
echo "   yarn start"
echo ""
echo "📍 Development URLs will be:"
echo "   • Backend API: http://localhost:3000"
echo "   • Frontend UI: http://localhost:3001"
echo "   • GraphQL Playground: http://localhost:3000/graphql"
echo ""
echo "🔧 For MCP Server Testing:"
echo "   • Set TWENTY_API_URL=http://localhost:3000"
echo "   • Test MCP server: npm run discover"
echo ""
echo "🛑 To stop databases:"
echo "   docker stop twenty_pg twenty_redis"
echo "   docker rm twenty_pg twenty_redis"
echo ""
echo "💡 Tip: For easier management, use npm run twenty:quick instead"