import { z } from "zod";

/**
 * Server-only environment variables schema.
 * Ye variables browser bundle me expose nahi hone chahiye.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string("DATABASE_URL is required in .env")
    .min(1, "DATABASE_URL cannot be empty"),
  DIRECT_URL: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  RESEND_API_KEY: z
    .string("RESEND_API_KEY is required in .env")
    .min(1, "RESEND_API_KEY cannot be empty"),
  RESEND_FROM_EMAIL: z
    .string()
    .default("onboarding@resend.dev"),
  IMAGEKIT_PRIVATE_KEY: z.string().optional(),
  STREAM_APP_ID: z.string().optional(),
  STREAM_API_KEY: z.string().optional(),
  STREAM_API_SECRET: z.string().optional(),
  APINEX_API_KEY: z.string().optional(),
  APINEX_BASE_URL: z.string().default("https://api.apinex.bond/v1"),
  APINEX_MODEL: z.string().default("free/deepseek-v4.1-flash"),
});

/**
 * Client-side environment variables schema.
 * Ye variables browser me accessible hote hain (NEXT_PUBLIC_ prefix).
 */
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string("NEXT_PUBLIC_SUPABASE_URL is required in .env")
    .min(1, "NEXT_PUBLIC_SUPABASE_URL cannot be empty"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string("NEXT_PUBLIC_SUPABASE_ANON_KEY is required in .env")
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty"),
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: z.string().optional(),
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: z.string().optional(),
  NEXT_PUBLIC_STREAM_API_KEY: z.string().optional(),
});

// Full environment schema (Server + Client)
const fullEnvSchema = serverEnvSchema.merge(clientEnvSchema);

export type Env = z.infer<typeof fullEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

const isServer = typeof window === "undefined";

const rawEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  NODE_ENV: process.env.NODE_ENV,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
  IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
  STREAM_APP_ID: process.env.STREAM_APP_ID,
  STREAM_API_KEY: process.env.STREAM_API_KEY,
  STREAM_API_SECRET: process.env.STREAM_API_SECRET,
  APINEX_API_KEY: process.env.APINEX_API_KEY,
  APINEX_BASE_URL: process.env.APINEX_BASE_URL,
  APINEX_MODEL: process.env.APINEX_MODEL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
  NEXT_PUBLIC_STREAM_API_KEY: process.env.NEXT_PUBLIC_STREAM_API_KEY,
};

function formatErrors(errors: z.ZodError): string {
  return errors.issues
    .map((issue) => `  - [${issue.path.join(".")}] ${issue.message}`)
    .join("\n");
}

let parsedEnv: Env;

if (isServer) {
  const result = fullEnvSchema.safeParse(rawEnv);
  if (!result.success) {
    console.error(
      "\n❌ [SafarX] Invalid Environment Variables:\n" +
        formatErrors(result.error) +
        "\n\nPlease check your .env file and fix the configuration.\n"
    );
    if (process.env.NODE_ENV === "production") {
      throw new Error("Invalid environment variables");
    }
  }
  parsedEnv = (result.success ? result.data : rawEnv) as Env;
} else {
  const result = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
  if (!result.success) {
    console.error(
      "\n❌ [SafarX] Invalid Client Environment Variables:\n" +
        formatErrors(result.error) +
        "\n"
    );
  }
  parsedEnv = (result.success ? result.data : rawEnv) as Env;
}

export const env = parsedEnv;
