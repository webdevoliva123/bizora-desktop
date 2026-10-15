import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import { SettingsNav } from "./components/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageContainer>
      <PageHeader
        title="Settings"
        description="Manage your business information, tax details and payment details."
      />

      <div className="mt-2 grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-start">
        <aside className="rounded-xl border p-2">
          <SettingsNav />
        </aside>

        <div className="min-w-0 max-w-3xl">{children}</div>
      </div>
    </PageContainer>
  );
}