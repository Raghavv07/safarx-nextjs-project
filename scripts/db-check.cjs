const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

function loadEnv(p) {
  const raw = fs.readFileSync(p, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"?([^"]*)"?\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

async function main() {
  loadEnv(path.join(__dirname, "..", ".env"));
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL/DATABASE_URL missing");
  const masked = url.replace(/:[^:@]+@/, ":***@");
  console.log("connecting:", masked);

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  client.on("error", () => {});
  await client.connect();

  const r = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1"
  );
  console.log("tables:", JSON.stringify(r.rows.map((x) => x.table_name)));

  const must = ["User", "Vehicle", "PartnerDocs", "PartnerBank", "Booking", "ChatMessage"];
  const have = new Set(r.rows.map((x) => x.table_name));
  const missing = must.filter((t) => !have.has(t));
  console.log("missing:", JSON.stringify(missing));

  await client.end();
  console.log("done");
}

main().catch((e) => {
  console.error("DB-CHECK-FAILED:", e.message);
  process.exit(1);
});
