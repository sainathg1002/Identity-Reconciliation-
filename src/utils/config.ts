/**
 * Environment variable validation and configuration
 */

interface AppConfig {
  port: number;
  nodeEnv: "development" | "production" | "test";
  databaseUrl: string;
  logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * Validate and load environment variables
 * Throws error if required variables are missing
 */
export function loadConfig(): AppConfig {
  const errors: string[] = [];

  // Check required variables
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    errors.push("DATABASE_URL is not set");
  }

  if (errors.length > 0) {
    console.error("Configuration Error:");
    errors.forEach((error) => console.error(`  - ${error}`));
    console.error("\nPlease set the required environment variables in .env file");
    process.exit(1);
  }

  // Parse and validate config
  const port = parseInt(process.env.PORT || "3000", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error("Invalid PORT: must be a number between 1 and 65535");
    process.exit(1);
  }

  const nodeEnv = (process.env.NODE_ENV || "development") as
    | "development"
    | "production"
    | "test";

  if (!["development", "production", "test"].includes(nodeEnv)) {
    console.error(
      `Invalid NODE_ENV: ${nodeEnv}. Must be one of: development, production, test`
    );
    process.exit(1);
  }

  const logLevel = (process.env.LOG_LEVEL || "info") as
    | "debug"
    | "info"
    | "warn"
    | "error";

  if (!["debug", "info", "warn", "error"].includes(logLevel)) {
    console.error(
      `Invalid LOG_LEVEL: ${logLevel}. Must be one of: debug, info, warn, error`
    );
    process.exit(1);
  }

  return {
    port,
    nodeEnv,
    databaseUrl: databaseUrl!,
    logLevel,
  };
}

/**
 * Log configuration details (without sensitive data)
 */
export function logConfig(config: AppConfig): void {
  const maskedUrl = config.databaseUrl.replace(
    /(:\/\/)(.+):(.+)@/,
    "$1***:***@"
  );

  console.log("Configuration Loaded:");
  console.log(`  Port: ${config.port}`);
  console.log(`  Environment: ${config.nodeEnv}`);
  console.log(`  Log Level: ${config.logLevel}`);
  console.log(`  Database: ${maskedUrl}`);
}

/**
 * Check if running in production
 */
export function isProduction(config: AppConfig): boolean {
  return config.nodeEnv === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(config: AppConfig): boolean {
  return config.nodeEnv === "development";
}

/**
 * Check if running in test mode
 */
export function isTest(config: AppConfig): boolean {
  return config.nodeEnv === "test";
}
