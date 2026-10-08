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
  const file = process.argv[2] || path.join(__dirname, "safarx-init.sql");
  loadEnv(path.join(__dirname, "..", ".env"));
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DIRECT_URL/DATABASE_URL missing");

  const sql = fs.readFileSync(file, "utf8");
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  client.on("error", () => {});
  await client.connect();
  await client.query(sql);

  const r = await client.query(
    "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1"
  );
  console.log("tables-now:", JSON.stringify(r.rows.map((x) => x.table_name)));
  await client.end();
  console.log("migrate-sql-done");
}

main().catch((e) => {
  console.error("MIGRATE-SQL-FAILED:", e.message);
  process.exit(1);
});
