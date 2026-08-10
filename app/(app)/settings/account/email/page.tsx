"use client";

import { Check, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import PageHeader from "@/components/PageHeader";
import { authClient } from "@/lib/auth/client";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ChangeEmailForm({
  currentEmail,
  emailVerified,
  onEmailUpdated,
}: {
  currentEmail: string;
  emailVerified: boolean;
  onEmailUpdated: () => Promise<unknown> | unknown;
}) {
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizedEmail = email.trim();
  const emailIsValid = emailPattern.test(normalizedEmail);
  const canSave =
    emailIsValid &&
    normalizedEmail.toLowerCase() !== currentEmail.toLowerCase() &&
    !isSaving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    setIsSaving(true);
    setSent(false);
    setErrorMessage(null);

    try {
      await authClient.changeEmail({
        newEmail: normalizedEmail,
        callbackURL: `${window.location.origin}/settings/account/email`,
        fetchOptions: { throw: true },
      });

      if (!emailVerified) await onEmailUpdated();
      setSent(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "We couldn’t update your email. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10">
      <div className="rounded-2xl bg-gray-50 px-4 py-3.5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
          Current email
        </p>
        <p className="mt-2 break-all text-sm font-medium text-gray-900">
          {currentEmail}
        </p>
      </div>

      <label htmlFor="new-email" className="mt-6 block">
        <span className="text-sm font-medium text-gray-700">New email</span>
        <input
          id="new-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSent(false);
            setErrorMessage(null);
          }}
          autoComplete="email"
          maxLength={254}
          placeholder="you@example.com"
          className="mt-2 h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition-colors placeholder:text-gray-300 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100"
        />
      </label>

      {email.length > 0 && !emailIsValid ? (
        <p className="mt-2 text-xs text-red-500">
          Enter a valid email address.
        </p>
      ) : null}

      <div className="mt-5 rounded-2xl bg-yellow-50 px-4 py-3 text-xs leading-relaxed text-yellow-800">
        {emailVerified
          ? "We’ll send a verification link to your new email. Your current email stays active until verification is complete."
          : "Your email will update after Neon accepts the change request."}
      </div>

      {sent ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-700"
        >
          <Check size={16} className="mt-0.5 shrink-0" />
          {emailVerified
            ? `Check ${normalizedEmail} to confirm your new email.`
            : "Your email has been updated."}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-600"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSave}
        className="mt-8 h-12 w-full rounded-2xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isSaving ? "Saving…" : "Change email"}
      </button>
    </form>
  );
}

export default function ChangeEmailPage() {
  const router = useRouter();
  const { data: session, isPending, refetch } = authClient.useSession();

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <div className="min-h-screen w-full max-w-[520px] bg-white px-6 pb-12 pt-8">
        <PageHeader onBack={() => router.back()} />

        <div className="mt-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
            <Mail size={22} strokeWidth={1.8} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900">
            Change email
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Update the email you use to sign in and receive account messages.
          </p>
        </div>

        {isPending ? (
          <p className="mt-10 text-sm text-gray-400">Loading account…</p>
        ) : session?.user?.email ? (
          <ChangeEmailForm
            key={session.user.id}
            currentEmail={session.user.email}
            emailVerified={Boolean(session.user.emailVerified)}
            onEmailUpdated={() => refetch?.()}
          />
        ) : (
          <p className="mt-10 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Sign in to update your email.
          </p>
        )}
      </div>
    </main>
  );
}
