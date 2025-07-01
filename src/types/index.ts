/**
 * TypeScript Type Definitions
 * Common types and interfaces for the Twenty MCP Server
 */

// Common types
export interface ErrorResponse {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

// Twenty CRM types
export interface WorkspaceSchema {
  objects: ObjectMetadata[];
  fields: Record<string, FieldMetadata[]>;
  relationships: RelationshipMetadata[];
  permissions: PermissionMetadata;
}

export interface ObjectMetadata {
  id: string;
  nameSingular: string;
  namePlural: string;
  labelSingular: string;
  labelPlural: string;
  description?: string;
  icon: string;
  isCustom: boolean;
  isActive: boolean;
}

export interface FieldMetadata {
  id: string;
  name: string;
  label: string;
  type: string;
  isCustom: boolean;
  isActive: boolean;
  isNullable: boolean;
  defaultValue?: unknown;
  settings?: Record<string, unknown>;
}

export interface RelationshipMetadata {
  id: string;
  type: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_ONE' | 'MANY_TO_MANY';
  fromObjectId: string;
  toObjectId: string;
}

export interface PermissionMetadata {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}
