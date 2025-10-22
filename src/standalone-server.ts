import { MCPServer } from './mcp/MCPServer.js';  // Add .js
import { config } from './utils/config.js';       // Add .js
import { logger } from './utils/logger.js';       // Add .js
import http from 'http';

async function main() {
  try {
    logger.info('Initializing Twenty MCP Server (Standalone Mode)...');
    
    const server = new MCPServer(config);
    await server.initialize();
    
    // Create HTTP server for health checks and info
    const port = config.MCP_SERVER_PORT || 3001;
    const httpServer = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        status: 'healthy',
        mode: 'standalone',
        service: 'twenty-mcp-server',
        message: 'MCP Server is ready for connections',
        timestamp: new Date().toISOString()
      }));
    });
    
    httpServer.listen(port, () => {
      logger.info(`Twenty MCP Server running on port ${port}`);
      logger.info('Ready to accept MCP connections');
    });
    
    // Keep the process alive
    process.on('SIGTERM', () => {
      logger.info('Received SIGTERM, shutting down gracefully');
      httpServer.close(() => {
        process.exit(0);
      });
    });
    
  } catch (error) {
    logger.error('Failed to start Twenty MCP Server:', error);
    process.exit(1);
  }
}

main();
