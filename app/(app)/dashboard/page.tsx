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
                {/* Today's Sales */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            Today's Sales
                        </CardTitle>

                        <IndianRupee className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {formatCurrency(
                                summary.todaySales,
                                currency,
                            )}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Today's recorded sales
                        </p>
                    </CardContent>
                </Card>

                {/* Today's Payments */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            Today's Payments
                        </CardTitle>

                        <Wallet className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {formatCurrency(
                                summary.todayPayments,
                                currency,
                            )}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Payments received today
                        </p>
                    </CardContent>
                </Card>

                {/* Outstanding */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            Outstanding
                        </CardTitle>

                        <IndianRupee className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {formatCurrency(
                                summary.outstanding,
                                currency,
                            )}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Amount yet to be collected
                        </p>
                    </CardContent>
                </Card>

                {/* Low Stock */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-medium">
                            Low Stock
                        </CardTitle>

                        <AlertTriangle className="size-4 text-muted-foreground" />
                    </CardHeader>

                    <CardContent>
                        <div className="text-2xl font-semibold">
                            {summary.lowStock}
                        </div>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Products below stock threshold
                        </p>
                    </CardContent>
                </Card>
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