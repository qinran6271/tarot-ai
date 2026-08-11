"use client";

import { Check, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import PageHeader from "@/components/PageHeader";
import { authClient } from "@/lib/auth/client";

function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [signOutOtherDevices, setSignOutOtherDevices] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canSave =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    currentPassword !== newPassword &&
    !isSaving;

  function clearStatus() {
    setSaved(false);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    setIsSaving(true);
    setSaved(false);
    setErrorMessage(null);

    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: signOutOtherDevices,
        fetchOptions: { throw: true },
      });
      setCurrentPassword("");
      setNewPassword("");
      setSaved(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "We couldn’t update your password. Check your current password and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10">
      <label htmlFor="current-password" className="block">
        <span className="text-sm font-medium text-gray-700">
          Current password
        </span>
        <span className="relative mt-2 block">
          <input
            id="current-password"
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              clearStatus();
            }}
            autoComplete="current-password"
            required
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 pr-12 text-gray-900 outline-none transition-colors focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100"
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword((current) => !current)}
            aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-gray-700"
          >
            {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      <label htmlFor="new-password" className="mt-5 block">
        <span className="text-sm font-medium text-gray-700">New password</span>
        <span className="relative mt-2 block">
          <input
            id="new-password"
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              clearStatus();
            }}
            autoComplete="new-password"
            required
            className="h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 pr-12 text-gray-900 outline-none transition-colors focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100"
          />
          <button
            type="button"
            onClick={() => setShowNewPassword((current) => !current)}
            aria-label={showNewPassword ? "Hide new password" : "Show new password"}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-400 transition-colors hover:text-gray-700"
          >
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {newPassword.length > 0 && currentPassword === newPassword ? (
        <p className="mt-2 text-xs text-red-500">
          Your new password must be different from your current password.
        </p>
      ) : null}

      <label className="mt-6 flex cursor-pointer gap-3 rounded-2xl bg-gray-50 p-4 text-gray-500">
        <input
          type="checkbox"
          checked={signOutOtherDevices}
          onChange={(event) => setSignOutOtherDevices(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-gray-900"
        />
        <span>
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <ShieldCheck size={17} />
            Sign out on other devices
          </span>
          <span className="mt-1 block text-xs leading-relaxed">
            This device stays signed in. Other devices will need your new
            password the next time they sign in.
          </span>
        </span>
      </label>

      {saved ? (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <Check size={16} />
          {signOutOtherDevices
            ? "Password updated. Other devices have been signed out."
            : "Password updated."}
        </p>
      ) : null}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSave}
        className="mt-8 h-12 w-full rounded-2xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400"
      >
        {isSaving ? "Updating…" : "Update password"}
      </button>

      <p className="mt-5 text-center text-sm text-gray-500">
        Forgot your current password?{" "}
        <Link
          href="/auth/forgot-password"
          className="font-medium text-gray-900 underline decoration-gray-300 underline-offset-4"
        >
          Reset it by email
        </Link>
      </p>
    </form>
  );
}

export default function PasswordSettingsPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <div className="min-h-screen w-full max-w-[520px] bg-white px-6 pb-12 pt-8">
        <PageHeader onBack={() => router.back()} />

        <div className="mt-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
            <KeyRound size={22} strokeWidth={1.8} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900">
            Password & security
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Choose a new password for your account.
          </p>
        </div>

        {isPending ? (
          <p className="mt-10 text-sm text-gray-400">Loading account…</p>
        ) : session?.user ? (
          <PasswordForm key={session.user.id} />
        ) : (
          <p className="mt-10 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Sign in to update your password.
          </p>
        )}
      </div>
    </main>
  );
}
