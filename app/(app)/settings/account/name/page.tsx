"use client";

import { Check, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import PageHeader from "@/components/PageHeader";
import { authClient } from "@/lib/auth/client";

function DisplayNameForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const normalizedName = name.trim();
  const canSave =
    normalizedName.length > 0 &&
    normalizedName.length <= 50 &&
    normalizedName !== initialName.trim() &&
    !isSaving;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave) return;

    setIsSaving(true);
    setSaved(false);
    setErrorMessage(null);

    try {
      await authClient.updateUser({
        name: normalizedName,
        fetchOptions: { throw: true },
      });
      setName(normalizedName);
      setSaved(true);
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error && error.message
          ? error.message
          : "We couldn’t update your display name. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10">
      <label htmlFor="display-name" className="block">
        <span className="text-sm font-medium text-gray-700">Display name</span>
        <input
          id="display-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setSaved(false);
            setErrorMessage(null);
          }}
          autoComplete="name"
          maxLength={50}
          placeholder="Enter your name"
          className="mt-2 h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition-colors placeholder:text-gray-300 focus:border-yellow-300 focus:ring-2 focus:ring-yellow-100"
        />
      </label>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
        <span>This is how WALAWALA will address you.</span>
        <span>{name.length}/50</span>
      </div>

      {saved ? (
        <p
          role="status"
          className="mt-5 flex items-center gap-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700"
        >
          <Check size={16} />
          Display name updated.
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
        {isSaving ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export default function DisplayNamePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  return (
    <main className="flex min-h-screen justify-center bg-gray-100">
      <div className="min-h-screen w-full max-w-[520px] bg-white px-6 pb-12 pt-8">
        <PageHeader onBack={() => router.back()} />

        <div className="mt-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-700">
            <UserRound size={22} strokeWidth={1.8} />
          </div>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight text-gray-900">
            Display name
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-gray-500">
            Choose the name you want to see throughout your tarot experience.
          </p>
        </div>

        {isPending ? (
          <p className="mt-10 text-sm text-gray-400">Loading account…</p>
        ) : session?.user ? (
          <DisplayNameForm
            key={session.user.id}
            initialName={session.user.name ?? ""}
          />
        ) : (
          <p className="mt-10 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
            Sign in to update your display name.
          </p>
        )}
      </div>
    </main>
  );
}
