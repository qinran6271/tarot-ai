"use client";

import { Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import PageHeader from "@/components/PageHeader";
import { authClient } from "@/lib/auth/client";

function maskEmail(email?: string | null) {
  if (!email) return "your account email";

  const [name, domain] = email.split("@");
  if (!domain) return email;
  const visibleCharacters = Math.min(2, name.length);
  return `${name.slice(0, visibleCharacters)}${"•".repeat(
    Math.max(3, name.length - visibleCharacters),
  )}@${domain}`;
}

export default function PasswordSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const emailLabel = isPending
    ? "Checking your account…"
    : maskEmail(session?.user?.email);

  useEffect(() => {
    if (cooldown <= 0) return;

    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldown]);

  async function sendResetEmail() {
    const email = session?.user?.email;
    if (!email || isSending || cooldown > 0) return;

    setIsSending(true);
    setErrorMessage(null);

    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (result.error) throw result.error;

      setSent(true);
      setCooldown(60);
    } catch (error) {
      console.error("Failed to send password reset email:", error);
      setErrorMessage(
        "We couldn’t send the reset email. Please try again in a moment.",
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <div className="min-h-screen w-full max-w-[520px] bg-white px-6 pb-12 pt-8">
        <PageHeader onBack={() => router.back()} />

        <div className="mt-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
            <Mail size={22} strokeWidth={1.8} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900">
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            We&apos;ll email you a secure link to choose a new password.
          </p>
        </div>

        <section className="mt-10 rounded-3xl border border-gray-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">
            Reset link will be sent to
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500">
              <Mail size={18} />
            </span>
            <p className="min-w-0 truncate text-sm font-medium text-gray-900">
              {emailLabel}
            </p>
          </div>
        </section>

        <div className="mt-6 flex gap-3 rounded-2xl bg-gray-50 p-4 text-gray-500">
          <ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-gray-700">Secure reset</p>
            <p className="mt-1 text-xs leading-relaxed">
              The link will expire and can only be used to reset this account.
            </p>
          </div>
        </div>

        {sent ? (
          <div
            role="status"
            className="mt-6 rounded-2xl bg-green-50 px-4 py-3 text-sm leading-relaxed text-green-700"
          >
            Check your inbox. We sent a password reset link to {emailLabel}.
          </div>
        ) : null}

        {errorMessage ? (
          <p
            role="alert"
            className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-600"
          >
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void sendResetEmail()}
          disabled={
            isPending ||
            !session?.user?.email ||
            isSending ||
            cooldown > 0
          }
          className="mt-8 h-12 w-full rounded-2xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {isSending
            ? "Sending…"
            : cooldown > 0
              ? `Resend in ${cooldown}s`
              : sent
                ? "Resend reset email"
                : "Send reset email"}
        </button>
      </div>
    </main>
  );
}
