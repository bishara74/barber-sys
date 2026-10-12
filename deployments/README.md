# Deployments

One Wrangler config per client, created by `npm run client:new -- <slug>`.
Each file holds that client's Worker name, D1 database, R2 bucket and design vars.

Commit these files: they contain no secrets (secrets are stored with `wrangler secret put`).
See [docs/setup.md](../docs/setup.md).
