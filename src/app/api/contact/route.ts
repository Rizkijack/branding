/**
 * ============================================================================
 * POST /api/contact
 * ============================================================================
 * Contact form endpoint. Everything the browser sends is treated as hostile:
 * shape, sizes, rate and the honeypot are all checked here. The client copy of
 * the validation in `components/contact/ContactForm.tsx` exists only to give
 * fast feedback, never to decide whether a message is valid.
 *
 * Delivery modes
 *   • RESEND_API_KEY set   → POST to the Resend HTTP API (no SDK, just fetch)
 *   • RESEND_API_KEY unset → log mode: log the submission and return 200, so
 *                            the form works end-to-end locally with zero setup
 *
 * Response shape is always JSON and always the same union:
 *   { ok: boolean, error?: string, fieldErrors?: Record<string, string> }
 * plus `mode: "log" | "resend"` on a successful send, which the form uses for
 * nothing today but which makes local testing obvious in devtools.
 */

import { NextResponse } from "next/server";

import { contact } from "@/data/profile";

/**
 * Node runtime, stated explicitly: the module keeps rate-limit state in a plain
 * `Map`, and reading env vars plus reusing a single process instance is the
 * intended behaviour.
 */
export const runtime = "nodejs";

/**
 * A POST route is dynamic by definition, but stating it keeps the health check
 * below from ever being statically evaluated into a build-time response.
 */
export const dynamic = "force-dynamic";

/** Resend HTTP endpoint. The SDK is deliberately not a dependency. */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

/** Shared limits with the client form — keep the two in sync. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_MIN = 2;
const NAME_MAX = 80;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

/** Honeypot field name. Must match the `website` input in the form component. */
const HONEYPOT_FIELD = "website";

/* ---------------------------------------------------------------------------
 * Rate limiting — best effort, in memory
 * ------------------------------------------------------------------------ */

/**
 * A fixed window of 5 requests per 10 minutes, keyed by the client IP.
 *
 * IMPORTANT: this lives in module scope, so on serverless (Vercel) it is
 * per-instance and resets on every cold start — it is a cheap guard against an
 * accidental loop, NOT a security control. Anything that must actually hold
 * under abuse belongs in a shared store (Upstash, Vercel KV, or the provider's
 * own rate limits) rather than here.
 */
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/**
 * Best-effort client identity. `x-forwarded-for` is a comma list; the left-most
 * entry is the original client as seen by the edge. Falls back to a single
 * shared key, which over-limits localhost — acceptable for a dev machine.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";

  return request.headers.get("x-real-ip") ?? "unknown";
}

function checkRateLimit(
  key: string,
  now: number,
): { limited: true; retryAfter: number } | { limited: false } {
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false };
  }

  bucket.count += 1;

  if (bucket.count > RATE_LIMIT_MAX) {
    return {
      limited: true,
      retryAfter: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  return { limited: false };
}

/* ---------------------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------------------ */

type Fields = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  topic?: unknown;
  website?: unknown;
};

/** Trim, and coerce non-strings to "" so validation never sees `undefined`. */
function asText(value: unknown, max = 10_000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function validate(fields: Fields): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = asText(fields.name, NAME_MAX + 40);
  if (name.length < NAME_MIN) {
    errors.name = "Please tell me your name.";
  } else if (name.length > NAME_MAX) {
    errors.name = `Keep your name under ${NAME_MAX} characters.`;
  }

  const email = asText(fields.email, 320);
  if (!email) {
    errors.email = "I need an email address to reply to.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "That doesn't look like a valid email address.";
  }

  const message = asText(fields.message);
  if (message.length < MESSAGE_MIN) {
    errors.message = "Add a little more detail so I know what you need.";
  } else if (message.length > MESSAGE_MAX) {
    errors.message = `Keep your message under ${MESSAGE_MAX} characters.`;
  }

  return errors;
}

/** Escape visitor-supplied text before it goes into the HTML email body. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isEmailLike(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/* ---------------------------------------------------------------------------
 * Routes
 * ------------------------------------------------------------------------ */

