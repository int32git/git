import logger from './logger';

// Error types for better categorization
export enum ErrorType {
  VALIDATION = 'validation_error',
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  SERVER_ERROR = 'server_error',
  BAD_REQUEST = 'bad_request',
  EXTERNAL_SERVICE = 'external_service_error'
}

// Status code mapping
const ERROR_STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.VALIDATION]: 400,
  [ErrorType.AUTHENTICATION]: 401,
  [ErrorType.AUTHORIZATION]: 403,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.CONFLICT]: 409,
  [ErrorType.RATE_LIMIT]: 429,
  [ErrorType.SERVER_ERROR]: 500,
  [ErrorType.BAD_REQUEST]: 400,
  [ErrorType.EXTERNAL_SERVICE]: 502
};

// Error response shape
export interface ErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  status: number;
}

// User-facing error messages that don't reveal internals
const USER_FRIENDLY_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.VALIDATION]: 'The provided data is invalid.',
  [ErrorType.AUTHENTICATION]: 'Authentication is required for this action.',
  [ErrorType.AUTHORIZATION]: 'You do not have permission to perform this action.',
  [ErrorType.NOT_FOUND]: 'The requested resource was not found.',
  [ErrorType.CONFLICT]: 'This operation conflicts with the current state.',
  [ErrorType.RATE_LIMIT]: 'Too many requests. Please try again later.',
  [ErrorType.SERVER_ERROR]: 'An unexpected error occurred. Our team has been notified.',
  [ErrorType.BAD_REQUEST]: 'The request could not be processed.',
  [ErrorType.EXTERNAL_SERVICE]: 'A service we depend on is currently unavailable.'
};

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  type: ErrorType,
  message?: string,
  details?: Record<string, any>,
  code?: string,
  originalError?: Error
): ErrorResponse {
  const status = ERROR_STATUS_CODES[type] || 500;
  const userMessage = message || USER_FRIENDLY_MESSAGES[type];
  
  // Log the error with original details for debugging, but return sanitized version
  logger.error(`Error response: ${type}`, originalError, { 
    meta: { 
      errorType: type, 
      statusCode: status,
      details
    } 
  });
  
  return {
    error: {
      type,
      message: userMessage,
      ...(code ? { code } : {}),
      ...(details ? { details } : {})
    },
    status
  };
}

/**
 * Convert an error response to a Next.js Response object
 */
export function errorToResponse(errorResponse: ErrorResponse): Response {
  return new Response(
    JSON.stringify({ error: errorResponse.error }), 
    { status: errorResponse.status }
  );
}

/**
 * Handles unexpected errors gracefully
 */
export function handleUnexpectedError(error: unknown, context?: string): ErrorResponse {
  // Cast to Error if possible
  const err = error instanceof Error ? error : new Error(String(error));
  
  // Log the full error with stack trace
  logger.error(
    `Unexpected error${context ? ` in ${context}` : ''}`, 
    err
  );
  
  // Return a sanitized server error response
  return createErrorResponse(
    ErrorType.SERVER_ERROR,
    USER_FRIENDLY_MESSAGES[ErrorType.SERVER_ERROR],
    undefined,
    'unexpected_error',
    err
  );
}

/**
 * Helper to determine if an error is from a specific external service
 */
export function isExternalServiceError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  // Check for error types from external services
  return (
    error.name.includes('Supabase') ||
    error.name.includes('Service') ||
    error.message.toLowerCase().includes('network') ||
    error.message.toLowerCase().includes('timeout') ||
    error.message.toLowerCase().includes('connection')
  );
} 