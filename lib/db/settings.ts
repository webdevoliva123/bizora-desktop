import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  businessPaymentDetails,
  businessRegistrations,
  businesses,
  taxRegistrations,
} from "@/lib/db/schema";
import type {
  BusinessSettings,
  PaymentDetailsSettings,
  RegulatoryRow,
  TaxRegistrationRow,
} from "@/lib/types/settings";
import { COUNTRIES } from "../constant/business";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[0-9+()\-\s]{6,20}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function clean(value?: string | null) {
  return value?.trim() || null;
}

function isDate(value: string) {
  return DATE_PATTERN.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`));
}

/* -------------------------------------------------------------------------- */
/* Business                                                                   */
/* -------------------------------------------------------------------------- */

export type BusinessInput = {
  name: string;
  businessType: string;
  businessCategory: string;
  country: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
};

export function getBusinessSettings(businessId: number): BusinessSettings | undefined {
  return db
    .select({
      id: businesses.id,
      name: businesses.name,
      logoPath: businesses.logoPath,
      businessType: businesses.businessType,
      businessCategory: businesses.businessCategory,
      country: businesses.country,
      currency: businesses.currency,
      address: businesses.address,
      city: businesses.city,
      state: businesses.state,
      postalCode: businesses.postalCode,
      phone: businesses.phone,
      email: businesses.email,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .get();
}

export function parseBusinessInput(input: BusinessInput) {
  const name = (input.name ?? "").trim().replace(/\s+/g, " ");
  const businessType = (input.businessType ?? "").trim();
  const phone = (input.phone ?? "").trim();
  const email = (input.email ?? "").trim();

  if (!name) throw new Error("Business name is required.");
  if (name.length > 120) throw new Error("Business name is too long.");
  if (!businessType) throw new Error("Select a business type.");

  const country = COUNTRIES.find((item) => item.code === input.country);
  if (!country) throw new Error("Select a valid country.");

  if (phone && !PHONE_PATTERN.test(phone)) {
    throw new Error("Enter a valid phone number.");
  }

  if (email && !EMAIL_PATTERN.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  return {
    name,
    businessType,
    businessCategory: clean(input.businessCategory),
    country: country.code,
    currency: country.currency,
    address: clean(input.address),
    city: clean(input.city),
    state: clean(input.state),
    postalCode: clean(input.postalCode),
    phone: phone || null,
    email: email ? email.toLowerCase() : null,
  };
}

export function updateBusiness(
  businessId: number,
  input: ReturnType<typeof parseBusinessInput>,
) {
  db.update(businesses)
    .set({ ...input, updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, businessId))
    .run();
}

/** Sets (or clears) the logo. Returns the previous path so the caller can delete the old file. */
export function setBusinessLogoPath(businessId: number, logoPath: string | null) {
  const existing = db
    .select({ logoPath: businesses.logoPath })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .get();

  db.update(businesses)
    .set({ logoPath, updatedAt: new Date().toISOString() })
    .where(eq(businesses.id, businessId))
    .run();

  return existing?.logoPath ?? null;
}

/* -------------------------------------------------------------------------- */
/* Tax registrations                                                          */
/* -------------------------------------------------------------------------- */

export type TaxRowInput = { taxSystem: string; registrationNumber: string };

export function getTaxRegistrations(businessId: number): TaxRegistrationRow[] {
  return db
    .select({
      id: taxRegistrations.id,
      taxSystem: taxRegistrations.taxSystem,
      registrationNumber: taxRegistrations.registrationNumber,
    })
    .from(taxRegistrations)
    .where(eq(taxRegistrations.businessId, businessId))
    .orderBy(taxRegistrations.id)
    .all();
}

export function replaceTaxRegistrations(businessId: number, rows: TaxRowInput[]) {
  if (!Array.isArray(rows)) throw new Error("Invalid tax registrations.");
  if (rows.length > 20) throw new Error("You can add up to 20 tax registrations.");

  const business = getBusinessSettings(businessId);
  if (!business) throw new Error("Business not found.");

  const parsed = rows
    .map((row) => ({
      taxSystem: (row.taxSystem ?? "").trim(),
      registrationNumber: (row.registrationNumber ?? "").trim(),
    }))
    .filter((row) => row.taxSystem || row.registrationNumber)
    .map((row) => {
      if (!row.taxSystem) {
        throw new Error("Enter the tax system (for example GST) for every registration.");
      }

      return row;
    });

  const now = new Date().toISOString();

  db.transaction((tx) => {
    tx.delete(taxRegistrations).where(eq(taxRegistrations.businessId, businessId)).run();

    if (parsed.length > 0) {
      tx.insert(taxRegistrations)
        .values(
          parsed.map((row) => ({
            businessId,
            country: business.country,
            taxSystem: row.taxSystem,
            registrationNumber: row.registrationNumber || null,
            isRegistered: Boolean(row.registrationNumber),
            createdAt: now,
            updatedAt: now,
          })),
        )
        .run();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Regulatory registrations                                                   */
/* -------------------------------------------------------------------------- */

export type RegulatoryRowInput = {
  authorityName: string;
  registrationType: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
};

export function getRegulatoryRegistrations(businessId: number): RegulatoryRow[] {
  return db
    .select({
      id: businessRegistrations.id,
      authorityName: businessRegistrations.authorityName,
      registrationType: businessRegistrations.registrationType,
      registrationNumber: businessRegistrations.registrationNumber,
      issueDate: businessRegistrations.issueDate,
      expiryDate: businessRegistrations.expiryDate,
    })
    .from(businessRegistrations)
    .where(eq(businessRegistrations.businessId, businessId))
    .orderBy(businessRegistrations.id)
    .all();
}

export function replaceRegulatoryRegistrations(
  businessId: number,
  rows: RegulatoryRowInput[],
) {
  if (!Array.isArray(rows)) throw new Error("Invalid registrations.");
  if (rows.length > 20) throw new Error("You can add up to 20 registrations.");

  const business = getBusinessSettings(businessId);
  if (!business) throw new Error("Business not found.");

  const parsed = rows
    .map((row) => ({
      authorityName: (row.authorityName ?? "").trim(),
      registrationType: (row.registrationType ?? "").trim(),
      registrationNumber: (row.registrationNumber ?? "").trim(),
      issueDate: (row.issueDate ?? "").trim(),
      expiryDate: (row.expiryDate ?? "").trim(),
    }))
    .filter(
      (row) =>
        row.authorityName ||
        row.registrationType ||
        row.registrationNumber ||
        row.issueDate ||
        row.expiryDate,
    )
    .map((row) => {
      if (!row.authorityName || !row.registrationType) {
        throw new Error("Enter the authority and registration type for every registration.");
      }
      if (row.issueDate && !isDate(row.issueDate)) {
        throw new Error("Enter a valid issue date.");
      }
      if (row.expiryDate && !isDate(row.expiryDate)) {
        throw new Error("Enter a valid expiry date.");
      }
      if (row.issueDate && row.expiryDate && row.expiryDate < row.issueDate) {
        throw new Error(`The expiry date of "${row.registrationType}" is before its issue date.`);
      }

      return row;
    });

  const now = new Date().toISOString();

  db.transaction((tx) => {
    tx.delete(businessRegistrations)
      .where(eq(businessRegistrations.businessId, businessId))
      .run();

    if (parsed.length > 0) {
      tx.insert(businessRegistrations)
        .values(
          parsed.map((row) => ({
            businessId,
            country: business.country,
            authorityName: row.authorityName,
            registrationType: row.registrationType,
            registrationNumber: row.registrationNumber || null,
            issueDate: row.issueDate || null,
            expiryDate: row.expiryDate || null,
            createdAt: now,
            updatedAt: now,
          })),
        )
        .run();
    }
  });
}

/* -------------------------------------------------------------------------- */
/* Payment details                                                            */
/* -------------------------------------------------------------------------- */

export type PaymentInput = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  routingCode: string;
  paymentIdentifier: string;
  paymentInstructions: string;
  showBankDetails: boolean;
  showQr: boolean;
};

export function getPaymentDetails(businessId: number): PaymentDetailsSettings | undefined {
  return db
    .select({
      bankName: businessPaymentDetails.bankName,
      accountName: businessPaymentDetails.accountName,
      accountNumber: businessPaymentDetails.accountNumber,
      branchName: businessPaymentDetails.branchName,
      routingCode: businessPaymentDetails.routingCode,
      paymentIdentifier: businessPaymentDetails.paymentIdentifier,
      qrImagePath: businessPaymentDetails.qrImagePath,
      showBankDetails: businessPaymentDetails.showBankDetails,
      showQr: businessPaymentDetails.showQr,
      paymentInstructions: businessPaymentDetails.paymentInstructions,
    })
    .from(businessPaymentDetails)
    .where(eq(businessPaymentDetails.businessId, businessId))
    .get();
}

function findPaymentRow(businessId: number) {
  return db
    .select({ id: businessPaymentDetails.id, qrImagePath: businessPaymentDetails.qrImagePath })
    .from(businessPaymentDetails)
    .where(eq(businessPaymentDetails.businessId, businessId))
    .get();
}

export function savePaymentDetails(businessId: number, input: PaymentInput) {
  const instructions = (input.paymentInstructions ?? "").trim();

  if (instructions.length > 1000) {
    throw new Error("Payment instructions are too long (1000 characters maximum).");
  }

  const values = {
    bankName: clean(input.bankName),
    accountName: clean(input.accountName),
    accountNumber: clean(input.accountNumber),
    branchName: clean(input.branchName),
    routingCode: clean(input.routingCode),
    paymentIdentifier: clean(input.paymentIdentifier),
    paymentInstructions: instructions || null,
    showBankDetails: Boolean(input.showBankDetails),
    showQr: Boolean(input.showQr),
  };

  const now = new Date().toISOString();
  const existing = findPaymentRow(businessId);

  if (existing) {
    db.update(businessPaymentDetails)
      .set({ ...values, updatedAt: now })
      .where(eq(businessPaymentDetails.id, existing.id))
      .run();
    return;
  }

  db.insert(businessPaymentDetails)
    .values({ businessId, ...values, qrImagePath: null, createdAt: now, updatedAt: now })
    .run();
}

/** Sets (or clears) the QR image. Returns the previous path so the caller can delete the old file. */
export function setPaymentQrPath(businessId: number, qrImagePath: string | null) {
  const now = new Date().toISOString();
  const existing = findPaymentRow(businessId);

  if (existing) {
    db.update(businessPaymentDetails)
      .set({
        qrImagePath,
        ...(qrImagePath ? { showQr: true } : {}),
        updatedAt: now,
      })
      .where(eq(businessPaymentDetails.id, existing.id))
      .run();

    return existing.qrImagePath ?? null;
  }

  db.insert(businessPaymentDetails)
    .values({
      businessId,
      qrImagePath,
      showBankDetails: true,
      showQr: Boolean(qrImagePath),
      createdAt: now,
      updatedAt: now,
    })
    .run();

  return null;
}