"use client";

export async function deleteCurrentAccount(): Promise<void> {
  const response = await fetch("/api/me", { method: "DELETE" });
  if (response.ok) return;

  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  throw new Error(body?.error ?? "Account deletion failed.");
}
