"use client";

/**
 * ============================================================================
 * CONTACT FORM
 * ============================================================================
 * The only interactive part of /contact, and the only client component on the
 * route. Server component owns the copy; this file owns the interaction.
 *
 * Validation happens twice on purpose: here for instant feedback, and again in
 * `app/api/contact/route.ts` because nothing a browser sends can be trusted.
 * The two rule sets (EMAIL_PATTERN, the limits) are intentionally duplicated —
 * they are tiny, and sharing them would mean shipping the API module to the
 * client.
 *
 * Accessibility decisions worth knowing:
 *  • errors are announced through a `role="alert"` summary and each input is
 *    wired to its message with aria-describedby + aria-invalid;
 *  • the success panel replaces the form but keeps a "Send another" escape, and
 *    focus moves to it so keyboard users are not stranded at the top of the page;
 *  • field validation only starts firing on blur *after* the first submit
 *    attempt, so nobody is scolded for a field they have not reached yet.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  AlertIcon,
  CheckIcon,
  ChevronDownIcon,
  SpinnerIcon,
} from "@/components/icons/InlineIcons";
import { useThreeStore } from "@/components/three/store";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** Mirrors EMAIL_PATTERN in the API route. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const LIMITS = {
  name: { min: 2, max: 80 },
  message: { min: 10, max: 2000 },
} as const;

/** Must match HONEYPOT_FIELD in app/api/contact/route.ts. */
const HONEYPOT_FIELD = "website";

/** Submit order for "focus the first thing that is wrong". */
const FIELD_ORDER = ["name", "email", "message"] as const;

type FieldName = (typeof FIELD_ORDER)[number];

type Values = {
  name: string;
  email: string;
  message: string;
  topic: string;
  website: string;
};

type FieldErrors = Partial<Record<FieldName, string>>;

type Status = "idle" | "submitting" | "success" | "error";

/** The API's response union. Cast from `unknown` — see `readJson`. */
interface ContactResponse {
  readonly ok: boolean;
  readonly error?: string;
  readonly mode?: string;
  readonly fieldErrors?: Record<string, string>;
}

/** One optional extra field: it routes the reply and costs the visitor nothing. */
const TOPICS = [
  { value: "collaboration", label: "Collaboration or contract work" },
  { value: "project", label: "A project or bug I can look at" },
  { value: "community", label: "Community or moderation" },
  { value: "other", label: "Something else entirely" },
] as const;

/**
 * Error styling.
 *
 * `--brand-pink` doubles as the error accent on purpose: the token set has no
 * dedicated error colour, and it reads as "something needs attention" while
 * staying inside the palette. It passes 3:1 against both themes as a *graphic*
 * (border, icon, tint) — which is why the error copy itself stays in `text-fg`
 * and only the border changes colour. Colour is never the sole error signal:
 * every field with a problem also gets an icon and visible text.
 */
const errorBorder = "border-brand-pink/70";

/* -------------------------------------------------------------------------
 * Validation
 * ---------------------------------------------------------------------- */

function validateField(field: FieldName, values: Values): string | undefined {
  const value = values[field].trim();

  if (field === "name") {
    if (!value) return "Please tell me your name.";
    if (value.length < LIMITS.name.min) {
      return `At least ${LIMITS.name.min} characters, please.`;
    }
    if (value.length > LIMITS.name.max) {
      return `Keep it under ${LIMITS.name.max} characters.`;
    }
    return undefined;
  }

  if (field === "email") {
    if (!value) return "I need an email address to reply to.";
    if (!EMAIL_PATTERN.test(value)) {
      return "That doesn’t look like a valid email address.";
    }
    return undefined;
  }

  if (!value) return "Add a short message so I know what you need.";
  if (value.length < LIMITS.message.min) {
    return `A little more detail, please — at least ${LIMITS.message.min} characters.`;
  }
  if (value.length > LIMITS.message.max) {
    return `Keep it under ${LIMITS.message.max} characters.`;
  }
  return undefined;
}

function validateAll(values: Values): FieldErrors {
  const errors: FieldErrors = {};

  for (const field of FIELD_ORDER) {
    const error = validateField(field, values);
    if (error) errors[field] = error;
  }

  return errors;
}

/**
 * Read the response body as JSON, tolerating anything else.
 *
 * A proxy, a WAF or a crashed upstream can answer with an HTML error page or
 * with nothing at all, and `response.json()` would throw on both. The caller
 * turns the fallback message into the visible error, so it has to be useful.
 */
