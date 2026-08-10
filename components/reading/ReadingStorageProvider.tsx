"use client";

import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import {
  fetchDatabaseReading,
  fetchDatabaseReadings,
  ReadingApiError,
} from "@/lib/readings/client";
import {
  activateAuthenticatedReadingStorage,
  activateGuestReadingStorage,
  useTarotStore,
} from "@/store/tarotStore";

export default function ReadingStorageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user?.id;
  const { readingId } = useParams<{ readingId?: string }>();

  useEffect(() => {
    if (isPending) return;

    let cancelled = false;
    useTarotStore.setState({ storageReady: false });

    async function selectStorage() {
      if (userId) {
        try {
          const readings = readingId
            ? await fetchDatabaseReading(readingId).then((reading) =>
                reading ? [reading] : [],
              )
            : await fetchDatabaseReadings();
          if (!cancelled) activateAuthenticatedReadingStorage(readings);
        } catch (error) {
          if (error instanceof ReadingApiError && error.status === 401) {
            if (!cancelled) await activateGuestReadingStorage();
            return;
          }

          console.error("Failed to load database readings:", error);
          if (!cancelled) activateAuthenticatedReadingStorage([]);
        }
        return;
      }

      await activateGuestReadingStorage();
    }

    void selectStorage();

    return () => {
      cancelled = true;
    };
  }, [isPending, readingId, userId]);

  return children;
}
