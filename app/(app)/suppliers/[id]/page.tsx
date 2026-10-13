import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, Package, Receipt, Wallet } from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { getBusinessBasicDetails, getSetupStatus } from "@/lib/db/business";
import { getSupplierById, getSupplierPurchases } from "@/lib/db/suppliers";
import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";

import { EditSupplierButton } from "../components/supplier-form-dialog";
import StatCard from "@/components/global-common/stat-card";
import { SupplierPurchasesByMonth } from "../components/supplier-purchases-by-month";

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium">{children || "—"}</dd>
    </div>
  );
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  const { id } = await params;
  const supplierId = Number(id);

  if (!Number.isInteger(supplierId) || supplierId <= 0) notFound();

  const supplier = getSupplierById(setup.businessId, supplierId);
  if (!supplier) notFound();

  const currency = getBusinessBasicDetails()?.currency || "INR";
  const purchases = getSupplierPurchases(setup.businessId, supplierId);

  const totalAmount = purchases.reduce((sum, p) => sum + p.total, 0);
  const paidAmount = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const openCount = purchases.filter((p) => p.paymentStatus !== "PAID").length;

  const address = [supplier.address, supplier.city, supplier.state, supplier.postalCode]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");

  return (
    <PageContainer>
      <PageHeader
        title={supplier.name}
        description={
          supplier.contactPerson
            ? `Contact: ${supplier.contactPerson}`
            : "Supplier details and purchase history."
        }
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/suppliers"
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              <ArrowLeft />
              Suppliers
            </Link>
            <EditSupplierButton supplier={supplier} />
          </div>
        }
      />

      <section className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Purchases" value={purchases.length} icon={Receipt} />
          <StatCard
            title="Total purchased"
            value={formatMoney(totalAmount, currency)}
            icon={Package}
          />
          <StatCard
            title="Outstanding"
            value={formatMoney(totalAmount - paidAmount, currency)}
            note={`${openCount} unpaid or partially paid`}
            icon={Wallet}
          />
          <StatCard
            title="Fully paid"
            value={purchases.length - openCount}
            icon={CheckCircle2}
          />
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Supplier details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Status">
                <Badge
                  variant="outline"
                  className={
                    supplier.active
                      ? "border-transparent bg-emerald-100 text-emerald-700"
                      : "border-transparent bg-muted text-muted-foreground"
                  }
                >
                  {supplier.active ? "Active" : "Inactive"}
                </Badge>
              </Detail>
              <Detail label="Phone">{supplier.phone}</Detail>
              <Detail label="Email">{supplier.email}</Detail>
              <Detail label="Tax / GST number">{supplier.taxRegistrationNumber}</Detail>
              <div className="sm:col-span-2">
                <Detail label="Address">{address}</Detail>
              </div>
              {supplier.notes && (
                <div className="sm:col-span-2">
                  <Detail label="Notes">{supplier.notes}</Detail>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <SupplierPurchasesByMonth purchases={purchases} currency={currency} />
      </section>
    </PageContainer>
  );
}