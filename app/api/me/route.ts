import { getAuthenticatedUser } from "@/lib/auth/server";
import { deleteAccountForUser } from "@/lib/account/server";

export async function GET() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ user });
}

export async function DELETE() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  await deleteAccountForUser(user.id);
  return Response.json({ ok: true });
}
