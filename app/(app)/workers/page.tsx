import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import AddWorkerDialog from "./components/worker-form-dialog";
import WorkerList from "./components/worker-list-table";

export default function WorkersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Workers"
        description="Manage your workers and keep track of the salary you pay them."
        actions={<AddWorkerDialog />}
      />

      <section className="mt-6">
        <WorkerList />
      </section>
    </PageContainer>
  );
}