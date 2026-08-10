import type { Reading } from "@/types/reading";

const saveQueues = new Map<string, Promise<void>>();

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Reading request failed.");
  }

  return response.json() as Promise<T>;
}

// GET /api/readings
export async function fetchDatabaseReadings(): Promise<Reading[]> {
  const response = await fetch("/api/readings", { cache: "no-store" });
  return parseResponse<Reading[]>(response);
}

// GET /api/readings/:readingId
export async function fetchDatabaseReading(
  readingId: string,
): Promise<Reading | null> {
  const response = await fetch(`/api/readings/${readingId}`, {
    cache: "no-store",
  });

  if (response.status === 404) return null;
  return parseResponse<Reading>(response);
}

// PUT /api/readings/:readingId
export async function saveDatabaseReading(reading: Reading): Promise<void> {
  const previousSave = saveQueues.get(reading.id) ?? Promise.resolve();
  const nextSave = previousSave
    .catch(() => undefined)
    .then(async () => {
      const response = await fetch(`/api/readings/${reading.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reading }),
      });

      await parseResponse<{ ok: true }>(response);
    });

  saveQueues.set(reading.id, nextSave);
  try {
    await nextSave;
  } finally {
    if (saveQueues.get(reading.id) === nextSave) {
      saveQueues.delete(reading.id);
    }
  }
}

// DELETE /api/readings/:readingId
export async function deleteDatabaseReading(readingId: string): Promise<void> {
  await saveQueues.get(readingId)?.catch(() => undefined);
  const response = await fetch(`/api/readings/${readingId}`, {
    method: "DELETE",
  });

  await parseResponse<{ ok: true }>(response);
}
