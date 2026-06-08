import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  RESEND_API_KEY: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  PORT: z.string().default("3000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    result.error.errors.forEach((e) => {
      console.error(`  - ${e.path.join(".")}: ${e.message}`);
    });
    process.exit(1);
  }
  return result.data;
}
