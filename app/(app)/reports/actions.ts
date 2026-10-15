"use server";

import { getSetupStatus } from "@/lib/db/business";
import { getReport } from "@/lib/db/reports";
import { isValidPeriod, type ReportPeriodType } from "@/lib/reports/period";
import type { ReportData } from "@/lib/types/report";

export type ReportActionResult =
  | { success: true; report: ReportData }
  | { success: false; error: string };

export async function getReportAction(
  type: ReportPeriodType,
  key: string,
): Promise<ReportActionResult> {
  try {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
      throw new Error("Complete your business setup first.");
    }

    if (!isValidPeriod(type, key)) {
      throw new Error("Choose a valid month or year.");
    }

    const report = getReport(setup.businessId, type, key);

    if (!report) throw new Error("Business not found.");

    return { success: true, report };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong.",
    };
  }
}