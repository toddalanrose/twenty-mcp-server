# Twenty CRM MCP Server - Technical Findings

## Overview

Comprehensive analysis of Twenty CRM codebase to identify all components needed for building a standalone MCP server. Twenty provides sophisticated APIs, authentication, and real-time capabilities that can be fully leveraged for AI integration.

## 1. API Structure & Capabilities

### GraphQL API (Primary Interface)
**Location**: `/graphql` endpoint

#### Core Features
- **Dynamic Schema Generation**: Workspace-specific GraphQL schemas generated at runtime
- **Auto-generated CRUD**: Automatic create, read, update, delete, find, restore, destroy operations
- **Connection-based Pagination**: Standard GraphQL cursor pagination with edges/nodes
- **Aggregation Support**: Built-in count, sum, average, min, max operations
- **Filtering & Sorting**: Comprehensive filter and sort capabilities

#### Schema Structure
```graphql
# Example auto-generated query structure
query {
  companies(filter: {...}, orderBy: {...}, first: 10, after: "cursor") {
    edges {
      node {
        id
        name
        employees
        # Custom fields automatically included
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

#### Metadata API
**Location**: `/metadata` endpoint
- **Schema Introspection**: Query available objects, fields, and relationships
- **Custom Field Management**: Create, update, delete custom fields
- **Permission Queries**: Check user permissions for operations

**Key Implementation Files**:
- `packages/twenty-server/src/engine/api/graphql/workspace-schema.factory.ts`
- `packages/twenty-server/src/engine/api/graphql/workspace-resolver-builder/`
- `packages/twenty-server/src/engine/api/graphql/workspace-query-runner/`

### REST API (Secondary Interface)
**Base Pattern**: `/rest/{objectNamePlural}`

#### Available Endpoints
```typescript
// Standard CRUD operations
GET    /rest/companies           // List companies
GET    /rest/companies/{id}      // Get company by ID
POST   /rest/companies           // Create company
PUT    /rest/companies/{id}      // Update company
DELETE /rest/companies/{id}      // Delete company

// Batch operations
POST   /rest/batch/companies     // Bulk create/update/delete

