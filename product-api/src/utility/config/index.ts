import { z } from "zod";
import { config } from "dotenv";

export const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
  VECTOR_DB_URL: z.string().url(),
  VECTOR_NAMESPACE: z.string().default("default"),
  EMBED_MODEL: z.string().default("text-embedding-3-small"),
  API_PORT: z.string().default("3001"),
  NEXT_PUBLIC_API_BASE: z.string().optional(),
});

export type AppEnv = z.infer<typeof EnvSchema>;

export function loadEnv(): AppEnv {
  config();
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}
