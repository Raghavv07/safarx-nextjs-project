const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
let content = fs.readFileSync(envPath, "utf8");
if (!content.endsWith("\n")) content += "\n";

const block = [
  "",
  "# GetStream Video (Video KYC) — app: safarx-nextjs",
  'NEXT_PUBLIC_STREAM_API_KEY="h69t52ksgqqkf"',
  'STREAM_API_KEY="h69t52ksgqqkf"',
  '# STREAM_API_SECRET dashboard (App Settings / API Keys) se lao, kabhi NEXT_PUBLIC_ mat banana',
  '# STREAM_API_SECRET=""',
  "",
].join("\n");

if (!/STREAM_API_KEY/.test(content)) {
  content += block;
  fs.writeFileSync(envPath, content, "utf8");
  console.log("stream-env-added");
} else {
  console.log("stream-env-already-present");
}
