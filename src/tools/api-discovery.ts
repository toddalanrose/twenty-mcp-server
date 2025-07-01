/**
 * Twenty API Discovery Tool
 * Comprehensive analysis tool for Twenty CRM API behavior
 */

import axios, { AxiosInstance } from 'axios';
import { GraphQLClient } from 'graphql-request';
import { logger } from '../utils/logger.js';

interface GraphQLType {
  name: string;
  kind: string;
  fields?: GraphQLField[];
}

interface GraphQLField {
  name: string;
  type?: {
    name?: string;
    kind?: string;
  };
}

interface GraphQLSchema {
  types?: GraphQLType[];
  version?: string;
}

export interface APIDiscoveryConfig {
  twentyApiUrl: string;
  twentyApiKey: string;
  maxConcurrentRequests: number;
  testIterations: number;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  averageLatency: number;
  minLatency: number;
  maxLatency: number;
  successRate: number;
  requestsPerSecond: number;
  errors: string[];
}

export interface SchemaAnalysis {
  customFields: Record<string, { type: string; kind: string }>;
  relationships: Record<string, { targetType: string; relationType: string }>;
  dataTypes: string[];
  schemaVersion: string;
}

export interface AuthAnalysis {
  validationTime: number;
  tokenScopes: string[];
  permissionModel: Record<string, string | string[]>;
  errorPatterns: string[];
}

export interface APIDiscoveryReport {
  timestamp: string;
  twentyVersion: string;
  performanceMetrics: {
    graphql: PerformanceMetrics[];
    rest: PerformanceMetrics[];
    comparison: {
      fasterAPI: 'graphql' | 'rest';
      recommendations: string[];
    };
  };
  schemaAnalysis: SchemaAnalysis;
  authAnalysis: AuthAnalysis;
  rateLimiting: {
    limitsDetected: boolean;
    maxRequestsPerMinute: number;
    recommendedBatchSize: number;
  };
  cacheAnalysis: {
    cacheable: string[];
    ttlRecommendations: Record<string, number>;
  };
  recommendations: {
    apiSelection: Record<string, 'graphql' | 'rest'>;
    optimization: string[];
    errorHandling: string[];
  };
}

export class TwentyAPIDiscovery {
  private restClient: AxiosInstance;
  private graphqlClient: GraphQLClient;
  private config: APIDiscoveryConfig;

