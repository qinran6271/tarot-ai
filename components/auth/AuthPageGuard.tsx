"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

export default function AuthPageGuard({
  children,
  allowSignedIn = false,
}: {
  children: ReactNode;
  allowSignedIn?: boolean;
}) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session?.user && !allowSignedIn) router.replace("/");
  }, [allowSignedIn, router, session?.user]);

  if (isPending || (session?.user && !allowSignedIn)) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-400">Checking account…</p>
      </main>
    );
  }

  return children;
}
