/**
 * Structured logger utility that supports different log levels
 * and redacts sensitive information
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogOptions {
  /** Set to true to show the log even in production */
  important?: boolean;
  /** Additional metadata to include with the log */
  meta?: Record<string, any>;
}

// Sensitive data patterns to redact
const PATTERNS_TO_REDACT = [
  // Email addresses
  /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi,
  // API keys and tokens (generic pattern)
  /(key|token|password|secret|credential)(['"]?\s*[=:]\s*['"]?)([a-zA-Z0-9_\-\.=]+)/gi,
  // JWT tokens
  /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  // Credit card numbers
  /\b(?:\d{4}[ -]?){3}\d{4}\b/g,
  // Social security numbers
  /\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g,
];

/**
 * Redacts sensitive information from log messages
 */
function redactSensitiveInfo(data: any): any {
  if (typeof data === 'string') {
    let redactedString = data;
    
    // Apply all redaction patterns
    PATTERNS_TO_REDACT.forEach(pattern => {
      redactedString = redactedString.replace(pattern, (match, p1, p2, p3) => {
        // For key-value pairs, keep the key but redact the value
        if (p1 && p2 && p3) {
          return `${p1}${p2}[REDACTED]`;
        }
        // For emails, show first 3 chars and domain
        if (pattern.toString().includes('@')) {
          const atIndex = match.indexOf('@');
          if (atIndex > 3) {
            return `${match.substring(0, 3)}***${match.substring(atIndex)}`;
          }
        }
        return '[REDACTED]';
      });
    });
    
    return redactedString;
  }
  
  if (Array.isArray(data)) {
    return data.map(item => redactSensitiveInfo(item));
  }
  
  if (data !== null && typeof data === 'object') {
    const result: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Completely redact known sensitive fields
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key') ||
        key.toLowerCase().includes('credential')
      ) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactSensitiveInfo(value);
      }
    }
    
    return result;
  }
  
  return data;
}

/**
 * Get the current log level based on environment
 */
function getCurrentLogLevel(): LogLevel {
  const env = process.env.NODE_ENV || 'development';
  const configuredLevel = process.env.LOG_LEVEL as LogLevel | undefined;
  
  if (configuredLevel && ['debug', 'info', 'warn', 'error'].includes(configuredLevel)) {
    return configuredLevel;
  }
  
  return env === 'production' ? 'info' : 'debug';
}

/**
 * Check if a log at the given level should be displayed
 */
function shouldLog(level: LogLevel, important: boolean): boolean {
  const currentLevel = getCurrentLogLevel();
  const levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  // Always show important logs
  if (important) return true;
  
  // In production, never show debug logs unless important
  if (process.env.NODE_ENV === 'production' && level === 'debug' && !important) {
    return false;
  }
  
  return levelPriority[level] >= levelPriority[currentLevel];
}

/**
 * Format log data for output
 */
function formatLogData(level: LogLevel, message: string, options?: LogOptions): any {
  const timestamp = new Date().toISOString();
  const meta = options?.meta ? redactSensitiveInfo(options.meta) : {};
  
  return {
    timestamp,
    level,
    message: redactSensitiveInfo(message),
    ...meta
  };
}

/**
 * Main logger object with methods for different log levels
 */
export const logger = {
  debug(message: string, options?: LogOptions): void {
    if (!shouldLog('debug', options?.important || false)) return;
    
    const logData = formatLogData('debug', message, options);
    console.log(JSON.stringify(logData));
  },
  
  info(message: string, options?: LogOptions): void {
    if (!shouldLog('info', options?.important || false)) return;
    
    const logData = formatLogData('info', message, options);
    console.log(JSON.stringify(logData));
  },
  
  warn(message: string, options?: LogOptions): void {
    if (!shouldLog('warn', options?.important || false)) return;
    
    const logData = formatLogData('warn', message, options);
    console.warn(JSON.stringify(logData));
  },
  
  error(message: string, error?: any, options?: LogOptions): void {
    if (!shouldLog('error', options?.important || false)) return;
    
    const meta = { ...(options?.meta || {}) };
    
    // Extract useful error information
    if (error) {
      meta.errorMessage = error.message;
      meta.errorName = error.name;
      meta.errorStack = process.env.NODE_ENV !== 'production' ? error.stack : undefined;
      
      if (error.code) {
        meta.errorCode = error.code;
      }
    }
    
    const logData = formatLogData('error', message, { ...(options || {}), meta });
    console.error(JSON.stringify(logData));
  }
};

export default logger; 