import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Every page reads live data from D1, so no incremental cache is needed.
export default defineCloudflareConfig({});