// Advanced features
GET    /rest/companies/duplicates // Find duplicates
GET    /rest/open-api/core       // OpenAPI documentation
```

#### Response Structure
```typescript
interface RestResponse<T> {
  data: T | T[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
  };
}
```

**Key Implementation Files**:
- `packages/twenty-server/src/engine/api/rest/core/`
- `packages/twenty-server/src/engine/core-modules/open-api/open-api.service.ts`

## 2. Authentication & Security System

### API Key Authentication
**Implementation**: JWT-based long-lived tokens (default 100 years)

#### Token Structure
```typescript
interface ApiKeyToken {
  sub: string;           // Workspace ID
  type: "API_KEY";
  workspaceId: string;   // Workspace identifier
  jwtid: string;         // API key ID for revocation
  iat: number;           // Issued at
  exp: number;           // Expiration (100 years default)
}
```

#### Authentication Flow
1. **API Key Generation**: Users create API keys in Twenty UI
2. **Token Signing**: HMAC-256 signed with workspace-specific secret
3. **Request Authentication**: Bearer token validation on each request
4. **Context Population**: User, workspace, and permission context attached

#### Security Features
- **Workspace Isolation**: API keys scoped to specific workspaces
- **Permission Inheritance**: API key inherits user's role-based permissions
- **Revocation Support**: API keys can be disabled/deleted
- **Audit Logging**: All API calls logged with user context

**Key Implementation Files**:
- `packages/twenty-server/src/engine/core-modules/auth/services/api-key.service.ts`
- `packages/twenty-server/src/engine/guards/jwt-auth.guard.ts`
- `packages/twenty-server/src/engine/core-modules/auth/token/services/access-token.service.ts`

### Permission Model
```typescript
interface WorkspaceMember {
  userId: string;
  workspaceId: string;
  role: 'ADMIN' | 'MEMBER' | 'VIEWER';
  permissions: {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}
```

## 3. Data Models & Schema System

### Dynamic Object Metadata
**Core Concept**: All data structures defined through metadata rather than static code

#### Object Metadata Structure
```typescript
interface ObjectMetadata {
  id: string;
  nameSingular: string;      // e.g., "company"
  namePlural: string;        // e.g., "companies"
  labelSingular: string;     // e.g., "Company"
  labelPlural: string;       // e.g., "Companies"
  description?: string;
  icon: string;
  isCustom: boolean;
  isActive: boolean;
  fields: FieldMetadata[];
  indexes: IndexMetadata[];
}
```

#### Field Metadata Types
**Comprehensive Type Support** (20+ field types):

```typescript
// Basic field types
type FieldType = 
  | 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE_TIME' | 'UUID'
  | 'EMAIL' | 'PHONE' | 'URL' | 'CURRENCY' 
  | 'SELECT' | 'MULTI_SELECT'
  | 'FULL_NAME' | 'ADDRESS' | 'LINKS' | 'EMAILS' | 'PHONES'
  | 'RELATION' | 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';

interface FieldMetadata {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  isCustom: boolean;
  isActive: boolean;
  isNullable: boolean;
  defaultValue?: any;
  settings?: Record<string, any>;
}
```

#### Schema Introspection Capabilities
- **Real-time Schema Discovery**: Query current workspace schema via metadata API
- **Change Detection**: Track schema modifications and versions
- **Custom Field Support**: Full support for user-created fields
- **Relationship Mapping**: Complex relationship traversal and querying

**Key Implementation Files**:
- `packages/twenty-server/src/engine/metadata-modules/object-metadata/object-metadata.service.ts`
- `packages/twenty-server/src/engine/metadata-modules/field-metadata/field-metadata.service.ts`
- `packages/twenty-server/src/engine/metadata-modules/workspace-metadata-cache/`

### Standard Objects Available
```typescript
// Core CRM objects (auto-available)
const STANDARD_OBJECTS = [
  'person',           // Contacts/People
  'company',          // Companies/Organizations  
  'opportunity',      // Deals/Opportunities
  'activity',         // Tasks, Notes, Activities
  'activityTarget',   // Activity relationships
  'attachment',       // File attachments
  'comment',          // Comments and notes
  'favorite',         // User favorites
  'view',             // Saved views and filters
  'viewField',        // View field configurations
  'viewFilter',       // View filter definitions
  'viewSort',         // View sort configurations
  'webhook',          // Webhook configurations
  'workspaceMember',  // Team members
  'apiKey',           // API key management
];
```

## 4. Real-time Features & Event System

### Webhook System
**Purpose**: Real-time notifications for data changes

#### Webhook Configuration
```typescript
interface Webhook {
  id: string;
  targetUrl: string;
  operations: ('create' | 'update' | 'delete')[];
  objectMetadataId: string;
  secret?: string;         // For HMAC signature verification
  isActive: boolean;
}
```

#### Event Payload Structure
```typescript
interface WebhookPayload {
  url: string;
  webhookId: string;
  eventName: string;       // 'object.created', 'object.updated', 'object.deleted'
  objectMetadata: {
    id: string;
    nameSingular: string;
  };
  record: any;             // The affected record
  updatedFields?: string[]; // For update events
  eventDate: Date;
}
```

#### Webhook Security & Reliability
- **HMAC Signatures**: Optional webhook payload signing
- **Retry Logic**: Automatic retry with exponential backoff
- **Timeout Handling**: Configurable timeout for webhook calls
- **Audit Trail**: Complete logging of webhook deliveries

**Key Implementation Files**:
- `packages/twenty-server/src/modules/webhook/jobs/call-webhook.job.ts`
- `packages/twenty-server/src/modules/webhook/services/webhook.service.ts`

### Message Queue System
**Technology**: BullMQ or PG-Boss for background processing

#### Queue Operations
- **Webhook Delivery**: Asynchronous webhook calls
- **Batch Processing**: Large dataset operations
- **Email Sending**: Notification and email workflows
- **Data Import/Export**: File processing operations

**Key Implementation Files**:
- `packages/twenty-server/src/engine/core-modules/message-queue/`

## 5. External Integration Patterns

### Workflow HTTP Actions
**Feature**: Built-in support for external API calls within workflows

#### HTTP Request Configuration
```typescript
interface WorkflowHttpRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: any;
  timeout?: number;
}
```

#### Variable Resolution
- **Dynamic Variables**: `{{person.firstName}}`, `{{company.website}}`
- **System Variables**: `{{workspace.id}}`, `{{user.email}}`
- **Custom Functions**: Date formatting, string manipulation

**Key Implementation Files**:
- `packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/http-request/`

### Existing Zapier Integration
**Example**: Shows best practices for external integration

#### Authentication Pattern
```typescript
// Zapier authentication implementation
const authentication = {
  type: 'bearer',
  test: async (bundle) => {
    const response = await bundle.fetch('/auth/verify');
    return response.json();
  }
};
```

#### API Client Pattern
```typescript
// Reusable API client implementation
class TwentyApiClient {
  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }
  
  async request(query: string, variables?: any) {
    return fetch(`${this.baseUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, variables })
    });
  }
}
```

**Key Implementation Files**:
- `packages/twenty-zapier/src/authentication.ts`
- `packages/twenty-zapier/src/utils/requestDb.ts`

## 6. Performance & Optimization Patterns

### Caching Strategy
- **Schema Metadata**: Cached per workspace with TTL
- **Query Results**: Optional query result caching
- **Connection Pooling**: Database connection management

### Rate Limiting
- **API Key Based**: Configurable limits per API key
- **Workspace Based**: Limits per workspace
- **Operation Based**: Different limits for read vs write operations

### Pagination Optimization
- **Cursor-based**: Efficient pagination for large datasets
- **Batch Loading**: Support for bulk operations
- **Aggregation**: Server-side aggregation to reduce data transfer

## 7. Error Handling Patterns

### API Error Structure
```typescript
interface ApiError {
  code: string;           // Error code (e.g., 'VALIDATION_ERROR')
  message: string;        // Human-readable message
  path?: string[];        // GraphQL field path
  extensions?: {
    statusCode: number;
    details?: any;
  };
}
```

### Common Error Scenarios
- **Authentication Errors**: Invalid API key, expired token
- **Authorization Errors**: Insufficient permissions
- **Validation Errors**: Invalid field values, required fields
- **Rate Limiting**: Too many requests
- **Network Errors**: Timeout, connection issues

## Implementation Recommendations for MCP Server

### Essential MCP Tools to Implement
1. **Schema Discovery**: Query available objects and fields
2. **CRUD Operations**: Create, read, update, delete for all objects
3. **Batch Operations**: Bulk operations for efficiency
4. **Query Builder**: Construct complex GraphQL queries
5. **Webhook Management**: Configure real-time notifications

### Advanced MCP Tools
1. **Custom Field Management**: Create and modify schema
2. **Workflow Integration**: Execute workflow actions
3. **Audit Trail**: Access change history
4. **Permission Management**: Handle role-based access

### Performance Optimizations
1. **Schema Caching**: Cache workspace metadata locally
2. **Query Batching**: Combine multiple operations
3. **Connection Pooling**: Reuse HTTP connections
4. **Intelligent API Selection**: Choose GraphQL vs REST based on operation

### Security Implementation
1. **API Key Validation**: Secure token handling
2. **Permission Checking**: Respect user permissions
3. **Audit Logging**: Track all MCP operations
4. **Error Sanitization**: Avoid leaking sensitive data

This comprehensive analysis provides all the technical details needed to implement a sophisticated MCP server that fully leverages Twenty CRM's capabilities while maintaining security and performance best practices.