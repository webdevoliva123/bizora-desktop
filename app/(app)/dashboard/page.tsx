import "server-only";

export const dynamic = "force-dynamic";

import {
    AlertTriangle,
    IndianRupee,
    Package,
    Wallet,
} from "lucide-react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import { getBusinessBasicDetails, getSetupStatus } from "@/lib/db/business";
import { getDashboardSummary, getRecentTransactions, getSalesOverview } from "@/lib/db/dashboard";
import { SalesOverviewChart } from "./components/sales-overview-chart";
import StatCard from "@/components/global-common/stat-card";

function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
        minimumFractionDigits: 2,
    }).format(amount / 100);
}

export default async function DashboardPage() {
    const setupStatus = await getSetupStatus();

    if (!setupStatus.completed || !setupStatus.businessId) {
        return null;
    }

    const business = getBusinessBasicDetails();

    if (!business) {
        return null;
    }

    const summary = getDashboardSummary(
        setupStatus.businessId,
    );

    const recentTransactions = getRecentTransactions(
        setupStatus.businessId,
        5,
    );

    const salesOverview = getSalesOverview(
        setupStatus.businessId,
        7,
    );

    const currency = business.currency;

    return (
        <PageContainer>
            <PageHeader
                title="Dashboard"
                description="Overview of your business activity."
            />




            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Today's Sales"
                    value={formatCurrency(summary.todaySales, currency)}
                    note="Today's recorded sales"
                    icon={IndianRupee}
                />

                <StatCard
                    title="Today's Payments"
                    value={formatCurrency(summary.todayPayments, currency)}
                    note="Payments received today"
                    icon={Wallet}
                />

                <StatCard
                    title="Outstanding"
                    value={formatCurrency(summary.outstanding, currency)}
                    note="Amount yet to be collected"
                    icon={IndianRupee}
                />

                <StatCard
                    title="Low Stock"
                    value={summary.lowStock}
                    note="Products below stock threshold"
                    icon={AlertTriangle}
                />
            </section>


            <section className="mt-6 grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                    </CardHeader>

                    <SalesOverviewChart
                        data={salesOverview}
                        currency={currency}
                    />
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                    </CardHeader>

                    <CardContent>
                        {recentTransactions.length === 0 ? (
                            <div className="flex min-h-64 items-center justify-center rounded-md border border-dashed">
                                <div className="text-center">
                                    <Wallet className="mx-auto size-8 text-muted-foreground" />

                                    <p className="mt-2 text-sm font-medium">
                                        No transactions yet
                                    </p>

                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Recent activity will appear here.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {recentTransactions.map((transaction) => (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between gap-4"
                                    >
                                        {/* Left side */}
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {transaction.title}
                                            </p>

                                            <p className="truncate text-xs text-muted-foreground">
                                                {transaction.description}
                                            </p>
                                        </div>

                                        {/* Right side */}
                                        <div className="shrink-0 text-right">
                                            <p
                                                className={`text-sm font-medium ${transaction.category === "SALE"
                                                    ? "text-orange-600"
                                                    : transaction.type === "CREDIT"
                                                        ? "text-green-600"
                                                        : "text-red-600"
                                                    }`}
                                            >
                                                {transaction.type === "CREDIT" ? "+" : "-"}
                                                {formatCurrency(
                                                    transaction.amount,
                                                    currency,
                                                )}
                                            </p>

                                            <p className="text-xs text-muted-foreground">
                                                {transaction.category === "SALE"
                                                    ? "Sale"
                                                    : transaction.category === "PAYMENT"
                                                        ? "Payment Received"
                                                        : transaction.category === "EXPENSE"
                                                            ? "Expense"
                                                            : "Stock Purchase"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </section>
        </PageContainer>
    );
}