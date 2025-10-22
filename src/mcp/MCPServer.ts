import { logger } from '../utils/logger';
import { config } from '../config';
import axios from 'axios';

export class MCPServer {
  private config: typeof config;
  
  constructor(cfg: typeof config) {
    this.config = cfg;
  }
  
  async initialize() {
    logger.info('Validating connection to Twenty CRM...');
    
    // Test the Twenty API connection
    try {
      const response = await axios.get(`${this.config.twentyApiUrl}/rest/metadata/objects`, {
        headers: {
          'Authorization': `Bearer ${this.config.twentyApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 200) {
        logger.info('Twenty CRM connection validated successfully');
      }
    } catch (error) {
      logger.error('Failed to connect to Twenty CRM:', error);
      throw error;
    }
  }
  
  async start() {
    logger.info('Starting MCP server with STDIO transport');
    // MCP server logic would go here
    // For now, just keep the process alive
  }
}
