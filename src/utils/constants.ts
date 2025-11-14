/**
 * Application constants and configuration values
 */

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

// Link Precedence Values
export const LINK_PRECEDENCE = {
  PRIMARY: "primary",
  SECONDARY: "secondary",
} as const;

// Request/Response Messages
export const MESSAGES = {
  // Success
  CONTACT_CONSOLIDATED: "Contact consolidated successfully",

  // Errors
  MISSING_REQUIRED_FIELDS:
    "At least one of email or phoneNumber must be provided",
  INVALID_EMAIL: "Invalid email format",
  INVALID_PHONE: "Invalid phone number format",
  ENDPOINT_NOT_FOUND: "Endpoint not found",
  INTERNAL_SERVER_ERROR: "Internal server error",

  // Database
  DATABASE_CONNECTION_ERROR: "Failed to connect to database",
  QUERY_ERROR: "Database query failed",
} as const;

// Email Validation
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone Validation
export const PHONE_REGEX = /^[+]?[\d\s\-()]+$/;
export const PHONE_MIN_LENGTH = 7;

// API Configuration
export const API_CONFIG = {
  DEFAULT_PORT: 3000,
  DEFAULT_LOG_LEVEL: "info",
  DEFAULT_ENV: "development",
} as const;

// Database Configuration
export const DATABASE_CONFIG = {
  // Connection pool settings
  MIN_CONNECTIONS: 2,
  MAX_CONNECTIONS: 20,
  IDLE_TIMEOUT: 30000,
  CONNECTION_TIMEOUT: 5000,

  // Query settings
  STATEMENT_TIMEOUT: 30000,
} as const;

// Response Field Names
export const RESPONSE_FIELDS = {
  PRIMARY_CONTACT_ID: "primaryContatctId", // Note: Typo maintained for compatibility
  EMAILS: "emails",
  PHONE_NUMBERS: "phoneNumbers",
  SECONDARY_CONTACT_IDS: "secondaryContactIds",
  CONTACT: "contact",
} as const;

// Table and Column Names
export const DATABASE = {
  TABLES: {
    CONTACTS: "contacts",
  },
  COLUMNS: {
    ID: "id",
    EMAIL: "email",
    PHONE_NUMBER: "phone_number",
    LINKED_ID: "linked_id",
    LINK_PRECEDENCE: "link_precedence",
    CREATED_AT: "created_at",
    UPDATED_AT: "updated_at",
    DELETED_AT: "deleted_at",
  },
} as const;

// Service Metadata
export const SERVICE_META = {
  NAME: "identify-service",
  VERSION: "0.1.0",
  DESCRIPTION: "Contact Consolidation API - Bitspeed Identify Implementation",
  REPOSITORY: "https://github.com/sainathg1002/Identity-Reconciliation-",
} as const;
