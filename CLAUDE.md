# Twenty MCP Server - AI Instructions

## Meta
Project: MCP Server for Twenty CRM integration  
Updates: AI-optimized, save tokens, maintain structure
AI-first: code for AI not humans, lateral thinking, math/functional

## Tech Stack
- TypeScript/Node.js - MCP server with @modelcontextprotocol/sdk v1.0.0
- Twenty CRM API - GraphQL (primary) + REST integration
- Jest - testing framework with TypeScript support
- Docker - containerization for deployment

## Dev Environment  
Scripts: npm run dev|build|test|lint|format
Testing: Jest with --passWithNoTests, coverage tracking
Linting: ESLint v9 flat config + Prettier
Build: TypeScript strict mode, ES2022 target

## Development Rules
No breadcrumbs: cleanup test scripts
Dev principles: test=ask | new port => chk avail | modularity | MVP focus | no-cost | sudo→ask | simplicity>complexity
TDD: tests→commit→code→iterate→commit | no test mods | no mocks
AI-first: code for AI not humans, lateral thinking, math/functional, standard hw/sw only
Tools: prefer modern/performance | use existing when poss
Tool usage: maximum efficiency: multiple operations = invoke tools simultaneously
Comments: only major sections | max 2-3 words | non-verbose

## MCP Architecture
- MCP-first: follow Model Context Protocol specifications exactly
- Tools: CRM operations (create, read, update, delete, search)
- Resources: Data access (schema, records, analytics)
- Prompts: AI interaction templates
- API-first: Twenty's GraphQL/REST APIs exclusively
- No direct DB access - use Twenty's APIs only

## File Structure
- src/ - TypeScript source code
- src/server.ts - Main MCP server entry point
- src/twenty-client/ - Twenty API client (GraphQL + REST)
- src/tools/ - MCP tool implementations  
- src/types/ - TypeScript interfaces and types
- src/utils/ - Configuration and logging utilities
- tests/ - Jest test files (unit, integration, e2e)
- docker/ - Containerization files

## Security & Performance
- Never store Twenty data outside Twenty instance
- Use Twenty's authentication system (API keys only)
- Dynamic schema introspection for custom fields
- Real-time updates via WebSocket where possible
- Performance: <2s simple queries, <5s complex analytics
- Concurrent support: 10+ AI interactions per instance
- Rate limiting, audit logging, error handling