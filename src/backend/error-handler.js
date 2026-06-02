// Error types enumeration
export const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  SERVER_ERROR: 'SERVER_ERROR',
  TIMEOUT: 'TIMEOUT',
  NETWORK_ERROR: 'NETWORK_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  DATABASE_ERROR: 'DATABASE_ERROR'
};

// HTTP Status codes
const StatusCodes = {
  [ErrorTypes.VALIDATION_ERROR]: 400,
  [ErrorTypes.UNAUTHORIZED]: 401,
  [ErrorTypes.FORBIDDEN]: 403,
  [ErrorTypes.NOT_FOUND]: 404,
  [ErrorTypes.CONFLICT]: 409,
  [ErrorTypes.RATE_LIMIT]: 429,
  [ErrorTypes.DATABASE_ERROR]: 500,
  [ErrorTypes.SERVER_ERROR]: 500,
  [ErrorTypes.TIMEOUT]: 504,
  [ErrorTypes.NETWORK_ERROR]: 503
};

// Custom error class
export class AppError extends Error {
  constructor(message, errorType = ErrorTypes.SERVER_ERROR, statusCode = null) {
    super(message);
    this.name = 'AppError';
    this.type = errorType;
    this.statusCode = statusCode || StatusCodes[errorType] || 500;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Logger function
function logError(error, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    error: {
      message: error.message,
      type: error.type || ErrorTypes.SERVER_ERROR,
      stack: error.stack
    },
    context,
    environment: process.env.ENVIRONMENT || 'production'
  };

  console.error(JSON.stringify(logEntry, null, 2));

  // In production, send to monitoring service
  if (process.env.ENVIRONMENT === 'production') {
    // TODO: Send to monitoring service (e.g., Sentry, DataDog)
  }
}

// Format error response
export function formatErrorResponse(error, context = {}) {
  const statusCode = error.statusCode || 500;
  const errorType = error.type || ErrorTypes.SERVER_ERROR;

  logError(error, context);

  return {
    statusCode,
    body: JSON.stringify({
      success: false,
      error: {
        type: errorType,
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId: context.requestId || 'unknown'
      }
    }),
    headers: {
      'Content-Type': 'application/json'
    }
  };
}

// Validation helper
export function validateInput(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && !value) {
      errors.push(`${field} is required`);
      continue;
    }

    // Check type
    if (value && rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
    }

    // Check custom validation
    if (value && rules.validate && !rules.validate(value)) {
      errors.push(rules.message || `${field} validation failed`);
    }
  }

  if (errors.length > 0) {
    throw new AppError(
      `Validation failed: ${errors.join(', ')}`,
      ErrorTypes.VALIDATION_ERROR
    );
  }
}

// Safe wrapper for async functions
export function asyncWrapper(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      return formatErrorResponse(error);
    }
  };
}

// Retry logic
export async function retry(fn, options = {}) {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const waitTime = delay * Math.pow(backoff, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

// Timeout wrapper
export async function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(
          new AppError(
            'Request timeout',
            ErrorTypes.TIMEOUT
          )
        ),
        timeoutMs
      )
    )
  ]);
}