  constructor(config: APIDiscoveryConfig) {
    this.config = config;

    // Initialize REST client
    this.restClient = axios.create({
      baseURL: config.twentyApiUrl,
      headers: {
        Authorization: `Bearer ${config.twentyApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // Initialize GraphQL client
    this.graphqlClient = new GraphQLClient(`${config.twentyApiUrl}/graphql`, {
      headers: {
        Authorization: `Bearer ${config.twentyApiKey}`,
      },
    });
  }

  async runCompleteAnalysis(): Promise<APIDiscoveryReport> {
    logger.info('Starting comprehensive Twenty API discovery...');

    const startTime = Date.now();
    const report: APIDiscoveryReport = {
      timestamp: new Date().toISOString(),
      twentyVersion: await this.detectTwentyVersion(),
      performanceMetrics: {
        graphql: [],
        rest: [],
        comparison: {
          fasterAPI: 'graphql',
          recommendations: [],
        },
      },
      schemaAnalysis: {
        customFields: {},
        relationships: {},
        dataTypes: [],
        schemaVersion: '',
      },
      authAnalysis: {
        validationTime: 0,
        tokenScopes: [],
        permissionModel: {},
        errorPatterns: [],
      },
      rateLimiting: {
        limitsDetected: false,
        maxRequestsPerMinute: 0,
        recommendedBatchSize: 1,
      },
      cacheAnalysis: {
        cacheable: [],
        ttlRecommendations: {},
      },
      recommendations: {
        apiSelection: {},
        optimization: [],
        errorHandling: [],
      },
    };

    try {
      // Run parallel analysis
      const [
        performanceResults,
        schemaResults,
        authResults,
        rateLimitResults,
        cacheResults,
      ] = await Promise.all([
        this.analyzePerformance(),
        this.analyzeSchema(),
        this.analyzeAuthentication(),
        this.analyzeRateLimiting(),
        this.analyzeCaching(),
      ]);

      // Compile results
      report.performanceMetrics = performanceResults;
      report.schemaAnalysis = schemaResults;
      report.authAnalysis = authResults;
      report.rateLimiting = rateLimitResults;
      report.cacheAnalysis = cacheResults;
      report.recommendations = this.generateRecommendations(report);

      const totalTime = Date.now() - startTime;
      logger.info(`API discovery completed in ${totalTime}ms`);

      return report;
    } catch (error) {
      logger.error('API discovery failed:', error);
      throw error;
    }
  }

  private async detectTwentyVersion(): Promise<string> {
    try {
      const response = await this.restClient.get('/health');
      return response.data?.version ?? 'unknown';
    } catch (error) {
      logger.warn('Could not detect Twenty version:', error);
      return 'unknown';
    }
  }

  private async analyzePerformance(): Promise<{
    graphql: PerformanceMetrics[];
    rest: PerformanceMetrics[];
    comparison: { fasterAPI: 'graphql' | 'rest'; recommendations: string[] };
  }> {
    logger.info('Analyzing API performance...');

    const testOperations = [
      { name: 'list_contacts', type: 'read' },
      { name: 'get_contact', type: 'read' },
      { name: 'create_contact', type: 'write' },
      { name: 'update_contact', type: 'write' },
      { name: 'list_companies', type: 'read' },
      { name: 'search_all', type: 'search' },
    ];

    const graphqlMetrics: PerformanceMetrics[] = [];
    const restMetrics: PerformanceMetrics[] = [];

    // Test GraphQL operations
    for (const operation of testOperations) {
      const metrics = await this.measureGraphQLOperation(operation);
      graphqlMetrics.push(metrics);
    }

    // Test REST operations
    for (const operation of testOperations) {
      const metrics = await this.measureRESTOperation(operation);
      restMetrics.push(metrics);
    }

    // Generate comparison
    const comparison = this.compareAPIPerformance(graphqlMetrics, restMetrics);

    return {
      graphql: graphqlMetrics,
      rest: restMetrics,
      comparison,
    };
  }

  private async measureGraphQLOperation(operation: {
    name: string;
    type: string;
  }): Promise<PerformanceMetrics> {
    const latencies: number[] = [];
    const errors: string[] = [];
    let successCount = 0;

    const query = this.generateGraphQLQuery(operation.name);

    for (let i = 0; i < this.config.testIterations; i++) {
      const startTime = Date.now();
      try {
        await this.graphqlClient.request(query);
        const latency = Date.now() - startTime;
        latencies.push(latency);
        successCount++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    return {
      endpoint: `graphql/${operation.name}`,
      method: 'POST',
      averageLatency:
        latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
      minLatency: Math.min(...latencies) || 0,
      maxLatency: Math.max(...latencies) || 0,
      successRate: successCount / this.config.testIterations,
      requestsPerSecond:
        1000 / (latencies.reduce((a, b) => a + b, 0) / latencies.length || 1),
      errors: Array.from(new Set(errors)),
    };
  }

  private async measureRESTOperation(operation: {
    name: string;
    type: string;
  }): Promise<PerformanceMetrics> {
    const latencies: number[] = [];
    const errors: string[] = [];
    let successCount = 0;

    const { endpoint, method } = this.generateRESTEndpoint(operation.name);

    for (let i = 0; i < this.config.testIterations; i++) {
      const startTime = Date.now();
      try {
        await this.restClient.request({ url: endpoint, method });
        const latency = Date.now() - startTime;
        latencies.push(latency);
        successCount++;
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }

    return {
      endpoint,
      method,
      averageLatency:
        latencies.reduce((a, b) => a + b, 0) / latencies.length || 0,
      minLatency: Math.min(...latencies) || 0,
      maxLatency: Math.max(...latencies) || 0,
      successRate: successCount / this.config.testIterations,
      requestsPerSecond:
        1000 / (latencies.reduce((a, b) => a + b, 0) / latencies.length || 1),
      errors: Array.from(new Set(errors)),
    };
  }

  private generateGraphQLQuery(operationName: string): string {
    const queries = {
      list_contacts: `
        query ListContacts {
          people {
            edges {
              node {
                id
                name { firstName lastName }
                email
                phone
                createdAt
              }
            }
          }
        }
      `,
      get_contact: `
        query GetContact($id: ID!) {
          person(id: $id) {
            id
            name { firstName lastName }
            email
            phone
            createdAt
            updatedAt
          }
        }
      `,
      create_contact: `
        mutation CreateContact($input: PersonInput!) {
          createPerson(input: $input) {
            id
            name { firstName lastName }
            email
          }
        }
      `,
      update_contact: `
        mutation UpdateContact($id: ID!, $input: PersonInput!) {
          updatePerson(id: $id, input: $input) {
            id
            name { firstName lastName }
            email
          }
        }
      `,
      list_companies: `
        query ListCompanies {
          companies {
            edges {
              node {
                id
                name
                domainName
                employees
                createdAt
              }
            }
          }
        }
      `,
      search_all: `
        query SearchAll($searchText: String!) {
          searchResults(searchText: $searchText) {
            ... on Person {
              id
              name { firstName lastName }
              email
            }
            ... on Company {
              id
              name
              domainName
            }
          }
        }
      `,
    };

    return (
      queries[operationName as keyof typeof queries] || queries.list_contacts
    );
  }

  private generateRESTEndpoint(operationName: string): {
    endpoint: string;
    method: string;
  } {
    const endpoints = {
      list_contacts: { endpoint: '/rest/people', method: 'GET' },
      get_contact: { endpoint: '/rest/people/1', method: 'GET' },
      create_contact: { endpoint: '/rest/people', method: 'POST' },
      update_contact: { endpoint: '/rest/people/1', method: 'PATCH' },
      list_companies: { endpoint: '/rest/companies', method: 'GET' },
      search_all: { endpoint: '/rest/search?q=test', method: 'GET' },
    };

    return (
      endpoints[operationName as keyof typeof endpoints] ||
      endpoints.list_contacts
    );
  }

  private compareAPIPerformance(
    graphqlMetrics: PerformanceMetrics[],
    restMetrics: PerformanceMetrics[]
  ): { fasterAPI: 'graphql' | 'rest'; recommendations: string[] } {
    const graphqlAvg =
      graphqlMetrics.reduce((sum, m) => sum + m.averageLatency, 0) /
      graphqlMetrics.length;
    const restAvg =
      restMetrics.reduce((sum, m) => sum + m.averageLatency, 0) /
      restMetrics.length;

    return {
      fasterAPI: graphqlAvg < restAvg ? 'graphql' : 'rest',
      recommendations: [
        `GraphQL average latency: ${graphqlAvg.toFixed(2)}ms`,
        `REST average latency: ${restAvg.toFixed(2)}ms`,
        `Recommendation: Use ${graphqlAvg < restAvg ? 'GraphQL' : 'REST'} for better performance`,
      ],
    };
  }

  private async analyzeSchema(): Promise<SchemaAnalysis> {
    logger.info('Analyzing schema structure...');

    try {
      // Use GraphQL introspection to analyze schema
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            types {
              name
              kind
              fields {
                name
                type {
                  name
                  kind
                }
              }
            }
          }
        }
      `;

      const result = await this.graphqlClient.request(introspectionQuery);
      const schema = (result as { __schema: GraphQLSchema }).__schema;

      const customFields = this.extractCustomFields(schema);
      const relationships = this.extractRelationships(schema);
      const dataTypes = this.extractDataTypes(schema);

      return {
        customFields,
        relationships,
        dataTypes,
        schemaVersion: schema.version ?? 'unknown',
      };
    } catch (error) {
      logger.warn('Schema analysis failed:', error);
      return {
        customFields: {},
        relationships: {},
        dataTypes: [],
        schemaVersion: 'unknown',
      };
    }
  }

  private extractCustomFields(
    schema: GraphQLSchema
  ): Record<string, { type: string; kind: string }> {
    // Extract custom fields from schema
    const customFields: Record<string, { type: string; kind: string }> = {};

    schema.types?.forEach(type => {
      if (type.fields) {
        type.fields.forEach(field => {
          if (
            field.name.startsWith('custom_') ||
            field.name.includes('Custom')
          ) {
            customFields[`${type.name}.${field.name}`] = {
              type: field.type?.name ?? 'unknown',
              kind: field.type?.kind ?? 'unknown',
            };
          }
        });
      }
    });

    return customFields;
  }

  private extractRelationships(
    schema: GraphQLSchema
  ): Record<string, { targetType: string; relationType: string }> {
    // Extract relationships from schema
    const relationships: Record<
      string,
      { targetType: string; relationType: string }
    > = {};

    schema.types?.forEach(type => {
      if (type.fields) {
        type.fields.forEach(field => {
          if (
            field.type?.kind === 'LIST' ||
            field.name.endsWith('Connection')
          ) {
            relationships[`${type.name}.${field.name}`] = {
              targetType: field.type?.name ?? 'unknown',
              relationType:
                field.type?.kind === 'LIST' ? 'one-to-many' : 'connection',
            };
          }
        });
      }
    });

    return relationships;
  }

  private extractDataTypes(schema: GraphQLSchema): string[] {
    const dataTypes = new Set<string>();

    schema.types?.forEach(type => {
      if (type.kind === 'SCALAR' || type.kind === 'ENUM') {
        dataTypes.add(type.name);
      }
    });

    return Array.from(dataTypes);
  }

  private async analyzeAuthentication(): Promise<AuthAnalysis> {
    logger.info('Analyzing authentication patterns...');

    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Test token validation
      await this.restClient.get('/rest/me');
      const validationTime = Date.now() - startTime;

      // Test token scopes (attempt various operations)
      const scopes = await this.detectTokenScopes();
      const permissionModel = await this.analyzePermissions();

      return {
        validationTime,
        tokenScopes: scopes,
        permissionModel,
        errorPatterns: errors,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        validationTime: Date.now() - startTime,
        tokenScopes: [],
        permissionModel: {},
        errorPatterns: errors,
      };
    }
  }

  private async detectTokenScopes(): Promise<string[]> {
    const testOperations = [
      { endpoint: '/rest/people', method: 'GET', scope: 'read:people' },
      { endpoint: '/rest/people', method: 'POST', scope: 'write:people' },
      { endpoint: '/rest/companies', method: 'GET', scope: 'read:companies' },
      { endpoint: '/rest/companies', method: 'POST', scope: 'write:companies' },
    ];

    const scopes: string[] = [];

    for (const operation of testOperations) {
      try {
        await this.restClient.request({
          url: operation.endpoint,
          method: operation.method as 'GET' | 'POST' | 'PATCH' | 'DELETE',
          data: operation.method === 'POST' ? { name: 'test' } : undefined,
        });
        scopes.push(operation.scope);
      } catch {
        // Scope not available
      }
    }

    return scopes;
  }

  private async analyzePermissions(): Promise<
    Record<string, string | string[]>
  > {
    try {
      const response = await this.restClient.get('/rest/me');
      return {
        userId: response.data?.id ?? 'unknown',
        workspaceId: response.data?.workspaceId ?? 'unknown',
        permissions: response.data?.permissions ?? [],
      };
    } catch {
      return {};
    }
  }

  private async analyzeRateLimiting(): Promise<{
    limitsDetected: boolean;
    maxRequestsPerMinute: number;
    recommendedBatchSize: number;
  }> {
    logger.info('Analyzing rate limiting...');

    const testStartTime = Date.now();
    let requestCount = 0;
    let rateLimitHit = false;

    // Send rapid requests to detect rate limiting
    while (Date.now() - testStartTime < 30000 && !rateLimitHit) {
      // 30 second test
      try {
        await this.restClient.get('/rest/me');
        requestCount++;

        // Small delay to avoid overwhelming
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        if (error instanceof Error && error.message.includes('429')) {
          rateLimitHit = true;
          break;
        }
      }
    }

    const testDurationMinutes = (Date.now() - testStartTime) / 60000;
    const requestsPerMinute = requestCount / testDurationMinutes;

    return {
      limitsDetected: rateLimitHit,
      maxRequestsPerMinute: Math.floor(requestsPerMinute),
      recommendedBatchSize: Math.max(1, Math.floor(requestsPerMinute / 10)), // Conservative batch size
    };
  }

  private async analyzeCaching(): Promise<{
    cacheable: string[];
    ttlRecommendations: Record<string, number>;
  }> {
    logger.info('Analyzing caching behavior...');

    const cacheableEndpoints = [
      '/rest/me',
      '/rest/people',
      '/rest/companies',
      '/rest/workspace',
    ];

    const cacheable: string[] = [];
    const ttlRecommendations: Record<string, number> = {};

    for (const endpoint of cacheableEndpoints) {
      try {
        const firstResponse = await this.restClient.get(endpoint);
        const firstHeaders = firstResponse.headers;

        // Check for cache headers
        if (
          firstHeaders['cache-control'] ||
          firstHeaders['etag'] ||
          firstHeaders['last-modified']
        ) {
          cacheable.push(endpoint);

          // Recommend TTL based on data type
          if (endpoint.includes('me') || endpoint.includes('workspace')) {
            ttlRecommendations[endpoint] = 3600; // 1 hour for user/workspace data
          } else {
            ttlRecommendations[endpoint] = 300; // 5 minutes for dynamic data
          }
        }
      } catch {
        // Endpoint not accessible
      }
    }

    return {
      cacheable,
      ttlRecommendations,
    };
  }

  private generateRecommendations(report: APIDiscoveryReport): {
    apiSelection: Record<string, 'graphql' | 'rest'>;
    optimization: string[];
    errorHandling: string[];
  } {
    const recommendations = {
      apiSelection: {} as Record<string, 'graphql' | 'rest'>,
      optimization: [] as string[],
      errorHandling: [] as string[],
    };

    // API selection recommendations
    const graphqlFaster =
      report.performanceMetrics.comparison.fasterAPI === 'graphql';

    recommendations.apiSelection = {
      list_operations: graphqlFaster ? 'graphql' : 'rest',
      single_record: graphqlFaster ? 'graphql' : 'rest',
      bulk_operations: 'graphql', // GraphQL generally better for bulk
      simple_crud: 'rest', // REST simpler for basic CRUD
      complex_queries: 'graphql', // GraphQL better for complex queries
    };

    // Optimization recommendations
    if (report.rateLimiting.limitsDetected) {
      recommendations.optimization.push(
        `Implement batching with max ${report.rateLimiting.recommendedBatchSize} requests per batch`
      );
    }

    if (report.cacheAnalysis.cacheable.length > 0) {
      recommendations.optimization.push(
        `Implement caching for ${report.cacheAnalysis.cacheable.length} endpoints`
      );
    }

    if (report.performanceMetrics.graphql.some(m => m.averageLatency > 1000)) {
      recommendations.optimization.push(
        'Consider query optimization for slow GraphQL operations'
      );
    }

    // Error handling recommendations
    const allErrors = [
      ...report.performanceMetrics.graphql.flatMap(m => m.errors),
      ...report.performanceMetrics.rest.flatMap(m => m.errors),
    ];

    if (allErrors.some(e => e.includes('timeout'))) {
      recommendations.errorHandling.push('Implement timeout retry logic');
    }

    if (allErrors.some(e => e.includes('401') || e.includes('403'))) {
      recommendations.errorHandling.push('Implement token refresh mechanism');
    }

    if (allErrors.some(e => e.includes('429'))) {
      recommendations.errorHandling.push(
        'Implement exponential backoff for rate limiting'
      );
    }

    return recommendations;
  }

  async saveReport(
    report: APIDiscoveryReport,
    filePath: string
  ): Promise<void> {
    const fs = await import('fs/promises');
    await fs.writeFile(filePath, JSON.stringify(report, null, 2));
    logger.info(`API discovery report saved to ${filePath}`);
  }
}
