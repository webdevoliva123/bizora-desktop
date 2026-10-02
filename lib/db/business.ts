import "server-only";

import { eq } from "drizzle-orm";

import { db } from "./index";
import { businesses } from "./schema";

export async function getSetupStatus() {
  const business = await db
    .select({
      id: businesses.id,
      setupCompleted: businesses.setupCompleted,
    })
    .from(businesses)
    .where(eq(businesses.setupCompleted, true))
    .limit(1);

  return {
    completed: business.length > 0,
    businessId: business[0]?.id ?? null,
  };
}