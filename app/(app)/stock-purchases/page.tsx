import { CheckCircle2, Package, Receipt, Wallet } from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import {
    Card,
    CardContent
} from "@/components/ui/card";

import { getBusinessBasicDetails, getSetupStatus } from "@/lib/db/business";
import {
    getActiveSuppliers,
    getPurchasableProducts,
    getStockPurchases,
} from "@/lib/db/stock-purchases";

import { AddStockPurchaseDialog } from "./components/add-stock-purchase-dialog";
import { formatMoney } from "./components/stock-purchase-shared";
import { StockPurchasesTable } from "./components/stock-purchases-table";
import StatCard from "@/components/global-common/stat-card";




export default async function StockPurchasesPage() {
    const setup = await getSetupStatus();

    if (!setup.completed || !setup.businessId) {
        return null;
    }

    const business = getBusinessBasicDetails();

    if (!business) {
        return null;
    }

    const suppliers = getActiveSuppliers(setup.businessId);
    const products = getPurchasableProducts(setup.businessId);
    const purchases = getStockPurchases(setup.businessId);

    const totalAmount = purchases.reduce((sum, p) => sum + p.total, 0);
    const unpaidPurchases = purchases.filter((p) => p.paymentStatus !== "PAID");
    const unpaidAmount = unpaidPurchases.reduce((sum, p) => sum + p.total, 0);
    const paidCount = purchases.length - unpaidPurchases.length;

    const currency = business.currency || "INR";
    const paidAmount = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
    const openCount = purchases.filter((p) => p.paymentStatus !== "PAID").length;

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: business.currency || "INR",
            maximumFractionDigits: 2,
        }).format(amount / 100);

    const formatDate = (date: string) =>
        new Date(`${date.slice(0, 10)}T00:00:00`).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });





    return (
        <PageContainer>
        <PageHeader
          title="Stock Purchases"
          description="Track inventory purchases, suppliers, and payments."
          actions={<AddStockPurchaseDialog suppliers={suppliers} products={products} />}
        />
    
        <section className="mt-6 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Purchases" value={purchases.length} icon={Receipt} />
            <StatCard title="Total value" value={formatMoney(totalAmount, currency)} icon={Package} />
            <StatCard
              title="Outstanding"
              value={formatMoney(totalAmount - paidAmount, currency)}
              note={`${openCount} unpaid or partially paid`}
              icon={Wallet}
            />
            <StatCard title="Fully paid" value={purchases.length - openCount} icon={CheckCircle2} />
          </div>
    
          <StockPurchasesTable
            purchases={purchases}
            currency={currency}
            suppliers={suppliers}
            products={products}
          />
        </section>
      </PageContainer>
    );
}