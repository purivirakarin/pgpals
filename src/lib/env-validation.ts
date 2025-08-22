/**
 * Environment variable validation for PGPals
 * Validates required environment variables at startup
 */

interface EnvConfig {
  // Database
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  
  // Authentication
  NEXTAUTH_URL: string;
  NEXTAUTH_SECRET: string;
  
  // Telegram
  TELEGRAM_BOT_TOKEN: string;
  ADMIN_TELEGRAM_ID?: string;
  
  // Optional
  NODE_ENV: string;
}

class EnvValidationError extends Error {
  constructor(public missingVars: string[], public invalidVars: string[]) {
    const messages = [];
    if (missingVars.length > 0) {
      messages.push(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
    if (invalidVars.length > 0) {
      messages.push(`Invalid environment variables: ${invalidVars.join(', ')}`);
    }
    super(messages.join('\n'));
    this.name = 'EnvValidationError';
  }
}

/**
 * Validates a URL environment variable
 */
function validateUrl(value: string | undefined, name: string): string | null {
  if (!value) return null;
  
  try {
    new URL(value);
    return value;
  } catch {
    throw new Error(`${name} must be a valid URL`);
  }
}

/**
 * Validates a non-empty string environment variable
 */
function validateString(value: string | undefined, name: string, required = true): string | null {
  if (!value) {
    if (required) return null;
    return value || null;
  }
  
  if (value.trim().length === 0) {
    throw new Error(`${name} cannot be empty`);
  }
  
  return value.trim();
}

/**
 * Validates a telegram bot token format
 */
function validateTelegramToken(value: string | undefined): string | null {
  if (!value) return null;
  
  // Telegram bot tokens are in format: {bot_id}:{bot_secret}
  // Example: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
  const tokenPattern = /^\d+:[A-Za-z0-9_-]+$/;
  
  if (!tokenPattern.test(value)) {
    throw new Error('TELEGRAM_BOT_TOKEN must be in format: {bot_id}:{bot_secret}');
  }
  
  return value;
}

/**
 * Validates a telegram ID format
 */
function validateTelegramId(value: string | undefined): string | null {
  if (!value) return null;
  
  // Telegram IDs are numeric strings
  const idPattern = /^\d+$/;
  
  if (!idPattern.test(value)) {
    throw new Error('ADMIN_TELEGRAM_ID must be a numeric string');
  }
  
  return value;
}

/**
 * Validates NextAuth secret strength
 */
function validateNextAuthSecret(value: string | undefined): string | null {
  if (!value) return null;
  
  if (value.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
  }
  
  return value;
}

/**
 * Validates all environment variables
 */
function validateEnvironmentVariables(): EnvConfig {
  const missingVars: string[] = [];
  const invalidVars: string[] = [];
  
  const env = process.env;
  const config: Partial<EnvConfig> = {};
  
  // Helper function to validate and set config
  const validate = <K extends keyof EnvConfig>(
    key: K,
    validator: (value: string | undefined) => string | null,
    required = true
  ) => {
    try {
      const result = validator(env[key]);
      if (result === null && required) {
        missingVars.push(key);
      } else if (result !== null) {
        config[key] = result as EnvConfig[K];
      }
    } catch (error) {
      invalidVars.push(`${key}: ${error instanceof Error ? error.message : 'Invalid'}`);
    }
  };
  
  // Required environment variables
  validate('NEXT_PUBLIC_SUPABASE_URL', (v) => validateUrl(v, 'NEXT_PUBLIC_SUPABASE_URL'));
  validate('NEXT_PUBLIC_SUPABASE_ANON_KEY', (v) => validateString(v, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'));
  validate('SUPABASE_SERVICE_ROLE_KEY', (v) => validateString(v, 'SUPABASE_SERVICE_ROLE_KEY'));
  validate('NEXTAUTH_URL', (v) => validateUrl(v, 'NEXTAUTH_URL'));
  validate('NEXTAUTH_SECRET', validateNextAuthSecret);
  validate('TELEGRAM_BOT_TOKEN', validateTelegramToken);
  
  // Optional environment variables
  validate('ADMIN_TELEGRAM_ID', validateTelegramId, false);
  validate('NODE_ENV', (v) => validateString(v || 'development', 'NODE_ENV'), false);
  
  // Throw error if any validation failed
  if (missingVars.length > 0 || invalidVars.length > 0) {
    throw new EnvValidationError(missingVars, invalidVars);
  }
  
  return config as EnvConfig;
}

/**
 * Validated environment configuration
 * Call this at application startup to ensure all required env vars are present
 */
export function getValidatedEnv(): EnvConfig {
  try {
    return validateEnvironmentVariables();
  } catch (error) {
    if (error instanceof EnvValidationError) {
      console.error('❌ Environment validation failed:');
      console.error(error.message);
      console.error('\n📝 Please check your .env.local file and ensure all required variables are set.');
      
      if (process.env.NODE_ENV === 'development') {
        console.error('\n🔧 For development, copy .env.example to .env.local and fill in the values.');
      }
    } else {
      console.error('❌ Unexpected error during environment validation:', error);
    }
    
    // Exit in production, but continue in development with warnings
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️ Continuing in development mode despite validation errors...');
      // Return a partial config with defaults for development
      return {
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-key',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-service-key',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
        TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '123456789:dev-token',
        ADMIN_TELEGRAM_ID: process.env.ADMIN_TELEGRAM_ID,
        NODE_ENV: process.env.NODE_ENV || 'development'
      };
    }
  }
}

/**
 * Type-safe environment variable access
 * Use this instead of process.env for validated variables
 */
export const env = getValidatedEnv();

/**
 * Utility to check if we're in production
 */
export const isProduction = env.NODE_ENV === 'production';

/**
 * Utility to check if we're in development
 */
export const isDevelopment = env.NODE_ENV === 'development';

/**
 * Utility to get safe config for client-side use
 */
export function getClientConfig() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
    NODE_ENV: env.NODE_ENV
  };
}

/**
 * Middleware to validate env vars in API routes
 */
export function validateEnvForAPI() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || !env.TELEGRAM_BOT_TOKEN) {
    throw new Error('Required environment variables are not configured');
  }
}

// Log successful validation in development
if (isDevelopment) {
  console.log('✅ Environment variables validated successfully');
  console.log(`🔧 Running in ${env.NODE_ENV} mode`);
  if (env.ADMIN_TELEGRAM_ID) {
    console.log('📱 Admin Telegram notifications enabled');
  }
}