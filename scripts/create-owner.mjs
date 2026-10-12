#!/usr/bin/env node
// Creates (or resets) an owner account for the dashboard.
//
//   npm run owner:local -- --email you@example.com --name "Your Name"
//   npm run client:owner -- <slug> --email owner@shop.com --name "Abu Ali" [--password ...]
//
// Without --password a random one is generated and printed once.
import { parseArgs } from "node:util";
import { executeSql, fail, hashPassword, parseTarget, randomPassword, sqlString } from "./lib.mjs";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    local: { type: "boolean" },
    email: { type: "string" },
    name: { type: "string" },
    password: { type: "string" },
  },
});

const target = parseTarget(positionals, values);
const email = values.email?.trim().toLowerCase();
if (!email || !email.includes("@")) fail("Pass --email.");
const name = values.name?.trim() || email.split("@")[0];
const password = values.password ?? randomPassword();
if (password.length < 8) fail("The password needs at least 8 characters.");

executeSql(
  `INSERT INTO users (email, name, password_hash, role)
   VALUES (${sqlString(email)}, ${sqlString(name)}, ${sqlString(hashPassword(password))}, 'owner')
   ON CONFLICT(email) DO UPDATE SET
     name = excluded.name, password_hash = excluded.password_hash, role = 'owner';`,
  target,
);

console.log(`\n✔ Owner ready: ${email}`);
if (!values.password) console.log(`  Password: ${password}  (shown once; change it under Account)`);
console.log("  Log in at /admin\n");
