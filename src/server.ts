#!/usr/bin/env node

/**
 * Twenty MCP Server
 * Main entry point for the MCP server that integrates with Twenty CRM
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import http from 'http';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { TwentyClient } from './twenty-client/index.js';

class TwentyMCPServer {
  private server: Server;
  private twentyClient: TwentyClient;
  private httpServer?: http.Server;
  private transport?: StdioServerTransport | StreamableHTTPServerTransport;
  private httpTransport?: StreamableHTTPServerTransport;

  constructor() {
    this.server = new Server(
      {
        name: 'twenty-crm-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.twentyClient = new TwentyClient({
      apiUrl: config.TWENTY_API_URL,
      apiKey: config.TWENTY_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Twenty MCP Server...');
    
    try {
      // Validate Twenty connection
      logger.info('Validating connection to Twenty CRM...');
      await this.twentyClient.validateConnection();
      logger.info('Twenty CRM connection validated successfully');
      
      // Register MCP tools, resources, and prompts
      this.registerTools();
      this.registerResources();
      this.registerPrompts();
      
      logger.info('Twenty MCP Server initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Twenty MCP Server:', error);
      throw error;
    }
  }

  private registerTools(): void {
    // TODO: Register MCP tools
    logger.debug('Registering MCP tools...');
  }

  private registerResources(): void {
    // TODO: Register MCP resources
    logger.debug('Registering MCP resources...');
  }

  private registerPrompts(): void {
    // TODO: Register MCP prompts
    logger.debug('Registering MCP prompts...');
  }

  async runStdio(): Promise<void> {
    logger.info('Starting MCP server with STDIO transport');
    this.transport = new StdioServerTransport();
    await this.server.connect(this.transport);
    logger.info('Twenty MCP Server is running with STDIO transport');
  }

  async runHttp(port: number = 3001): Promise<void> {
    logger.info(`Starting MCP server with HTTP transport on port ${port}`);
    
    this.httpTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      enableJsonResponse: true, // Enable JSON responses for easier testing and non-SSE clients
      onsessioninitialized: (sessionId) => {
        logger.info(`New MCP session initialized: ${sessionId}`);
      },
    });

    this.transport = this.httpTransport;
    await this.server.connect(this.transport);

    // Create HTTP server
    this.httpServer = http.createServer(async (req, res) => {
      try {
        // Handle CORS for browser clients
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-ID, X-Last-Event-ID');
        
        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        // Health check endpoint
        if (req.url === '/health' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            status: 'healthy', 
            service: 'twenty-mcp-server',
            timestamp: new Date().toISOString(),
            transport: 'http',
            endpoints: {
              health: '/health',
              mcp: '/mcp',
              info: '/info'
            }
          }));
          return;
        }

        // Info endpoint for debugging
        if (req.url === '/info' && req.method === 'GET') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            service: 'twenty-mcp-server',
            version: '1.0.0',
            transport: 'http',
            capabilities: ['tools', 'resources', 'prompts'],
            endpoints: {
              health: 'GET /health - Health check',
              mcp: 'POST /mcp - MCP JSON-RPC endpoint',
              info: 'GET /info - This endpoint'
            },
            usage: {
              initialization: 'POST /mcp with {"jsonrpc": "2.0", "method": "initialize", "params": {}, "id": 1}',
              example: 'curl -X POST http://localhost:3001/mcp -H "Content-Type: application/json" -d \'{"jsonrpc": "2.0", "method": "initialize", "params": {}, "id": 1}\''
            }
          }));
          return;
        }

        // Handle MCP requests
        if (req.url === '/mcp' || req.url === '/') {
          // Automatically add required Accept header if missing
          if (!req.headers.accept || !req.headers.accept.includes('text/event-stream')) {
            req.headers.accept = 'application/json, text/event-stream';
          }

          let body = '';
          if (req.method === 'POST') {
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
              try {
                const parsedBody = body ? JSON.parse(body) : undefined;
                await this.httpTransport!.handleRequest(req, res, parsedBody);
              } catch (error) {
                logger.error('Error parsing request body:', error);
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
          } else {
            await this.httpTransport!.handleRequest(req, res);
          }
          return;
        }

        // 404 for unknown endpoints
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      } catch (error) {
        logger.error('HTTP request error:', error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      }
    });

    // Start HTTP server
    await new Promise<void>((resolve, reject) => {
      this.httpServer!.listen(port, (error?: Error) => {
        if (error) {
          reject(error);
        } else {
          logger.info(`Twenty MCP Server is running on HTTP port ${port}`);
          logger.info(`Health check available at: http://localhost:${port}/health`);
          logger.info(`MCP endpoint available at: http://localhost:${port}/mcp`);
          resolve();
        }
      });
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private async shutdown(): Promise<void> {
    logger.info('Shutting down Twenty MCP Server...');
    
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    if (this.transport) {
      await this.transport.close();
      logger.info('Transport closed');
    }

    logger.info('Twenty MCP Server shutdown complete');
    process.exit(0);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new TwentyMCPServer();
  const transport = process.env.MCP_TRANSPORT || 'stdio';
  const port = parseInt(process.env.MCP_PORT || '3001', 10);
  
  server
    .initialize()
    .then(() => {
      if (transport === 'http') {
        return server.runHttp(port);
      } else {
        return server.runStdio();
      }
    })
    .catch((error) => {
      logger.error('Server startup failed:', error);
      process.exit(1);
    });
}

export { TwentyMCPServer };