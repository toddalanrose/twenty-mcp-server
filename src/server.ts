#!/usr/bin/env node

/**
 * Twenty MCP Server
 * Main entry point for the MCP server that integrates with Twenty CRM
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import { TwentyClient } from './twenty-client/index.js';

class TwentyMCPServer {
  private server: Server;
  private twentyClient: TwentyClient;

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
      await this.twentyClient.validateConnection();
      
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

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info('Twenty MCP Server is running');
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const server = new TwentyMCPServer();
  
  server
    .initialize()
    .then(() => server.run())
    .catch((error) => {
      logger.error('Server startup failed:', error);
      process.exit(1);
    });
}

export { TwentyMCPServer };