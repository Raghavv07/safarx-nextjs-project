const fs = require("fs");

const lines = [
  "# SafarX env — Supabase Postgres (pooler)",
  "# App queries: transaction-mode pooler (IPv4)",
  'DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"',
  "",
  "# Prisma migrations: session-mode pooler",
  'DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"',
  "",
  "# Supabase client (browser + server)",
  'NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY="[SUPABASE_ANON_KEY]"',
  "",
];

fs.writeFileSync(".env", lines.join("\n"), "utf8");
console.log("env-written");
