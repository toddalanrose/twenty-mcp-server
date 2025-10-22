import { MCPServer } from './mcp/MCPServer.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import express from 'express';
import axios from 'axios';

async function main() {
  try {
    logger.info('Initializing Twenty MCP Server (Standalone Mode)...');
    
    const server = new MCPServer(config);
    await server.initialize();
    
    // Create Express app
    const app = express();
    app.use(express.json());
    
    // CORS middleware for browser access
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
      }
      next();
    });
    
    // Health check
    app.get('/', (req, res) => {
      res.json({ 
        status: 'healthy',
        mode: 'standalone',
        service: 'twenty-mcp-server',
        message: 'MCP Server is ready for connections',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/',
          contacts: '/api/contacts',
          companies: '/api/companies',
          opportunities: '/api/opportunities'
        }
      });
    });
    
    // Get all contacts/people
    app.get('/api/contacts', async (req, res) => {
      try {
        const response = await axios.get(`${config.TWENTY_API_URL}/rest/people`, {
          headers: {
            'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          params: req.query // Pass through query parameters
        });
        res.json(response.data);
      } catch (error: any) {
        logger.error('Failed to fetch contacts:', error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to fetch contacts',
          message: error.response?.data?.message || error.message
        });
      }
    });
    
    // Get single contact
    app.get('/api/contacts/:id', async (req, res) => {
      try {
        const response = await axios.get(`${config.TWENTY_API_URL}/rest/people/${req.params.id}`, {
          headers: {
            'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });
        res.json(response.data);
      } catch (error: any) {
        logger.error('Failed to fetch contact:', error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to fetch contact',
          message: error.response?.data?.message || error.message
        });
      }
    });
    
    // Create contact
    app.post('/api/contacts', async (req, res) => {
      try {
        const response = await axios.post(
          `${config.TWENTY_API_URL}/rest/people`,
          req.body,
          {
            headers: {
              'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        res.json(response.data);
      } catch (error: any) {
        logger.error('Failed to create contact:', error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to create contact',
          message: error.response?.data?.message || error.message
        });
      }
    });
    
    // Update contact
    app.put('/api/contacts/:id', async (req, res) => {
      try {
        const response = await axios.put(
          `${config.TWENTY_API_URL}/rest/people/${req.params.id}`,
          req.body,
          {
            headers: {
              'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        res.json(response.data);
      } catch (error: any) {
        logger.error('Failed to update contact:', error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to update contact',
          message: error.response?.data?.message || error.message
        });
      }
    });
    
    // Get all companies
    app.get('/api/companies', async (req, res) => {
      try {
        const response = await axios.get(`${config.TWENTY_API_URL}/rest/companies`, {
          headers: {
            'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          params: req.query
        });
        res.json(response.data);
      } catch (error: any) {
        logger.error('Failed to fetch companies:', error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to fetch companies',
          message: error.response?.data?.message || error.message
        });
      }
    });
    
    // Get all opportunities
    app.get('/api/opportunities', async (req, res) => {
      try {
        const response = await axios.get(`${config.TWENTY_API_URL}/rest/opportunities`, {
          headers: {
            'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          params: req.query
        });
        res.json(response.data);
      } catch (error: any) {
        logger.error('Failed to fetch opportunities:', error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to fetch opportunities',
          message: error.response?.data?.message || error.message
        });
      }
    });
    
    const port = config.MCP_SERVER_PORT || 3001;
    app.listen(port, () => {
      logger.info(`Twenty MCP Server running on port ${port}`);
      logger.info('Ready to accept connections');
      logger.info('Available endpoints:');
      logger.info('  GET  / - Health check');
      logger.info('  GET  /api/contacts - List all contacts');
      logger.info('  GET  /api/contacts/:id - Get single contact');
      logger.info('  POST /api/contacts - Create contact');
      logger.info('  PUT  /api/contacts/:id - Update contact');
      logger.info('  GET  /api/companies - List all companies');
      logger.info('  GET  /api/opportunities - List all opportunities');
    });
    
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
