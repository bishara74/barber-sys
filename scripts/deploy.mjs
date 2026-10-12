#!/usr/bin/env node
// Builds the app once, then migrates and deploys one, several or all clients.
//
//   npm run client:deploy -- abu-ali
//   npm run client:deploy -- abu-ali ink-studio
//   npm run client:deploy -- --all
//   npm run client:deploy -- --all --skip-build      (reuse the last build)
import { existsSync, readdirSync } from "node:fs";
import { parseArgs } from "node:util";
import { clientConfig, DEPLOYMENTS, fail, opennext, wrangler } from "./lib.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    all: { type: "boolean" },
    "skip-build": { type: "boolean" },
  },
});

const slugs = values.all
  ? readdirSync(DEPLOYMENTS)
      .filter((file) => file.endsWith(".jsonc"))
      .map((file) => file.replace(/\.jsonc$/, ""))
  : positionals;
if (slugs.length === 0) fail("Pass one or more client slugs, or --all.");
for (const slug of slugs) {
  if (!existsSync(clientConfig(slug))) fail(`No deployment called "${slug}". Run: npm run client:new -- ${slug}`);
}

// The build has no client-specific content: design and settings live in each client's database.
if (!values["skip-build"]) {
  console.log("\n→ Building");
  opennext(["build"]);
}

const failed = [];
for (const slug of slugs) {
  const config = clientConfig(slug);
  console.log(`\n→ ${slug}: migrating database`);
  try {
    wrangler(["d1", "migrations", "apply", "DB", "--remote", "--config", config]);
    console.log(`\n→ ${slug}: deploying`);
    opennext(["deploy", "--config", config]);
  } catch (error) {
    console.error(error);
    failed.push(slug);
  }
}

if (failed.length > 0) fail(`Deploy failed for: ${failed.join(", ")}`);
console.log(`\n✔ Deployed: ${slugs.join(", ")}\n`);
