import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/app-shell";

interface BusinessLayoutProps {
  children: ReactNode;
}

export default function BusinessLayout({
  children,
}: Readonly<BusinessLayoutProps>) {
  return <AppShell>{children}</AppShell>;
}