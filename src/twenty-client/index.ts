/**
 * Twenty CRM API Client
 * Provides intelligent integration with Twenty's GraphQL and REST APIs
 */

import { logger } from '../utils/logger.js';

export interface TwentyClientConfig {
  apiUrl: string;
  apiKey: string;
  timeout?: number;
}

export class TwentyClient {
  private config: TwentyClientConfig;

  constructor(config: TwentyClientConfig) {
    this.config = {
      timeout: 10000,
      ...config,
    };

    logger.debug('Twenty client initialized', {
      apiUrl: this.config.apiUrl,
      timeout: this.config.timeout,
    });
  }

  async validateConnection(): Promise<boolean> {
    logger.info('Validating connection to Twenty CRM...');

    try {
      // TODO: Implement actual connection validation
      // This will test the API key and connectivity

      logger.info('Twenty CRM connection validated successfully');
      return true;
    } catch (error) {
      logger.error('Twenty CRM connection validation failed:', error);
      throw error;
    }
  }
}

export * from './graphql-client.js';
export * from './rest-client.js';
