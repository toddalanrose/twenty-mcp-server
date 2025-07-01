#!/bin/bash

# Twenty CRM Logs Viewer
# Easy access to container logs

set -e

# Get script directory for path resolution
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TWENTY_STARTUP_DIR="$SCRIPT_DIR/twenty-startup"

# Navigate to Twenty startup directory
cd "$TWENTY_STARTUP_DIR"

# Parse command line arguments
SERVICE="${1:-all}"
LINES="${2:-50}"

echo "📋 Twenty CRM Logs ($SERVICE)"
echo "=============================="

case "$SERVICE" in
    "all"|"")
        echo "Showing logs for all services (last $LINES lines each):"
        docker compose logs --tail="$LINES"
        ;;
    "server")
        echo "Showing server logs (last $LINES lines):"
        docker compose logs server --tail="$LINES"
        ;;
    "db"|"database")
        echo "Showing database logs (last $LINES lines):"
        docker compose logs db --tail="$LINES"
        ;;
    "redis")
        echo "Showing Redis logs (last $LINES lines):"
        docker compose logs redis --tail="$LINES"
        ;;
    "worker")
        echo "Showing worker logs (last $LINES lines):"
        docker compose logs worker --tail="$LINES"
        ;;
    "follow"|"tail"|"-f")
        echo "Following all logs (press Ctrl+C to stop):"
        docker compose logs -f
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [service] [lines]"
        echo ""
        echo "Services:"
        echo "  all, ''    - All services (default)"
        echo "  server     - Twenty backend server"
        echo "  db         - PostgreSQL database"
        echo "  redis      - Redis cache"
        echo "  worker     - Background worker"
        echo "  follow     - Follow all logs in real-time"
        echo ""
        echo "Lines: Number of recent lines to show (default: 50)"
        echo ""
        echo "Examples:"
        echo "  $0                 # Show last 50 lines of all services"
        echo "  $0 server          # Show last 50 lines of server"
        echo "  $0 server 100      # Show last 100 lines of server"
        echo "  $0 follow          # Follow all logs in real-time"
        ;;
    *)
        echo "❌ Unknown service: $SERVICE"
        echo "Use 'help' to see available services"
        exit 1
        ;;
esac