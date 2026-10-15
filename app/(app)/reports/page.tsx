import { redirect } from "next/navigation";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import { getSetupStatus } from "@/lib/db/business";
import { getReport } from "@/lib/db/reports";
import { currentPeriodKey } from "@/lib/reports/period";

import { ReportsView } from "./components/reports-view";

export default async function ReportsPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  const report = getReport(
    setup.businessId,
    "month",
    currentPeriodKey("month"),
  );

  if (!report) {
    redirect("/setup");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Reports"
        description="See how the business is doing each month and year, and print a report."
      />

      <section className="mt-6">
        <ReportsView initialReport={report} />
      </section>
    </PageContainer>
  );
}