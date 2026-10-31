import "server-only";
import { supabaseService } from "@/lib/supabase/server";
import { cardDeliveryEmail, sendEmail } from "../email";

/**
 * Claims due delivery jobs atomically (status scheduled → sending, SKIP LOCKED) and sends them.
 * Safe to run concurrently and repeatedly: a job can only be claimed once per attempt, and the
 * Resend idempotency key is the job id, so retries never send duplicates.
 */
export async function dispatchDueDeliveries(limit = 20) {
  const db = supabaseService();
  const { data: jobs, error } = await db.rpc("claim_due_deliveries", { p_limit: limit });
  if (error) throw error;
  const results: { jobId: string; ok: boolean; error?: string }[] = [];
  for (const job of jobs ?? []) {
    try {
      if (job.delivery_email) {
        const mail = cardDeliveryEmail({ recipientName: job.recipient_name, senderName: job.sender_name, slug: job.slug });
        await sendEmail(job.delivery_email, mail.subject, mail.html, `delivery-${job.job_id}`);
      }
      await db.rpc("finish_delivery", { p_job_id: job.job_id, p_ok: true });
      results.push({ jobId: job.job_id, ok: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await db.rpc("finish_delivery", { p_job_id: job.job_id, p_ok: false, p_error: message });
      results.push({ jobId: job.job_id, ok: false, error: message });
    }
  }
  return results;
}

/** Deletes abandoned uploads and media no card uses any more. */
export async function cleanupMedia(limit = 200) {
  const db = supabaseService();
  const { data, error } = await db.rpc("abandoned_media", { p_older_than_hours: 24, p_limit: limit });
  if (error) throw error;
  const rows = data ?? [];
  const paths = rows.flatMap((r) => [r.storage_path, r.thumbnail_path].filter(Boolean) as string[]);
  if (paths.length) await db.storage.from("card-media").remove(paths);
  if (rows.length) await db.from("card_media").delete().in("id", rows.map((r) => r.id));
  const { data: pruned } = await db.rpc("prune_rate_limits");
  return { removed: rows.length, rateLimitRowsPruned: pruned ?? 0 };
}
