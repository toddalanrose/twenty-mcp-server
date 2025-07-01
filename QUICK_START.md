# Quick Start Guide

Get the Twenty MCP Server running in under 5 minutes.

## Prerequisites

- Docker and Docker Compose
- Node.js 18+
- Git

## 1. Setup

```bash
# Clone and install
git clone <repo-url>
cd twenty-mcp-server
npm install
```

## 2. Start Twenty CRM

```bash
# Smart start (only starts what's needed)
npm run twenty:quick
```

Wait for "Twenty CRM is ready!" message.

## 3. Configure Twenty

1. Open http://localhost:3000
2. Create workspace and user account
3. Go to Settings > API
4. Generate an API key

## 4. Configure MCP Server

```bash
# Setup environment file
npm run twenty:setup
```

Edit `.env` file and add your API key:
```bash
TWENTY_API_KEY=your_actual_api_key_here
```

## 5. Test MCP Integration

```bash
# Test API discovery
npm run discover

# Start MCP server
npm run dev
```

## Daily Usage

```bash
# Check status
npm run twenty:status

# Smart start (if needed)
npm run twenty:quick

# Test MCP server
npm run discover
```

## Troubleshooting

- **Twenty won't start**: `npm run twenty:logs`
- **Connection issues**: `npm run twenty:status`
- **Fresh restart**: `npm run twenty:start` (resets everything)
- **View help**: `npm run twenty:help`

## Next Steps

- Explore API discovery reports in `./reports/`
- Check GraphQL playground: http://localhost:3000/graphql
- View Twenty logs: `npm run twenty:logs follow`
- Read full docs: `./scripts/README.md`