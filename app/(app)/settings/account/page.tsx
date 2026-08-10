"use client";

import {
  AlertTriangle,
  ChevronRight,
  CircleUserRound,
  KeyRound,
  LoaderCircle,
  LogOut,
  Mail,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import PageHeader from "@/components/PageHeader";
import { authClient } from "@/lib/auth/client";
import { deleteCurrentAccount } from "@/lib/account/client";
import { useTarotStore } from "@/store/tarotStore";

function AccountRow({
  icon,
  label,
  description,
  href,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-500">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-400">
          {description}
        </p>
      </div>
      <ChevronRight size={17} className="shrink-0 text-gray-300" />
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex min-h-20 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none"
      >
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex min-h-20 w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none disabled:opacity-50"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="flex min-h-20 items-center gap-3 px-4 py-3.5">
      {content}
    </div>
  );
}

export default function AccountSettingsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [accountCheckFailed, setAccountCheckFailed] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const replaceReadings = useTarotStore((state) => state.replaceReadings);

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Failed to sign out:", error);
      setIsSigningOut(false);
    }
  }

  async function openDeleteDialog() {
    setDeleteDialogOpen(true);
    setIsCheckingAccount(true);
    setDeleteError(null);
    setAccountCheckFailed(false);
    setCurrentPassword("");
    setDeleteConfirmation("");

    try {
      const result = await authClient.listAccounts();
      if (result.error) throw result.error;
      setRequiresPassword(
        result.data?.some((account) => account.providerId === "credential") ??
          false,
      );
    } catch (error) {
      console.error("Failed to load account methods:", error);
      setAccountCheckFailed(true);
      setDeleteError(
        "We couldn’t verify your sign-in method. Close this window and try again.",
      );
    } finally {
      setIsCheckingAccount(false);
    }
  }

  async function handleDeleteAccount() {
    if (
      isDeleting ||
      deleteConfirmation !== "DELETE" ||
      (requiresPassword && !currentPassword)
    ) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      if (requiresPassword) {
        const email = session?.user?.email;
        if (!email) throw new Error("Your account email is unavailable.");

        await authClient.signIn.email({
          email,
          password: currentPassword,
          fetchOptions: { throw: true },
        });
      } else if (session?.session?.createdAt) {
        const sessionAge =
          Date.now() - new Date(session.session.createdAt).getTime();
        if (sessionAge >= 24 * 60 * 60 * 1000) {
          throw new Error(
            "For your security, sign out and sign back in before deleting your account.",
          );
        }
      }

      await deleteCurrentAccount();
      await authClient.signOut().catch(() => undefined);

      replaceReadings([]);
      router.push("/");
      router.refresh();
    } catch (error) {
      setDeleteError(
        error instanceof Error && error.message
          ? error.message
          : "We couldn’t delete your account. Please check your password and try again.",
      );
      setIsDeleting(false);
    }
  }

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <div className="min-h-screen w-full max-w-[520px] bg-white px-6 pb-12 pt-8">
        <PageHeader onBack={() => router.back()} />

        <div className="mb-8 mt-12">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Account
          </h1>
          <p className="mt-3 text-sm text-gray-500">
            Your sign-in and security settings.
          </p>
        </div>

        <section className="mb-8 rounded-3xl border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
              <CircleUserRound size={27} strokeWidth={1.6} />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">
                {session?.user?.name || "Your account"}
              </p>
              <p className="mt-1 truncate text-sm text-gray-400">
                {session?.user?.email || "Account details unavailable"}
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Account details
          </h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <AccountRow
              icon={<UserRound size={18} />}
              label="Display name"
              description={session?.user?.name || "Choose how we address you."}
              href="/settings/account/name"
            />
            <AccountRow
              icon={<Mail size={18} />}
              label="Email"
              description="Manage the email connected to your account."
            />
            <AccountRow
              icon={<KeyRound size={18} />}
              label="Password & security"
              description="Update your sign-in and security settings."
              href="/settings/account/password"
            />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="mb-3 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">
            Account
          </h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <AccountRow
              icon={<LogOut size={18} />}
              label={isSigningOut ? "Signing out…" : "Sign out"}
              description="Sign out of your account on this device."
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
            />
            <button
              type="button"
              onClick={() => void openDeleteDialog()}
              className="flex min-h-20 w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-red-50/50 focus-visible:bg-red-50/50 focus-visible:outline-none"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Trash2 size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-red-500">
                  Delete account
                </p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">
                  Permanently delete your account and synced data.
                </p>
              </div>
              <ChevronRight size={17} className="shrink-0 text-red-200" />
            </button>
          </div>
        </section>
      </div>

      {deleteDialogOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-gray-950/35 sm:items-center sm:p-6"
          onPointerDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) {
              setDeleteDialogOpen(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-md rounded-t-3xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle size={21} />
              </span>
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
                aria-label="Close delete account dialog"
              >
                <X size={20} />
              </button>
            </div>

            <h2
              id="delete-account-title"
              className="mt-5 text-xl font-semibold text-gray-900"
            >
              Delete your account?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-500">
              This permanently deletes your account and all synced readings.
              Local guest readings stored on this device will be kept.
            </p>

            {isCheckingAccount ? (
              <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
                <LoaderCircle size={17} className="animate-spin" />
                Checking your account…
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {requiresPassword ? (
                  <label className="block">
                    <span className="text-sm font-medium text-gray-700">
                      Current password
                    </span>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) =>
                        setCurrentPassword(event.target.value)
                      }
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      className="mt-2 h-12 w-full rounded-2xl border border-gray-200 px-4 text-gray-900 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                    />
                  </label>
                ) : null}

                <label className="block">
                  <span className="text-sm font-medium text-gray-700">
                    Type <span className="font-bold">DELETE</span> to confirm
                  </span>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) =>
                      setDeleteConfirmation(event.target.value)
                    }
                    autoComplete="off"
                    placeholder="DELETE"
                    className="mt-2 h-12 w-full rounded-2xl border border-gray-200 px-4 text-gray-900 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
                  />
                </label>
              </div>
            )}

            {deleteError ? (
              <p
                role="alert"
                className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-600"
              >
                {deleteError}
              </p>
            ) : null}

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={isDeleting}
                className="h-12 flex-1 rounded-2xl bg-gray-100 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={
                  isCheckingAccount ||
                  isDeleting ||
                  accountCheckFailed ||
                  deleteConfirmation !== "DELETE" ||
                  (requiresPassword && !currentPassword)
                }
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-red-500 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:bg-red-100 disabled:text-red-300"
              >
                {isDeleting ? (
                  <LoaderCircle size={17} className="animate-spin" />
                ) : null}
                {isDeleting ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
