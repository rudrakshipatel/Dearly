import { PLAN_LIMITS } from "@/lib/entitlements";
import type { PlanId } from "@/lib/types";
import { AiBlockedError, aiRequest, generate } from "@/server/ai";
import { ApiError, check, json, parseBody, rateLimit, requireUser, route } from "@/server/http";

/**
 * POST /api/ai — optional writing & design assistance. Keys stay server-side; requests are
 * validated, rate limited, counted against the plan's monthly allowance and logged without content.
 */
export const POST = route(async (req) => {
  const { supabase, user } = await requireUser();
  const body = await parseBody(req, aiRequest);
  const { data: plan, error } = await supabase.rpc("my_plan");
  check(error);
  const allowance = PLAN_LIMITS[(plan ?? "free") as PlanId].aiGenerationsPerMonth;
  if (allowance <= 0) throw new ApiError(402, "AI assistance is part of Pro.", "entitlement");

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase.from("ai_generations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "succeeded").gte("created_at", monthStart.toISOString());
  if ((count ?? 0) >= allowance) throw new ApiError(429, `You've used all ${allowance} AI generations this month.`, "ai_quota");
  await rateLimit(supabase, "ai", 10, 60);

  // Only non-content metadata is stored.
  const meta = { kind: body.kind, tone: "tone" in body ? body.tone : undefined, length: "length" in body ? body.length : undefined };
  try {
    const result = await generate(body);
    await supabase.from("ai_generations").insert({
      user_id: user.id,
      generation_type: body.kind,
      input_metadata: meta,
      status: "succeeded",
      provider: result.provider,
      model: result.model,
      input_tokens: result.inputTokens,
      output_tokens: result.outputTokens,
      cost_usd: result.costUsd,
    });
    return json({ kind: body.kind, output: result.output, remaining: allowance - (count ?? 0) - 1 });
  } catch (e) {
    if (e instanceof ApiError) {
      await supabase.from("ai_generations").insert({ user_id: user.id, generation_type: body.kind, input_metadata: meta, status: e instanceof AiBlockedError ? "blocked" : "failed" });
    }
    throw e;
  }
});
