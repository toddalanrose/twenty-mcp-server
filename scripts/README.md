# Twenty CRM Startup Scripts

Scripts to easily start Twenty CRM for testing the MCP server integration.

## Quick Start

```bash
# Smart start (only starts what's needed, no resets)
npm run twenty:quick

# Setup MCP testing environment
npm run twenty:setup

# Test MCP server against Twenty
npm run discover
```

## Available Scripts

### Smart Commands (Recommended)

- **`npm run twenty:quick`** - Smart start (only starts what's needed, preserves data)
- **`npm run twenty:status`** - Check current status without starting anything
- **`npm run twenty:logs`** - View container logs (supports service filtering)

### Full Control Commands

- **`npm run twenty:start`** - Force restart complete Twenty stack with Docker
- **`npm run twenty:stop`** - Stop Twenty services
- **`npm run twenty:setup`** - Configure MCP .env for testing

### Development Mode

- **`npm run twenty:dev`** - Start databases only, requires Twenty source code

### Testing Commands

- **`npm run discover`** - Run API discovery against Twenty
- **`npm run twenty:help`** - Show all Twenty commands

## File Structure

```
scripts/
├── start-twenty.sh           # Main startup script (Docker)
├── stop-twenty.sh            # Stop Twenty services
├── twenty-startup-dev.sh     # Development mode setup
├── setup-mcp-testing.sh      # Configure MCP testing
└── twenty-startup/
    ├── docker-compose.yml    # Twenty Docker configuration
    ├── .env                  # Environment variables
    ├── .env.example          # Environment template
    └── Makefile              # Individual service commands
```

## Usage Examples

### 1. Smart Start (Recommended)

```bash
# Smart start - only starts what's needed
npm run twenty:quick

# Check status anytime
npm run twenty:status

# Setup MCP environment
npm run twenty:setup

# Edit .env file with your API key
# Then test MCP server
npm run discover
```

### 2. Fresh Start (if needed)

```bash
# Force complete restart (resets everything)
npm run twenty:start

# Then continue with setup
npm run twenty:setup
```

### 3. Development Mode (requires Twenty source)

```bash
# Start databases only
npm run twenty:dev

# In separate terminal, start Twenty from source
cd /path/to/twenty
yarn start
```

### 4. Daily Development Workflow

```bash
# 1. Check if Twenty is running
npm run twenty:status

# 2. Smart start (only starts what's needed)
npm run twenty:quick

# 3. Configure MCP (first time only)
npm run twenty:setup
# Edit .env with your API key

# 4. Test MCP integration
npm run discover

# 5. Development cycle
npm run dev  # Start MCP server
# Make changes, test against Twenty

# 6. Check logs if needed
npm run twenty:logs server

# 7. Stop when done (optional - keeps data)
npm run twenty:stop
```

## Configuration

### Environment Files

**`.env`** (MCP Server):
```bash
TWENTY_API_URL=http://localhost:3000
TWENTY_API_KEY=your_api_key_here
LOG_LEVEL=debug
```

**`scripts/twenty-startup/.env`** (Twenty Docker):
```bash
SERVER_URL=http://localhost:3000
APP_SECRET=auto_generated_secret
STORAGE_TYPE=local
```

### Ports Used

- **3000**: Twenty backend API
- **3001**: MCP server (default)
- **5432**: PostgreSQL database
- **6379**: Redis cache

## Troubleshooting

### Twenty won't start
```bash
# Check current status
npm run twenty:status

# Check Docker
docker info

# View logs
npm run twenty:logs

# Force fresh start if needed
npm run twenty:start
```

### MCP connection issues
```bash
# Verify Twenty is running
curl http://localhost:3000/healthz

# Check MCP configuration
cat .env

# Test with verbose logging
LOG_LEVEL=debug npm run discover
```

### Database issues
```bash
# Reset Twenty data
cd scripts/twenty-startup
docker-compose down -v
docker-compose up -d
```

## API Testing

Once Twenty is running:

- **Health Check**: http://localhost:3000/healthz
- **GraphQL Playground**: http://localhost:3000/graphql
- **REST API**: http://localhost:3000/rest/*
- **Web Interface**: http://localhost:3000

## Path Optimizations

All scripts use absolute path resolution:
- Scripts work from any directory
- Relative paths resolved dynamically
- No hardcoded paths (except Twenty source location)
- Environment variables properly scoped