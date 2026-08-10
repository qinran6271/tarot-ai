"use client";

import { useEffect, type ReactNode } from "react";
import { useParams } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import {
  fetchDatabaseReading,
  fetchDatabaseReadings,
  ReadingApiError,
  saveDatabaseReading,
} from "@/lib/readings/client";
import { readGuestReadings } from "@/lib/readings/guest";
import { dailyCardSpread } from "@/lib/spreads";
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
          let readings = readingId
            ? await fetchDatabaseReading(readingId).then((reading) =>
                reading ? [reading] : [],
              )
            : await fetchDatabaseReadings();

          if (!readingId) {
            const today = new Date().toDateString();
            const hasDatabaseDailyReading = readings.some(
              (reading) =>
                reading.spread.id === dailyCardSpread.id &&
                new Date(reading.createdAt).toDateString() === today,
            );

            if (!hasDatabaseDailyReading) {
              const localDailyReading = readGuestReadings().find(
                (reading) =>
                  reading.spread.id === dailyCardSpread.id &&
                  new Date(reading.createdAt).toDateString() === today,
              );

              if (localDailyReading) {
                try {
                  await saveDatabaseReading(localDailyReading);
                  readings = await fetchDatabaseReadings();
                } catch (error) {
                  console.warn(
                    "Failed to sync today's local daily reading:",
                    error,
                  );
                }
              }
            }
          }

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
