/**
 * Comprehensive input validation utilities for PGPals
 * Provides type-safe validation with detailed error messages
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
  sanitizer?: (value: any) => any;
}

export class ValidationError extends Error {
  constructor(public errors: string[]) {
    super(`Validation failed: ${errors.join(', ')}`);
    this.name = 'ValidationError';
  }
}

/**
 * Validates a single field with the given rules
 */
export function validateField(
  value: any, 
  fieldName: string, 
  rules: ValidationRule
): ValidationResult {
  const errors: string[] = [];
  let sanitized = value;

  // Check required
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push(`${fieldName} is required`);
    return { isValid: false, errors };
  }

  // If value is empty and not required, it's valid
  if (!rules.required && (value === undefined || value === null || value === '')) {
    return { isValid: true, errors: [], sanitized: value };
  }

  // Apply sanitizer first
  if (rules.sanitizer) {
    sanitized = rules.sanitizer(value);
  }

  // Check string-specific rules
  if (typeof sanitized === 'string') {
    if (rules.minLength && sanitized.length < rules.minLength) {
      errors.push(`${fieldName} must be at least ${rules.minLength} characters long`);
    }
    
    if (rules.maxLength && sanitized.length > rules.maxLength) {
      errors.push(`${fieldName} must be no more than ${rules.maxLength} characters long`);
    }
    
    if (rules.pattern && !rules.pattern.test(sanitized)) {
      errors.push(`${fieldName} format is invalid`);
    }
  }

  // Check custom validator
  if (rules.customValidator && !rules.customValidator(sanitized)) {
    errors.push(`${fieldName} failed custom validation`);
  }

  return { 
    isValid: errors.length === 0, 
    errors, 
    sanitized 
  };
}

/**
 * Validates multiple fields at once
 */
export function validateFields(
  data: Record<string, any>, 
  rules: Record<string, ValidationRule>
): ValidationResult {
  const errors: string[] = [];
  const sanitized: Record<string, any> = {};

  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const result = validateField(data[fieldName], fieldName, fieldRules);
    
    if (!result.isValid) {
      errors.push(...result.errors);
    } else {
      sanitized[fieldName] = result.sanitized;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized
  };
}

/**
 * Common sanitizers
 */
export const sanitizers = {
  trim: (value: string) => typeof value === 'string' ? value.trim() : value,
  
  toLowerCase: (value: string) => typeof value === 'string' ? value.toLowerCase() : value,
  
  toUpperCase: (value: string) => typeof value === 'string' ? value.toUpperCase() : value,
  
  removeHtml: (value: string) => {
    if (typeof value !== 'string') return value;
    return value.replace(/<[^>]*>/g, '');
  },
  
  normalizeWhitespace: (value: string) => {
    if (typeof value !== 'string') return value;
    return value.replace(/\s+/g, ' ').trim();
  },
  
  parseInt: (value: any) => {
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  },
  
  parseFloat: (value: any) => {
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }
};

/**
 * Common validation patterns
 */
export const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  strongPassword: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  
  telegramUsername: /^[a-zA-Z0-9_]{5,32}$/,
  
  telegramId: /^\d{1,15}$/,
  
  questCategory: /^(pair|multiple-pair|bonus)$/,
  
  submissionStatus: /^(pending_ai|ai_approved|ai_rejected|manual_review|approved|rejected)$/,
  
  userRole: /^(participant|admin)$/,
  
  questStatus: /^(active|inactive|archived)$/,
  
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  alphanumeric: /^[a-zA-Z0-9]+$/,
  
  alphanumericWithSpaces: /^[a-zA-Z0-9\s]+$/,
  
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/
};

/**
 * Common custom validators
 */
export const validators = {
  isPositiveInteger: (value: any) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num > 0;
  },
  
  isNonNegativeInteger: (value: any) => {
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0;
  },
  
  isValidDate: (value: any) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  },
  
  isFutureDate: (value: any) => {
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime()) && date > new Date();
  },
  
  isValidJson: (value: any) => {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  },
  
  isValidArray: (value: any) => Array.isArray(value),
  
  arrayMinLength: (minLength: number) => (value: any) => 
    Array.isArray(value) && value.length >= minLength,
  
  arrayMaxLength: (maxLength: number) => (value: any) => 
    Array.isArray(value) && value.length <= maxLength
};

