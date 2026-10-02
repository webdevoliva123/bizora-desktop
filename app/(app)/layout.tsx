import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { getSetupStatus } from "@/lib/db/business";

interface BusinessLayoutProps {
  children: ReactNode;
}

export default async function BusinessLayout({
  children,
}: Readonly<BusinessLayoutProps>) {
  const setupStatus = await getSetupStatus();

  if (!setupStatus.completed) {
    redirect("/setup");
  }

  return <AppShell>{children}</AppShell>;
}