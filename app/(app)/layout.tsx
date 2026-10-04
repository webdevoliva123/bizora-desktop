import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { BusinessProvider } from "@/components/providers/business-provider";
import { getSetupStatus } from "@/lib/db/business";

export default async function BusinessLayout({
  children,
}: {
  children: ReactNode;
}) {
  const setupStatus = await getSetupStatus();

  if (!setupStatus.completed) {
    redirect("/setup");
  }

  return (
    <BusinessProvider>
      <AppShell>{children}</AppShell>
    </BusinessProvider>
  );
}