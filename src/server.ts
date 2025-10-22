import { MCPServer } from './mcp/MCPServer';
import { config } from './utils/config';
import { logger } from './utils/logger';
import http from 'http';

async function main() {
  try {
    logger.info('Initializing Twenty MCP Server...');
    
    const server = new MCPServer(config);
    await server.initialize();
    
    // Start MCP server with STDIO
    await server.start();
    
    // Add HTTP health check endpoint for Coolify
    const healthPort = process.env.PORT || 3001;
    const healthServer = http.createServer((req, res) => {
      if (req.url === '/health' || req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          service: 'twenty-mcp-server',
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });
    
    healthServer.listen(healthPort, () => {
      logger.info(`Health check endpoint listening on port ${healthPort}`);
    });
    
    logger.info('Twenty MCP Server is running with STDIO transport');
    
    // Keep the process alive
    process.stdin.resume();
    
  } catch (error) {
    logger.error('Failed to start Twenty MCP Server:', error);
    process.exit(1);
  }
}

main();
