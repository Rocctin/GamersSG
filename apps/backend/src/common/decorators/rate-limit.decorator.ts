import { SetMetadata } from "@nestjs/common";

export interface RateLimitConfig {
  /** Number of minutes in the rate limit window */
  windowMinutes: number;
  /** Maximum number of attempts within the window */
  maxAttempts: number;
  /** Prefix for the rate limit key (e.g. "magic_link", "verify", "user_lookup") */
  keyPrefix: string;
}

export const RATE_LIMIT_META = "rate_limit";

/**
 * Decorator that configures per-endpoint rate limiting.
 * The RateLimitGuard reads this metadata to apply the appropriate limits.
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_META, config);
