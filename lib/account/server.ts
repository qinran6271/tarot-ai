import "server-only";

import { sql } from "drizzle-orm";

import { db } from "@/db";
import { readings } from "@/db/schema";

export async function deleteAccountForUser(userId: string): Promise<void> {
  await db.batch([
    db.delete(readings).where(sql`${readings.userId} = ${userId}`),
    db.execute(sql`delete from neon_auth."user" where id = ${userId}::uuid`),
  ]);
}
