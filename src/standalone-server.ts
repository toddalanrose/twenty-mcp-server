import { MCPServer } from './mcp/MCPServer.js';
import { config } from './utils/config.js';
import { logger } from './utils/logger.js';
import express from 'express';
import axios from 'axios';

async function main(): Promise<void> {
  try {
    logger.info('Initializing Twenty MCP Server (Standalone Mode)...');
    
    const server = new MCPServer(config);
    await server.initialize();
    
    // Create Express app
    const app = express();
    app.use(express.json());
    
    // CORS middleware for browser access
    app.use((req, res, next): void => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });
    
    // Health check - ONLY for root path
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
        logger.info('Fetching contacts from Twenty CRM');
        const response = await axios.get(`${config.TWENTY_API_URL}/rest/people`, {
          headers: {
            'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
            'Content-Type': 'application/json'
          },
          params: req.query // Pass through query parameters
        });
        logger.info(`Successfully fetched ${response.data.data?.length || 0} contacts`);
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
        logger.info(`Fetching contact ${req.params.id} from Twenty CRM`);
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
        logger.info('Creating new contact in Twenty CRM', { body: req.body });
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
        logger.info('Successfully created contact', { id: response.data.data?.id });
        res.json(response.data);
      } catch (error: any) {
        logger.error('Failed to create contact:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to create contact',
          message: error.response?.data?.message || error.message,
          details: error.response?.data
        });
      }
    });
    
    // Update contact
    app.put('/api/contacts/:id', async (req, res) => {
      try {
        logger.info(`Updating contact ${req.params.id} in Twenty CRM`);
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
    
    // Delete contact
    app.delete('/api/contacts/:id', async (req, res) => {
      try {
        logger.info(`Deleting contact ${req.params.id} from Twenty CRM`);
        const response = await axios.delete(
          `${config.TWENTY_API_URL}/rest/people/${req.params.id}`,
          {
            headers: {
              'Authorization': `Bearer ${config.TWENTY_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        res.json({ success: true, message: 'Contact deleted successfully' });
      } catch (error: any) {
        logger.error('Failed to delete contact:', error.message);
        res.status(error.response?.status || 500).json({ 
          error: 'Failed to delete contact',
          message: error.response?.data?.message || error.message
        });
      }
    });
    
    // Get all companies
    app.get('/api/companies', async (req, res) => {
      try {
        logger.info('Fetching companies from Twenty CRM');
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
        logger.info('Fetching opportunities from Twenty CRM');
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
    
    // Catch-all for undefined routes (for debugging)
    app.use('*', (req, res) => {
      logger.warn(`Unhandled route: ${req.method} ${req.originalUrl}`);
      res.status(404).json({
        error: 'Route not found',
        method: req.method,
        path: req.originalUrl,
        availableEndpoints: {
          health: 'GET /',
          contacts: {
            list: 'GET /api/contacts',
            get: 'GET /api/contacts/:id',
            create: 'POST /api/contacts',
            update: 'PUT /api/contacts/:id',
            delete: 'DELETE /api/contacts/:id'
          },
          companies: 'GET /api/companies',
          opportunities: 'GET /api/opportunities'
        }
      });
    });
    
    const port = config.MCP_SERVER_PORT || 3001;
    app.listen(port, () => {
      logger.info(`Twenty MCP Server running on port ${port}`);
      logger.info('Ready to accept connections');
      logger.info('Available endpoints:');
      logger.info('  GET    / - Health check');
      logger.info('  GET    /api/contacts - List all contacts');
      logger.info('  GET    /api/contacts/:id - Get single contact');
      logger.info('  POST   /api/contacts - Create contact');
      logger.info('  PUT    /api/contacts/:id - Update contact');
      logger.info('  DELETE /api/contacts/:id - Delete contact');
      logger.info('  GET    /api/companies - List all companies');
      logger.info('  GET    /api/opportunities - List all opportunities');
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