async function readJson(response: Response): Promise<ContactResponse> {
  let text = "";

  try {
    text = await response.text();
  } catch {
    // Body already consumed or connection dropped mid-stream.
  }

  if (text) {
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === "object") {
        // Narrowing an `unknown` blob to the known union: the API is ours, and
        // every field is treated as optional at the point of use.
        return parsed as ContactResponse;
      }
    } catch {
      // Not JSON — fall through to the generic message below.
    }
  }

  return {
    ok: false,
    error: `The server replied with an unexpected response (${response.status}). Please try again.`,
  };
}

/* -------------------------------------------------------------------------
 * Shared field styling
 * ---------------------------------------------------------------------- */

const controlClasses =
  "w-full bg-surface-2 text-fg placeholder:text-fg-subtle " +
  "transition-colors duration-200 disabled:opacity-60";

/* -------------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------------- */

export function ContactForm({ replyWindow }: { replyWindow: string }) {
  const headingId = useId();
  const summaryId = useId();
  const nameId = useId();
  const emailId = useId();
  const topicId = useId();
  const messageId = useId();
  const honeypotId = useId();
  const successId = useId();

  const nameErrorId = useId();
  const emailErrorId = useId();
  const messageErrorId = useId();
  // Hint text ids — referenced by aria-describedby alongside the error ids so
  // the field description survives even once an error is announced.
  const emailHintId = useId();
  const messageHintId = useId();

  /**
   * 3D success burst. Bound once; the counter is what the global scene
   * subscribes to. Calling this on a device with 3D off is a no-op — nothing
   * reads `burstKey` — so the form never has to know whether WebGL is live.
   */
  const triggerBurst = useThreeStore((s) => s.triggerBurst);

  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    message: "",
    topic: "",
    website: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  /** Guards state writes after unmount and lets a retry cancel the old call. */
  const aliveRef = useRef(true);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);

  // Success is announced by moving focus to the panel; without this a keyboard
  // user would have no idea the form had gone away.
  useEffect(() => {
    if (status === "success") successRef.current?.focus();
  }, [status]);

  const focusFirstError = useCallback((current: FieldErrors) => {
    const first = FIELD_ORDER.find((field) => current[field]);
    if (first === "name") nameRef.current?.focus();
    else if (first === "email") emailRef.current?.focus();
    else if (first === "message") messageRef.current?.focus();
  }, []);

  const handleChange = useCallback(
    (
      event: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const { name, value } = event.target;
      const key = name as keyof Values;

      setValues((previous) => ({ ...previous, [key]: value }));

      // Clear an error that is already on screen, but never introduce a new one
      // before the visitor has tried to submit.
      if (hasSubmitted && key !== "topic" && key !== "website") {
        const field = key as FieldName;
        setErrors((previous) =>
          previous[field]
            ? {
                ...previous,
                [field]: validateField(field, { ...values, [key]: value }),
              }
            : previous,
        );
      }
    },
    [hasSubmitted, values],
  );

  const handleBlur = useCallback(
    (field: FieldName) => {
      // Validation on blur only starts once a submit has been attempted, so
      // nobody is told their name is too short before they have typed one.
      if (!hasSubmitted) return;
      setErrors((previous) => ({
        ...previous,
        [field]: validateField(field, values),
      }));
    },
    [hasSubmitted, values],
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      // Double-submit guard: the button is disabled while submitting, but a
      // double Enter keypress can still land a second event.
      if (status === "submitting") return;

      setHasSubmitted(true);

      const found = validateAll(values);
      setErrors(found);

      if (Object.keys(found).length > 0) {
        focusFirstError(found);
        return;
      }

      setStatus("submitting");
      setServerError(null);

      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const response = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            name: values.name.trim(),
            email: values.email.trim(),
            message: values.message.trim(),
            // Omitted entirely when untouched, so the API never sees a stray "".
            ...(values.topic ? { topic: values.topic } : {}),
            [HONEYPOT_FIELD]: values.website,
          }),
        });

        const payload = await readJson(response);

        // A 422 means the server disagreed about a field. Show its messages in
        // place of ours and keep the visitor on the form.
        if (response.status === 422 && payload.fieldErrors) {
          const fromServer: FieldErrors = {};
          for (const field of FIELD_ORDER) {
            const message = payload.fieldErrors[field];
            if (message) fromServer[field] = message;
          }
          setErrors(fromServer);
          setStatus("idle");
          focusFirstError(fromServer);
          return;
        }

        if (!response.ok || !payload.ok) {
          throw new Error(
            payload.error ??
              `Something went wrong (${response.status}). Please try again.`,
          );
        }

        if (!aliveRef.current) return;

        // Fire the 3D particle burst. Bumps a counter in the store rather than
        // calling into the canvas directly — R3F renders in its own root, so
        // the store is the only channel across that boundary. The global scene
        // subscribes and plays the burst once per increment.
        triggerBurst();

        setStatus("success");
      } catch (error) {
        // An aborted request is either a cancelled retry or an unmount; either
        // way it must not turn into a visible error.
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        if (!aliveRef.current) return;

        setServerError(
          error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
        );
        setStatus("error");
      } finally {
        if (controllerRef.current === controller) controllerRef.current = null;
      }
    },
    [focusFirstError, status, triggerBurst, values],
  );

  const handleSendAnother = useCallback(() => {
    // Keep the name and email: sending a second message is usually a follow-up
    // from the same person, and making them retype it is pure friction.
    setValues((previous) => ({
      ...previous,
      message: "",
      topic: "",
      website: "",
    }));
    setErrors({});
    setServerError(null);
    setStatus("idle");
    setHasSubmitted(false);
  }, []);

  /* ---- Success ---------------------------------------------------------- */

  if (status === "success") {
    return (
      <div
        ref={successRef}
        role="status"
        tabIndex={-1}
        id={successId}
        className="flex flex-col items-center gap-4 py-6 text-center"
      >
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-pill text-white shadow-[0_12px_32px_-10px_rgb(138_92_246/0.6)]"
          style={{ backgroundImage: "var(--grad-hero)" }}
        >
          <CheckIcon className="text-[1.5rem]" />
        </span>

        <h3 className="text-[1.35rem] leading-tight font-bold">
          Message sent — thank you.
        </h3>

        <p className="max-w-sm text-[0.95rem] leading-relaxed text-fg-muted">
          It landed in my inbox with your reply address attached. I&apos;ll get
          back to you {replyWindow.toLowerCase()}, usually with something useful
          rather than &ldquo;thanks!&rdquo;.
        </p>

        <Button
          variant="secondary"
          onClick={handleSendAnother}
          className="mt-2"
        >
          Send another
        </Button>
      </div>
    );
  }

  /* ---- Form ------------------------------------------------------------- */

  const submitting = status === "submitting";
  const messageLength = values.message.trim().length;

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-labelledby={headingId}
      className="flex flex-col gap-5"
    >
      <h3 id={headingId} className="text-[1.15rem] font-bold">
        Send a message
      </h3>

      {/* Server-side failure. role=alert so it is announced the moment it lands. */}
      {status === "error" && serverError ? (
        <div
          role="alert"
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3.5",
            "text-[0.9rem] leading-relaxed",
          )}
          style={{
            borderColor: "color-mix(in oklab, #e11d48 40%, transparent)",
            background: "color-mix(in oklab, #e11d48 8%, transparent)",
          }}
        >
          <AlertIcon className="mt-0.5 shrink-0 text-[1.05rem] text-fg" />
          <div className="min-w-0">
            <p className="font-semibold text-fg">That didn&apos;t go through</p>
            <p className="mt-1 text-fg-muted">{serverError}</p>
            <p className="mt-1 text-fg-subtle">
              Your message is still in the fields below — press send to try
              again.
            </p>
          </div>
        </div>
      ) : null}

      {/* Summary of client-side problems, announced when it appears. */}
      {hasSubmitted && Object.keys(errors).length > 0 ? (
        <div
          role="alert"
          id={summaryId}
          className="flex items-start gap-3 rounded-xl border border-line bg-surface-2 px-4 py-3.5 text-[0.9rem] leading-relaxed"
        >
          <AlertIcon className="mt-0.5 shrink-0 text-[1.05rem] text-fg" />
          <div className="min-w-0">
            <p className="font-semibold text-fg">
              {Object.keys(errors).length === 1
                ? "One field needs another look."
                : `${Object.keys(errors).length} fields need another look.`}
            </p>
            <ul className="mt-1 list-inside list-disc text-fg-muted">
              {FIELD_ORDER.filter((field) => errors[field]).map((field) => (
                <li key={field}>{errors[field]}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {/* ---- Name ---- */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor={nameId}
          className="text-[0.85rem] font-semibold text-fg"
        >
          Name
        </label>
        <input
          ref={nameRef}
          id={nameId}
          name="name"
          type="text"
          autoComplete="name"
          value={values.name}
          onChange={handleChange}
          onBlur={() => handleBlur("name")}
          disabled={submitting}
          required
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? nameErrorId : undefined}
          placeholder="Ada Lovelace"
          className={cn(
            controlClasses,
            "rounded-pill border px-5 py-3 text-[0.92rem]",
            errors.name ? errorBorder : "border-line",
          )}
        />
        {errors.name ? (
          <span
            id={nameErrorId}
            className="flex items-center gap-1.5 text-[0.8rem] text-fg"
          >
            <AlertIcon className="shrink-0 text-[0.9rem] text-fg" />
            {errors.name}
          </span>
        ) : null}
      </div>

      {/* ---- Email ---- */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor={emailId}
          className="text-[0.85rem] font-semibold text-fg"
        >
          Email
        </label>
        <input
          ref={emailRef}
          id={emailId}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={values.email}
          onChange={handleChange}
          onBlur={() => handleBlur("email")}
          disabled={submitting}
          required
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={
            errors.email ? `${emailErrorId} ${emailHintId}` : emailHintId
          }
          placeholder="you@example.com"
          className={cn(
            controlClasses,
            "rounded-pill border px-5 py-3 text-[0.92rem]",
            errors.email ? errorBorder : "border-line",
          )}
        />
        <span id={emailHintId} className="sr-only">
          Used only to reply to this message.
        </span>
        {errors.email ? (
          <span
            id={emailErrorId}
            className="flex items-center gap-1.5 text-[0.8rem] text-fg"
          >
            <AlertIcon className="shrink-0 text-[0.9rem] text-fg" />
            {errors.email}
          </span>
        ) : null}
      </div>

      {/* ---- Topic (optional) ---- */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor={topicId}
          className="text-[0.85rem] font-semibold text-fg"
        >
          Topic <span className="font-normal text-fg-subtle">(optional)</span>
        </label>
        <div className="relative">
          <select
            id={topicId}
            name="topic"
            value={values.topic}
            onChange={handleChange}
            disabled={submitting}
            className={cn(
              controlClasses,
              "appearance-none rounded-pill border border-line py-3 pr-11 pl-5 text-[0.92rem]",
            )}
          >
            <option value="">No topic — just a message</option>
            {TOPICS.map((topic) => (
              <option key={topic.value} value={topic.value}>
                {topic.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[1rem] text-fg-subtle"
          />
        </div>
      </div>

      {/* ---- Message ---- */}
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <label
            htmlFor={messageId}
            className="text-[0.85rem] font-semibold text-fg"
          >
            Message
          </label>
          <span
            className={cn(
              "font-mono text-[0.72rem]",
              messageLength > LIMITS.message.max ? "text-fg" : "text-fg-subtle",
            )}
          >
            {messageLength}/{LIMITS.message.max}
          </span>
        </div>

        <textarea
          ref={messageRef}
          id={messageId}
          name="message"
          rows={6}
          value={values.message}
          onChange={handleChange}
          onBlur={() => handleBlur("message")}
          disabled={submitting}
          required
          aria-required="true"
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={
            errors.message
              ? `${messageErrorId} ${messageHintId}`
              : messageHintId
          }
          placeholder="What are you building, breaking, or trying to understand?"
          className={cn(
            controlClasses,
            "min-h-40 resize-y rounded-xl border px-5 py-3.5 text-[0.92rem] leading-relaxed",
            errors.message ? errorBorder : "border-line",
          )}
        />
        <span id={messageHintId} className="text-[0.78rem] text-fg-subtle">
          At least {LIMITS.message.min} characters. Links, code and half-formed
          ideas are all fine.
        </span>
        {errors.message ? (
          <span
            id={messageErrorId}
            className="flex items-center gap-1.5 text-[0.8rem] text-fg"
          >
            <AlertIcon className="shrink-0 text-[0.9rem] text-fg" />
            {errors.message}
          </span>
        ) : null}
      </div>

      {/*
        Honeypot. A real labelled input, moved off-screen and skipped by the tab
        order: bots fill every field they find, humans never reach it. The API
        answers a non-empty value with a fake success and sends nothing.
      */}
      <div
        aria-hidden="true"
        className="absolute top-0 -left-[9999px] h-px w-px overflow-hidden"
      >
        <label htmlFor={honeypotId}>Leave this field empty</label>
        <input
          id={honeypotId}
          name={HONEYPOT_FIELD}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        block
        disabled={submitting}
        aria-busy={submitting}
        icon={submitting ? <SpinnerIcon /> : undefined}
        trailingIcon={!submitting}
        className="mt-1"
      >
        {submitting ? "Sending…" : "Send message"}
      </Button>

      <p className="text-center text-[0.78rem] leading-relaxed text-fg-subtle">
        Goes straight to my inbox with your reply address attached. No
        newsletter, no tracking. Replies {replyWindow.toLowerCase()}.
      </p>
    </form>
  );
}
