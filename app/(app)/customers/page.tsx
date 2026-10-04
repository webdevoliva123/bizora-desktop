import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import AddCustomerDialog from "./components/add-customer-dialog";
import CustomerList from "./components/customer-list-table";

export default function CustomersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Customers"
        description="Manage your customers and view their account activity."
        actions={<AddCustomerDialog />}
      />

      <section className="mt-6">
        <CustomerList />
      </section>
    </PageContainer>
  );
}