"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Eye, EyeOff, MailCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUser } from "@/lib/hooks";
import { authService } from "@/lib/services";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Field, Input } from "../ui/form";
import { useToast } from "../ui/toast";
import { track } from "@/lib/analytics";

function Heading({ title, sub }: { title: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h1 className="font-display text-[2.6rem] leading-[1] tracking-[-0.01em]">{title}</h1>
      {sub && <p className="mt-3 text-[15px] text-muted">{sub}</p>}
    </div>
  );
}

/** Where to go after signing in — only same-site paths are honoured. */
function useNext() {
  const next = useSearchParams().get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

function GoogleButton({ label }: { label: string }) {
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const next = useNext();
  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      className="w-full"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          // Redirects to Google, then back through /auth/callback.
          await authService.signInWithGoogle(next);
        } catch (e) {
          toast.error({ title: "Google sign-in isn't available", description: e instanceof Error ? e.message : undefined });
          setBusy(false);
        }
      }}
    >
      {!busy && (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.06H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.94l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
        </svg>
      )}
      {label}
    </Button>
  );
}

function Divider() {
  return (
    <div className="my-6 flex items-center gap-3 text-[12px] uppercase tracking-widest text-muted">
      <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
    </div>
  );
}

function PasswordInput(props: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  const [show, setShow] = useState(false);
  const { invalid, ...rest } = props;
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} aria-invalid={invalid} className="pr-11" {...rest} />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/* --------------------------------------------------------------- Sign in */

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Passwords are at least 8 characters."),
});

export function SignInForm() {
  const router = useRouter();
  const toast = useToast();
  const next = useNext();
  const [error, setError] = useState<string | null>(useSearchParams().get("error"));
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signInSchema>>({ resolver: zodResolver(signInSchema) });
  return (
    <>
      <Heading title={<>Welcome <em>back.</em></>} sub="Sign in to see your creations and the cards people sent you." />
      <GoogleButton label="Continue with Google" />
      <Divider />
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async ({ email, password }) => {
          setError(null);
          try {
            await authService.signIn(email, password);
            toast.success("Welcome back.");
            router.replace(next);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "We couldn't sign you in.");
          }
        })}
      >
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="current-password" invalid={!!errors.password} {...register("password")} />
        </Field>
        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-[13px] text-burgundy underline-offset-4 hover:underline">
            Forgot password?
          </Link>
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-blush px-4 py-3 text-[14px] text-rose-deep">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-8 text-center text-[14px] text-muted">
        New to Dearly?{" "}
        <Link href="/sign-up" className="font-medium text-burgundy underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}

/* --------------------------------------------------------------- Sign up */

const signUpSchema = z
  .object({
    name: z.string().trim().min(1, "What should we call you?").max(50),
    email: z.string().email("Please enter a valid email address."),
    password: z
      .string()
      .min(8, "Use at least 8 characters.")
      .regex(/[A-Za-z]/, "Include at least one letter.")
      .regex(/\d/, "Include at least one number."),
    terms: z.boolean().refine((v) => v, "Please accept the terms to continue."),
  });

export function SignUpForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof signUpSchema>>({ resolver: zodResolver(signUpSchema), defaultValues: { terms: false } });
  const pw = watch("password") ?? "";
  const strength = [pw.length >= 8, /[A-Za-z]/.test(pw) && /\d/.test(pw), pw.length >= 12 || /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  return (
    <>
      <Heading title={<>Make someone feel <em>special.</em></>} sub="Free forever. No card needed." />
      <GoogleButton label="Sign up with Google" />
      <Divider />
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async ({ name, email, password }) => {
          try {
            const { needsVerification } = await authService.signUp(name, email, password);
            track("signup_completed");
            if (needsVerification) router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            else {
              router.replace("/dashboard");
              router.refresh();
            }
          } catch (e) {
            setError("root", { message: e instanceof Error ? e.message : "We couldn't create your account." });
          }
        })}
      >
        <Field label="Your name" htmlFor="name" error={errors.name?.message}>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </Field>
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Field label="Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
          <div className="mt-2 flex gap-1" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i < strength ? (strength === 3 ? "bg-[#3E7A63]" : "bg-rose") : "bg-line")} />
            ))}
          </div>
        </Field>
        <label className="flex items-start gap-2.5 text-[13.5px] text-ink/80">
          <input type="checkbox" className="mt-0.5 size-4 accent-burgundy" {...register("terms")} />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-burgundy underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-burgundy underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.terms && (
          <p role="alert" className="text-[13px] text-rose-deep">
            {errors.terms.message}
          </p>
        )}
        {errors.root && (
          <p role="alert" className="rounded-xl bg-blush px-4 py-3 text-[14px] text-rose-deep">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Create my account
        </Button>
      </form>
      <p className="mt-8 text-center text-[14px] text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium text-burgundy underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}

/* ------------------------------------------------------- Forgot password */

export function ForgotPasswordForm() {
  const [sent, setSent] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(z.object({ email: z.string().email("Please enter a valid email address.") })) });
  if (sent)
    return (
      <div>
        <MailCheck className="mb-6 size-10 text-burgundy" />
        <Heading title="Check your inbox." sub={<>If an account exists for <strong className="text-ink">{sent}</strong>, we&apos;ve sent a link to reset your password. It expires in 30 minutes.</>} />
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href="/sign-in">Back to sign in</Link>
        </Button>
      </div>
    );
  return (
    <>
      <Link href="/sign-in" className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted hover:text-ink">
        <ArrowLeft className="size-3.5" /> Back to sign in
      </Link>
      <Heading title={<>Forgot your <em>password?</em></>} sub="It happens. Enter your email and we'll send you a reset link." />
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async ({ email }) => {
          await authService.requestPasswordReset(email);
          setSent(email);
        })}
      >
        <Field label="Email" htmlFor="email" error={errors.email?.message}>
          <Input id="email" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
    </>
  );
}