/**
 * Pre-built validation schemas for common entities
 */
export const schemas = {
  user: {
    name: {
      required: true,
      minLength: 2,
      maxLength: 100,
      sanitizer: sanitizers.normalizeWhitespace,
      pattern: patterns.alphanumericWithSpaces
    },
    email: {
      required: true,
      pattern: patterns.email,
      sanitizer: (value: string) => sanitizers.toLowerCase(sanitizers.trim(value))
    },
    telegram_id: {
      required: false,
      pattern: patterns.telegramId,
      sanitizer: sanitizers.trim
    },
    telegram_username: {
      required: false,
      pattern: patterns.telegramUsername,
      sanitizer: sanitizers.trim
    },
    role: {
      required: true,
      pattern: patterns.userRole
    }
  },
  
  quest: {
    title: {
      required: true,
      minLength: 3,
      maxLength: 200,
      sanitizer: sanitizers.normalizeWhitespace
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 2000,
      sanitizer: (value: string) => sanitizers.removeHtml(sanitizers.normalizeWhitespace(value))
    },
    category: {
      required: true,
      pattern: patterns.questCategory
    },
    points: {
      required: true,
      customValidator: validators.isPositiveInteger,
      sanitizer: sanitizers.parseInt
    },
    status: {
      required: true,
      pattern: patterns.questStatus
    },
    requirements: {
      required: false,
      maxLength: 1000,
      sanitizer: sanitizers.normalizeWhitespace
    },
    expires_at: {
      required: false,
      customValidator: validators.isFutureDate
    }
  },
  
  submission: {
    quest_id: {
      required: true,
      customValidator: validators.isPositiveInteger,
      sanitizer: sanitizers.parseInt
    },
    telegram_file_id: {
      required: true,
      minLength: 1,
      maxLength: 200,
      sanitizer: sanitizers.trim
    },
    admin_feedback: {
      required: false,
      maxLength: 1000,
      sanitizer: sanitizers.normalizeWhitespace
    },
    status: {
      required: false,
      pattern: patterns.submissionStatus
    }
  },
  
  groupSubmission: {
    quest_id: {
      required: true,
      customValidator: validators.isPositiveInteger,
      sanitizer: sanitizers.parseInt
    },
    participant_pairs: {
      required: true,
      customValidator: validators.arrayMinLength(2) // At least 2 pairs
    },
    telegram_file_id: {
      required: true,
      minLength: 1,
      maxLength: 200,
      sanitizer: sanitizers.trim
    }
  }
};

/**
 * Validates API request body against a schema
 */
export function validateRequestBody<T = any>(
  body: any, 
  schema: Record<string, ValidationRule>
): { isValid: boolean; errors: string[]; data?: T } {
  if (!body || typeof body !== 'object') {
    return {
      isValid: false,
      errors: ['Request body must be a valid JSON object']
    };
  }

  const result = validateFields(body, schema);
  
  return {
    isValid: result.isValid,
    errors: result.errors,
    data: result.isValid ? result.sanitized as T : undefined
  };
}

/**
 * Validates query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  schema: Record<string, ValidationRule>
): ValidationResult {
  const data: Record<string, any> = {};
  
  // Convert URLSearchParams to object
  searchParams.forEach((value, key) => {
    data[key] = value;
  });
  
  return validateFields(data, schema);
}

/**
 * Middleware-style validation function
 */
export function createValidator(schema: Record<string, ValidationRule>) {
  return (data: any) => {
    const result = validateFields(data, schema);
    
    if (!result.isValid) {
      throw new ValidationError(result.errors);
    }
    
    return result.sanitized;
  };
}

/**
 * Validates file uploads
 */
export function validateFile(
  file: File | null,
  options: {
    required?: boolean;
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}
): ValidationResult {
  const errors: string[] = [];
  
  if (options.required && !file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  if (!file) {
    return { isValid: true, errors: [] };
  }
  
  if (options.maxSize && file.size > options.maxSize) {
    const maxSizeMB = (options.maxSize / (1024 * 1024)).toFixed(2);
    errors.push(`File size must be less than ${maxSizeMB}MB`);
  }
  
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}