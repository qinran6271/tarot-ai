import { getAuthenticatedUser } from "@/lib/auth/server";
import {
  deleteReadingForUser,
  getReadingForUser,
  saveReadingForUser,
} from "@/lib/readings/server";
import type { Reading } from "@/types/reading";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  context: RouteContext<"/api/readings/[readingId]">,
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { readingId } = await context.params;
  if (!UUID_PATTERN.test(readingId)) {
    return Response.json({ error: "Invalid reading ID" }, { status: 400 });
  }

  const reading = await getReadingForUser(user.id, readingId);
  if (!reading) {
    return Response.json({ error: "Reading not found" }, { status: 404 });
  }

  return Response.json(reading);
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/readings/[readingId]">,
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { readingId } = await context.params;
  if (!UUID_PATTERN.test(readingId)) {
    return Response.json({ error: "Invalid reading ID" }, { status: 400 });
  }

  const body = (await request.json()) as { reading?: Reading };
  if (!body.reading || body.reading.id !== readingId) {
    return Response.json({ error: "Invalid reading" }, { status: 400 });
  }

  const result = await saveReadingForUser(user.id, body.reading);
  if (result === "forbidden") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  return Response.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/readings/[readingId]">,
) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { readingId } = await context.params;
  if (!UUID_PATTERN.test(readingId)) {
    return Response.json({ error: "Invalid reading ID" }, { status: 400 });
  }

  const deleted = await deleteReadingForUser(user.id, readingId);
  if (!deleted) {
    return Response.json({ error: "Reading not found" }, { status: 404 });
  }

  return Response.json({ ok: true });
}
