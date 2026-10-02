import "server-only";

import { eq } from "drizzle-orm";

import { db } from "./index";
import { businesses } from "./schema";
import { BusinessBasicDetails } from "../types/business";

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

export function getBusinessBasicDetails() {
    const business = db
      .select({
        id: businesses.id,
        name: businesses.name,
        logoPath: businesses.logoPath,
        businessType: businesses.businessType,
        businessCategory: businesses.businessCategory,
        country: businesses.country,
        currency: businesses.currency,
        phone: businesses.phone,
        email: businesses.email,
        address: businesses.address,
        city: businesses.city,
        state: businesses.state,
        postalCode: businesses.postalCode,
      })
      .from(businesses)
      .where(eq(businesses.setupCompleted, true))
      .limit(1)
      .get();
  
    return business ?? null;
  }