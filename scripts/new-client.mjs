#!/usr/bin/env node
// Creates everything a new client needs on Cloudflare and writes deployments/<slug>.jsonc.
//
//   npm run client:new -- <slug> [--theme noir] [--primary "#c9a227"] [--accent "#..."]
//                                [--locale ar|en] [--timezone Asia/Jerusalem]
//
// Creates: a D1 database "<slug>-db", an R2 bucket "<slug>-media", runs the migrations.
// The Worker itself is created on the first deploy (npm run client:deploy -- <slug>).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { clientConfig, DEPLOYMENTS, fail, ROOT, SLUG_PATTERN, wrangler } from "./lib.mjs";

const THEMES = ["classic", "noir", "ocean", "rose", "forest", "ink"];

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    theme: { type: "string", default: "classic" },
    primary: { type: "string", default: "" },
    accent: { type: "string", default: "" },
    locale: { type: "string", default: "ar" },
    timezone: { type: "string", default: "Asia/Jerusalem" },
  },
});

const slug = positionals[0];
if (!slug || !SLUG_PATTERN.test(slug)) {
  fail("Pass a slug of 3-40 lowercase letters, digits or dashes, e.g. abu-ali");
}
if (!THEMES.includes(values.theme)) fail(`--theme must be one of: ${THEMES.join(", ")}`);
for (const color of [values.primary, values.accent]) {
  if (color && !/^#[0-9a-f]{6}$/i.test(color)) fail(`Colors must look like #c9a227 (got ${color})`);
}
if (!["ar", "en"].includes(values.locale)) fail("--locale must be ar or en");

const config = clientConfig(slug);
if (existsSync(config)) fail(`deployments/${slug}.jsonc already exists.`);

// The compatibility date follows the development config so every client runs the same runtime.
const devConfig = readFileSync(join(ROOT, "wrangler.jsonc"), "utf8");
const compatibilityDate = /"compatibility_date":\s*"([^"]+)"/.exec(devConfig)?.[1];

console.log(`\n→ Creating D1 database ${slug}-db`);
const created = wrangler(["d1", "create", `${slug}-db`], { capture: true });
const databaseId = /"?database_id"?\s*[:=]\s*"([0-9a-f-]{36})"/.exec(created)?.[1];
if (!databaseId) fail(`Could not read the database id from wrangler's output:\n${created}`);

console.log(`\n→ Creating R2 bucket ${slug}-media`);
wrangler(["r2", "bucket", "create", `${slug}-media`]);

const deployment = {
  $schema: "../node_modules/wrangler/config-schema.json",
  name: slug,
  main: "../worker.ts",
  compatibility_date: compatibilityDate,
  compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"],
  assets: { directory: "../.open-next/assets", binding: "ASSETS" },
  services: [{ binding: "WORKER_SELF_REFERENCE", service: slug }],
  d1_databases: [{ binding: "DB", database_name: `${slug}-db`, database_id: databaseId, migrations_dir: "../drizzle" }],
  r2_buckets: [{ binding: "MEDIA", bucket_name: `${slug}-media` }],
  triggers: { crons: ["*/15 * * * *"] },
  observability: { enabled: true },
  vars: {
    THEME: values.theme,
    THEME_PRIMARY: values.primary,
    THEME_ACCENT: values.accent,
    DEFAULT_LOCALE: values.locale,
    TIMEZONE: values.timezone,
    TURNSTILE_SITE_KEY: "",
  },
};

mkdirSync(DEPLOYMENTS, { recursive: true });
writeFileSync(
  config,
  `// Deployment for "${slug}". Created by scripts/new-client.mjs; safe to edit (see docs/setup.md).\n${JSON.stringify(deployment, null, 2)}\n`,
);
console.log(`\n✔ Wrote deployments/${slug}.jsonc`);

console.log("\n→ Applying database migrations");
wrangler(["d1", "migrations", "apply", "DB", "--remote", "--config", config]);

console.log(`
✔ ${slug} is ready to deploy. Next:

  1. Deploy:          npm run client:deploy -- ${slug}
  2. Owner login:     npm run client:owner -- ${slug} --email owner@example.com --name "Owner"
  3. (Optional) Bot protection: add a Turnstile site key to TURNSTILE_SITE_KEY in
     deployments/${slug}.jsonc, then: npx wrangler secret put TURNSTILE_SECRET_KEY --config deployments/${slug}.jsonc
`);
