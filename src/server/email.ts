import "server-only";
import { publicEnv } from "@/lib/env";
import { NotConfiguredError, serverEnv } from "./config";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html><body style="margin:0;background:#FFF9F5;font-family:Helvetica,Arial,sans-serif;color:#29252A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:520px;background:#FFFDFB;border:1px solid #EADED9;border-radius:20px">
<tr><td style="padding:36px 36px 8px;font-family:Georgia,serif;font-size:28px">dearly<span style="color:#D98286">.</span></td></tr>
<tr><td style="padding:8px 36px 36px">
<h1 style="font-family:Georgia,serif;font-weight:400;font-size:30px;line-height:1.15;margin:0 0 16px">${title}</h1>
${body}
</td></tr></table>
<p style="font-size:12px;color:#81777A;margin-top:20px">Made with love on Dearly · You received this because someone sent you a card.</p>
</td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#713D50;color:#FFF9F5;text-decoration:none;padding:14px 26px;border-radius:999px;font-size:15px">${esc(label)}</a>`;

export async function sendEmail(to: string, subject: string, html: string, idempotencyKey?: string) {
  if (!serverEnv.resendApiKey) throw new NotConfiguredError("Email (Resend)", "RESEND_API_KEY");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serverEnv.resendApiKey}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from: serverEnv.emailFrom, to: [to], subject, html }),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()) as { id: string };
}

export function cardDeliveryEmail(opts: { recipientName: string; senderName: string; slug: string }) {
  const url = `${publicEnv.siteUrl}/card/${opts.slug}`;
  const name = esc(opts.recipientName || "you");
  const from = esc(opts.senderName || "Someone special");
  return {
    subject: `${opts.senderName || "Someone"} made you something special`,
    html: layout(
      `A little something for ${name}`,
      `<p style="font-size:16px;line-height:1.6;margin:0 0 24px">${from} made you a Dearly — a little surprise to open, just for you. Tap below when you have a quiet moment.</p>${button(url, "Open your surprise")}<p style="font-size:13px;color:#81777A;margin-top:24px">Or paste this link into your browser:<br>${esc(url)}</p>`,
    ),
  };
}

export function contributorInviteEmail(opts: { recipientName: string; organiser: string; token: string }) {
  const url = `${publicEnv.siteUrl}/together/${opts.token}`;
  return {
    subject: `Sign ${opts.recipientName}'s card`,
    html: layout(
      `Help make ${esc(opts.recipientName)}'s day`,
      `<p style="font-size:16px;line-height:1.6;margin:0 0 24px">${esc(opts.organiser)} is collecting messages for a group card. Add yours — it only takes a minute, and no account is needed.</p>${button(url, "Add my message")}`,
    ),
  };
}
