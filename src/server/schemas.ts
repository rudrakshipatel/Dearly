import "server-only";
import { z } from "zod";
import type { Creation } from "@/lib/types";

/**
 * Shape of the editable creation the browser sends. Card content itself is validated by the
 * card engine schema (toCardWrite); these are the envelope fields around it.
 */
export const creationInput = z
  .object({
    id: z.string().optional(),
    title: z.string().max(120),
    occasion: z.string().max(40),
    experience: z.enum(["letter", "surprise", "memories", "reveal", "together", "classic", "video"]),
    templateId: z.string().max(80),
    palette: z.string().max(40),
    recipientName: z.string().max(60),
    senderName: z.string().max(60),
    message: z.string().max(4000),
    occasionDate: z.string().max(30).optional(),
    relationship: z.string().max(40).optional(),
    photos: z.array(z.unknown()).max(100),
    interaction: z.record(z.string(), z.unknown()),
    pages: z.array(z.unknown()).max(30),
    showBranding: z.boolean().optional(),
    allowReactions: z.boolean().optional(),
    contributionDeadline: z.string().datetime().nullable().optional(),
    contributionLimit: z.number().int().min(1).max(1000).nullable().optional(),
    contributionsRequireApproval: z.boolean().optional(),
  })
  .passthrough();

export function asCreation(input: z.infer<typeof creationInput>): Creation {
  const c = input as unknown as Partial<Creation>;
  return {
    ...(c as Creation),
    showBranding: c.showBranding ?? true,
    status: "draft",
    slug: c.slug ?? "",
    createdAt: "",
    updatedAt: "",
    contributions: [],
  };
}
