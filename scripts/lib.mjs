// Helpers shared by the deployment scripts. Plain Node, no dependencies.
import { spawnSync } from "node:child_process";
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const DEPLOYMENTS = join(ROOT, "deployments");

export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

/** Absolute path of a CLI shipped by a dependency, run with Node so no shell is involved. */
function cli(pkg, bin) {
  const manifest = JSON.parse(readFileSync(join(ROOT, "node_modules", pkg, "package.json"), "utf8"));
  return join(ROOT, "node_modules", pkg, manifest.bin[bin]);
}

/** Runs a dependency's CLI in the project root. Throws when it fails; returns stdout when captured. */
function runCli(pkg, bin, args, { capture = false } = {}) {
  const result = spawnSync(process.execPath, [cli(pkg, bin), ...args], {
    cwd: ROOT,
    stdio: capture ? ["inherit", "pipe", "inherit"] : "inherit",
    encoding: "utf8",
  });
  if (result.status !== 0) throw new Error(`${bin} ${args.join(" ")} failed`);
  return result.stdout ?? "";
}

export const wrangler = (args, options) => runCli("wrangler", "wrangler", args, options);
export const opennext = (args, options) => runCli("@opennextjs/cloudflare", "opennextjs-cloudflare", args, options);

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/;

/** Path of a client's Wrangler config. */
export function clientConfig(slug) {
  if (!SLUG_PATTERN.test(slug)) fail(`"${slug}" is not a valid client slug.`);
  return join(DEPLOYMENTS, `${slug}.jsonc`);
}

/** Wrangler flags for a target: the local dev database, or a client's remote database. */
export function targetFlags(target) {
  if (target.local) return ["--local"];
  const config = clientConfig(target.slug);
  if (!existsSync(config)) fail(`No deployment called "${target.slug}". Run: npm run client:new -- ${target.slug}`);
  return ["--remote", "--config", config];
}

/** Executes SQL against D1 through a temporary file (wrangler has no bound parameters on the CLI). */
export function executeSql(sql, target) {
  const dir = mkdtempSync(join(tmpdir(), "barber-sys-"));
  const file = join(dir, "query.sql");
  try {
    writeFileSync(file, sql);
    wrangler(["d1", "execute", "DB", "--file", file, ...targetFlags(target)]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** Runs a read query and returns its rows. */
export function querySql(sql, target) {
  const output = wrangler(["d1", "execute", "DB", "--json", "--command", sql, ...targetFlags(target)], {
    capture: true,
  });
  return JSON.parse(output)[0]?.results ?? [];
}

/** SQL string literal. */
export function sqlString(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

/** Same format as src/lib/password.ts (PBKDF2-SHA256, 100,000 iterations). */
export function hashPassword(password) {
  const iterations = 100_000;
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
  return ["pbkdf2_sha256", iterations, salt.toString("base64"), hash.toString("base64")].join("$");
}

export function randomPassword() {
  return randomBytes(12).toString("base64url");
}

/** Target from CLI args: `--local`, or a client slug. */
export function parseTarget(positionals, values) {
  if (values.local) return { local: true };
  const slug = positionals[0];
  if (!slug) fail("Pass a client slug, or --local for the development database.");
  return { slug };
}
