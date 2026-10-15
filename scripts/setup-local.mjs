#!/usr/bin/env node
// Prepares a complete local environment in one step:
// .dev.vars, the local database and its migrations, demo content and an owner login.
//
//   npm run setup:local            (safe to re-run: keeps existing data)
//   npm run reset:local            (wipes the local database and photos, then sets up again;
//                                   stop `npm run dev` first so the files aren't in use)
//
// Everything lives in .wrangler/state. The login is the local development account from the docs.
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { executeSql, fail, hashPassword, querySql, ROOT, sqlString, wrangler } from "./lib.mjs";

const LOCAL = { local: true };
const DEV_OWNER = { email: "owner@example.com", name: "Demo Owner", password: "local-dev-only" };

const { values } = parseArgs({
  options: {
    reset: { type: "boolean" },
    empty: { type: "boolean" },
  },
});

if (values.reset) {
  console.log("\n→ Removing the local database and photos (.wrangler/state)");
  try {
    rmSync(join(ROOT, ".wrangler", "state"), { recursive: true, force: true });
  } catch {
    fail("Could not delete .wrangler/state. Stop `npm run dev` / `npm run preview` and try again.");
  }
}

const devVars = join(ROOT, ".dev.vars");
if (!existsSync(devVars)) {
  console.log("\n→ Creating .dev.vars from .dev.vars.example");
  copyFileSync(join(ROOT, ".dev.vars.example"), devVars);
}

console.log("\n→ Applying database migrations");
try {
  wrangler(["d1", "migrations", "apply", "DB", "--local"]);
} catch {
  fail("Could not apply the migrations. Is `npm install` done?");
}

const [{ total }] = querySql("SELECT count(*) AS total FROM service_types", LOCAL);
if (total === 0 && !values.empty) {
  console.log("\n→ Adding the demo shop");
  const seeded = spawnSync(process.execPath, [join(ROOT, "scripts", "seed.mjs"), "--local"], { stdio: "inherit" });
  if (seeded.status !== 0) fail("Seeding failed.");
} else {
  console.log("\n✔ The database already has content; leaving it as it is");
}

const [{ owners }] = querySql(
  `SELECT count(*) AS owners FROM users WHERE email = ${sqlString(DEV_OWNER.email)}`,
  LOCAL,
);
if (owners === 0) {
  console.log("\n→ Creating the local owner login");
  executeSql(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES (${sqlString(DEV_OWNER.email)}, ${sqlString(DEV_OWNER.name)}, ${sqlString(hashPassword(DEV_OWNER.password))}, 'owner');`,
    LOCAL,
  );
}

console.log(`
✔ Local environment ready.

  Start it:        npm run dev        (http://localhost:3000)
  Production-like: npm run preview    (http://localhost:8787, real Workers runtime)

  Public page:     /            Booking: /book
  Dashboard:       /admin       Login: ${DEV_OWNER.email} (password in docs/setup.md)

  Start over any time with: npm run reset:local
`);
