#!/bin/bash

# Setup MCP Testing Environment
# Creates proper .env file for MCP server testing against Twenty

set -e

# Get script directory for path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔧 Setting up MCP Testing Environment..."
echo "Project Root: $PROJECT_ROOT"

# Check if Twenty is running
if ! curl -f http://localhost:3000/healthz >/dev/null 2>&1; then
    echo "❌ Twenty CRM is not running on localhost:3000"
    echo "Please start Twenty first:"
    echo "   npm run twenty:quick    # Smart start (recommended)"
    echo "   npm run twenty:start    # Force restart"
    exit 1
fi

# Create or update .env file for MCP server
ENV_FILE="$PROJECT_ROOT/.env"

echo "📝 Creating MCP server .env file..."

cat > "$ENV_FILE" << EOF
# Twenty CRM Configuration for MCP Testing
TWENTY_API_URL=http://localhost:3000
TWENTY_API_KEY=your_api_key_here

# MCP Server Configuration
MCP_SERVER_PORT=3001
LOG_LEVEL=debug

# Performance Tuning for Testing
CACHE_ENABLED=true
CACHE_TTL_SECONDS=60
MAX_CONCURRENT_REQUESTS=5
REQUEST_TIMEOUT_MS=10000

# Monitoring for Development
METRICS_ENABLED=true
LOG_API_CALLS=true
EOF

echo "✅ Created .env file at: $ENV_FILE"
echo ""
echo "🔑 Next Steps:"
echo "1. Open Twenty CRM: http://localhost:3000"
echo "2. Create a workspace and user account"
echo "3. Generate an API key in Settings > API"
echo "4. Update TWENTY_API_KEY in $ENV_FILE"
echo "5. Test MCP server: npm run discover"
echo ""
echo "🧪 Quick Test Commands:"
echo "   • Test connection: npm run discover"
echo "   • View logs: npm run dev"
echo "   • Run tests: npm test"
echo ""
echo "📚 API Documentation:"
echo "   • GraphQL Playground: http://localhost:3000/graphql"
echo "   • Health Check: http://localhost:3000/healthz"
echo ""
echo "🐛 Troubleshooting:"
echo "   • Check status: npm run twenty:status"
echo "   • Check logs: npm run twenty:logs"
echo "   • Restart Twenty: npm run twenty:quick"
echo "   • Check ports: lsof -i :3000"