/* ---------------------------------------------------------- Verify email */

export function VerifyEmailForm({ email }: { email?: string }) {
  const user = useUser();
  const router = useRouter();
  const toast = useToast();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const submit = async (code: string) => {
    setBusy(true);
    setError(null);
    try {
      const address = email || user?.email;
      if (!address) throw new Error("Open the link in your email, or sign in again to get a new code.");
      await authService.verifyEmail(address, code);
      toast.success("Email verified. Welcome to Dearly!");
      router.replace("/dashboard");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "That code didn't work.");
    } finally {
      setBusy(false);
    }
  };

  const setDigit = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split("");
      const filled = [...next, ...Array(6 - next.length).fill("")];
      setDigits(filled);
      refs.current[Math.min(5, next.length)]?.focus();
      if (next.length === 6) submit(next.join(""));
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (next.every(Boolean)) submit(next.join(""));
  };

  return (
    <>
      <MailCheck className="mb-6 size-10 text-burgundy" />
      <Heading title={<>Check your <em>email.</em></>} sub={<>We sent a confirmation link and code to <strong className="text-ink">{email || user?.email || "your inbox"}</strong>. Enter it below to verify your account.</>} />
      <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            value={d}
            inputMode="numeric"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${i + 1}`}
            maxLength={6}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
            }}
            className="h-14 w-full rounded-xl border border-line bg-paper text-center font-display text-3xl focus:border-burgundy/50 focus:outline-none focus:ring-4 focus:ring-blush"
          />
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 text-[14px] text-rose-deep">
          {error}
        </p>
      )}
      <Button className="mt-6 w-full" size="lg" loading={busy} disabled={!digits.every(Boolean)} onClick={() => submit(digits.join(""))}>
        Verify email
      </Button>
      <p className="mt-6 text-center text-[13.5px] text-muted">
        Didn&apos;t get it?{" "}
        <button
          className="font-medium text-burgundy underline-offset-4 hover:underline"
          onClick={async () => {
            const address = email || user?.email;
            if (!address) return toast.error("Sign in again to get a new code.");
            try {
              await authService.resendVerification(address);
              toast.info("A new email is on its way.");
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't resend right now.");
            }
          }}
        >
          Resend code
        </button>
      </p>
      <p className="mt-2 text-center text-[12px] text-muted">You can also just tap the link in the email.</p>
    </>
  );
}

/* ---------------------------------------------------------- Reset password */

const resetSchema = z
  .object({ password: z.string().min(8, "Use at least 8 characters.").regex(/[A-Za-z]/, "Include a letter.").regex(/\d/, "Include a number."), confirm: z.string() })
  .refine((v) => v.password === v.confirm, { message: "Passwords don't match.", path: ["confirm"] });

export function ResetPasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const user = useUser();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof resetSchema>>({ resolver: zodResolver(resetSchema) });
  return (
    <>
      <Heading title={<>Choose a new <em>password.</em></>} sub={user ? `For ${user.email}` : "Open this page from the link in your reset email."} />
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async ({ password }) => {
          try {
            await authService.updatePassword(password);
            toast.success("Password updated.");
            router.replace("/dashboard");
          } catch (e) {
            setError("root", { message: e instanceof Error ? e.message : "That link may have expired. Request a new one." });
          }
        })}
      >
        <Field label="New password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" invalid={!!errors.password} {...register("password")} />
        </Field>
        <Field label="Confirm password" htmlFor="confirm" error={errors.confirm?.message}>
          <PasswordInput id="confirm" autoComplete="new-password" invalid={!!errors.confirm} {...register("confirm")} />
        </Field>
        {errors.root && (
          <p role="alert" className="rounded-xl bg-blush px-4 py-3 text-[14px] text-rose-deep">
            {errors.root.message}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </>
  );
}
