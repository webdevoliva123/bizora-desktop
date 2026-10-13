import { redirect } from "next/navigation";
import { CheckCircle2, Package, Truck, Wallet } from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import { getBusinessBasicDetails, getSetupStatus } from "@/lib/db/business";
import { getSuppliersWithStats } from "@/lib/db/suppliers";
import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";

import { AddSupplierDialog } from "./components/supplier-form-dialog";
import { SuppliersTable } from "./components/suppliers-table";
import StatCard from "@/components/global-common/stat-card";

export default async function SuppliersPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  const business = getBusinessBasicDetails();
  const currency = business?.currency || "INR";

  const suppliers = getSuppliersWithStats(setup.businessId);

  const activeCount = suppliers.filter((supplier) => supplier.active).length;
  const totalAmount = suppliers.reduce((sum, supplier) => sum + supplier.totalAmount, 0);
  const paidAmount = suppliers.reduce((sum, supplier) => sum + supplier.paidAmount, 0);
  const owingCount = suppliers.filter(
    (supplier) => supplier.totalAmount - supplier.paidAmount > 0,
  ).length;

  return (
    <PageContainer>
      <PageHeader
        title="Suppliers"
        description="Manage your suppliers and see what you buy from each of them."
        actions={<AddSupplierDialog />}
      />

      <section className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Suppliers" value={suppliers.length} icon={Truck} />
          <StatCard title="Active" value={activeCount} icon={CheckCircle2} />
          <StatCard
            title="Total purchased"
            value={formatMoney(totalAmount, currency)}
            icon={Package}
          />
          <StatCard
            title="Outstanding"
            value={formatMoney(totalAmount - paidAmount, currency)}
            note={`${owingCount} ${owingCount === 1 ? "supplier" : "suppliers"} to pay`}
            icon={Wallet}
          />
        </div>

        <SuppliersTable suppliers={suppliers} currency={currency} />
      </section>
    </PageContainer>
  );
}