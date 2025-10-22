import { MCPServer } from './mcp/MCPServer.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';

async function main() {
  try {
    logger.info('Initializing Twenty MCP Server...');
    
    const server = new MCPServer(config);
    await server.initialize();
    await server.start();
    
    // Keep the process alive
    process.stdin.resume();
    
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start Twenty MCP Server:', error);
    process.exit(1);
  }
}

main();
