// Custom Worker entry: serves the Next.js app and runs scheduled jobs.
// The built app only exists after `opennextjs-cloudflare build`, so the import may or may
// not resolve when type checking; @ts-expect-error would fail in one of the two cases.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { default as openNextWorker } from "./.open-next/worker.js";

interface Env {
  DB: D1Database;
}

export default {
  fetch: openNextWorker.fetch,

  // Pending bookings that were never approved release their slot.
  // Availability already ignores them once expired; this keeps statuses tidy.
  async scheduled(_event: ScheduledController, env: Env) {
    await env.DB.prepare(
      "UPDATE bookings SET status = 'expired', updated_at = ?1 WHERE status = 'pending' AND pending_expires_at <= ?1",
    )
      .bind(Date.now())
      .run();
  },
} satisfies ExportedHandler<Env>;
