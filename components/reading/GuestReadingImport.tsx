"use client";

import { useEffect, useMemo, useState } from "react";

import { authClient } from "@/lib/auth/client";
import {
  fetchDatabaseReadings,
  saveDatabaseReading,
} from "@/lib/readings/client";
import { readGuestReadings } from "@/lib/readings/guest";
import { dailyCardSpread } from "@/lib/spreads";
import {
  activateAuthenticatedReadingStorage,
  useTarotStore,
} from "@/store/tarotStore";
import type { Reading } from "@/types/reading";

export default function GuestReadingImport() {
  const { data: session } = authClient.useSession();
  const history = useTarotStore((state) => state.history);
  const persistenceMode = useTarotStore((state) => state.persistenceMode);
  const [guestReadings, setGuestReadings] = useState<Reading[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [importing, setImporting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  useEffect(() => {
    if (persistenceMode !== "authenticated") return;
    queueMicrotask(() => setGuestReadings(readGuestReadings()));
  }, [persistenceMode, session?.user?.id]);

  const databaseReadingIds = useMemo(
    () => new Set(history.map((reading) => reading.id)),
    [history],
  );
  const databaseDailyReadingDates = useMemo(
    () =>
      new Set(
        history
          .filter((reading) => reading.spread.id === dailyCardSpread.id)
          .map((reading) => new Date(reading.createdAt).toDateString()),
      ),
    [history],
  );
  const readingsToImport = guestReadings.filter((reading) => {
    if (databaseReadingIds.has(reading.id)) return false;

    return !(
      reading.spread.id === dailyCardSpread.id &&
      databaseDailyReadingDates.has(
        new Date(reading.createdAt).toDateString(),
      )
    );
  });

  if (
    !session?.user ||
    persistenceMode !== "authenticated" ||
    dismissed ||
    readingsToImport.length === 0
  ) {
    return resultMessage ? (
      <p className="mb-5 rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
        {resultMessage}
      </p>
    ) : null;
  }

  async function importReadings() {
    if (importing) return;

    setImporting(true);
    setResultMessage(null);

    const results = await Promise.allSettled(
      readingsToImport.map(saveDatabaseReading),
    );
    const importedCount = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failedCount = results.length - importedCount;

    try {
      const databaseReadings = await fetchDatabaseReadings();
      activateAuthenticatedReadingStorage(databaseReadings);
      setGuestReadings(readGuestReadings());
    } catch (error) {
      console.error("Failed to refresh readings after import:", error);
    }

    setResultMessage(
      failedCount === 0
        ? `${importedCount} local ${importedCount === 1 ? "reading" : "readings"} saved to your account. Local copies were kept.`
        : `${importedCount} imported, ${failedCount} failed. Your local copies are still safe.`,
    );
    setImporting(false);
  }

  return (
    <section className="mb-6 rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-sm font-medium text-gray-900">
        {readingsToImport.length} local {readingsToImport.length === 1
          ? "reading"
          : "readings"} found on this device
      </p>
      <p className="mt-1 text-xs leading-relaxed text-gray-500">
        Save them to your account so they are available on your other devices.
      </p>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => void importReadings()}
          disabled={importing}
          className="text-sm font-medium text-gray-900 disabled:text-gray-400"
        >
          {importing ? "Saving…" : "Save to my account"}
        </button>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          disabled={importing}
          className="text-sm text-gray-500 disabled:text-gray-300"
        >
          Not now
        </button>
      </div>
    </section>
  );
}