/** Health check — also tells you whether real delivery is wired up. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "contact",
    configured: Boolean(process.env.RESEND_API_KEY),
  });
}

export async function POST(request: Request) {
  const now = Date.now();

  // 1. Rate limit first — cheapest way to shed load, and it costs no parsing.
  const limit = checkRateLimit(clientKey(request), now);
  if (limit.limited) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many messages from this address. Try again shortly.",
      },
      {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfter) },
      },
    );
  }

  // 2. Body must be JSON. Anything else (HTML form post, empty body) is a 400.
  let payload: Fields;
  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") {
      throw new Error("body is not an object");
    }
    payload = body as Fields;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body." },
      { status: 400 },
    );
  }

  // 3. Never trust the client: re-validate every field server-side.
  const fieldErrors = validate(payload);
  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        ok: false,
        error: "Some fields need another look.",
        fieldErrors,
      },
      { status: 422 },
    );
  }

  // 4. Honeypot. Checked after validation per the route contract: a bot that
  //    filled the hidden field still has to pass validation to reach here, and
  //    telling a bot "your input was invalid" is not information worth giving up
  //    for a rule this cheap. The reply is a fake success so the bot learns
  //    nothing and reports nothing to whoever is watching the endpoint.
  const honeypot = asText(payload[HONEYPOT_FIELD], 200);
  if (honeypot) {
    return NextResponse.json({ ok: true, mode: "log" });
  }

  const name = asText(payload.name);
  const email = asText(payload.email);
  const message = asText(payload.message, MESSAGE_MAX);
  const topic = asText(payload.topic, 120);

  const apiKey = process.env.RESEND_API_KEY;

  // -------------------------------------------------------------------------
  // Log mode — no RESEND_API_KEY configured.
  // This is the default local path: the submission is printed to the server
  // console and the visitor sees a normal success, so the whole form can be
  // exercised end-to-end without any account or API key.
  // -------------------------------------------------------------------------
  if (!apiKey) {
    console.info(
      "[contact] log mode (set RESEND_API_KEY to deliver) — received:",
      {
        name,
        email,
        topic: topic || undefined,
        messageLength: message.length,
        message,
        receivedAt: new Date(now).toISOString(),
      },
    );

    return NextResponse.json({ ok: true, mode: "log" });
  }

  // -------------------------------------------------------------------------
  // Live delivery.
  // -------------------------------------------------------------------------
  const to = (process.env.CONTACT_TO_EMAIL ?? contact.email).trim();
  const from =
    process.env.CONTACT_FROM_EMAIL?.trim() || "Website <onboarding@resend.dev>";

  if (!isEmailLike(to)) {
    // A misconfigured recipient is an operator error, not a visitor error.
    console.error(
      `[contact] CONTACT_TO_EMAIL is not a valid address (received: "${to}"). Set CONTACT_TO_EMAIL in the environment.`,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          "This contact form is not configured yet. Please email me directly.",
      },
      { status: 502 },
    );
  }

  const subject = topic
    ? `[contact/${topic}] Message from ${name}`
    : `[contact] Message from ${name}`;

  try {
    const resendResponse = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        // Replies land back with the visitor, which is the whole point.
        reply_to: email,
        subject,
        text: [
          `From: ${name} <${email}>`,
          topic ? `Topic: ${topic}` : null,
          "",
          message,
        ]
          .filter((line): line is string => line !== null)
          .join("\n"),
        html: [
          `<p><strong>${escapeHtml(name)}</strong> &lt;${escapeHtml(email)}&gt;</p>`,
          topic ? `<p><em>Topic: ${escapeHtml(topic)}</em></p>` : null,
          "<hr />",
          `<p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
        ]
          .filter((line): line is string => line !== null)
          .join("\n"),
      }),
      // Do not hang a serverless invocation on a dead provider.
      signal: AbortSignal.timeout(10_000),
    });

    if (!resendResponse.ok) {
      const detail = await resendResponse.text().catch(() => "");

      // The provider's payload can echo the message back, so it is logged
      // truncated and the visitor only ever sees a generic message.
      console.error(
        `[contact] Resend rejected the message (${resendResponse.status}): ${detail.slice(0, 500)}`,
      );

      return NextResponse.json(
        {
          ok: false,
          error:
            "The message could not be delivered right now. Please try again, or email me directly.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({ ok: true, mode: "resend" });
  } catch (error) {
    console.error("[contact] delivery failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          "The message could not be delivered right now. Please try again, or email me directly.",
      },
      { status: 502 },
    );
  }
}
