import { redirect } from "next/navigation";
import { Receipt, Tags, TrendingUp, Wallet } from "lucide-react";

import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";

import { getBusinessBasicDetails, getSetupStatus } from "@/lib/db/business";
import { getExpenseCategories, getExpenses } from "@/lib/db/expenses";
import { formatMoney } from "@/app/(app)/stock-purchases/components/stock-purchase-shared";

import { AddExpenseDialog } from "./components/expense-form-dialog";
import { ExpensesTable } from "./components/expenses-table";
import StatCard from "@/components/global-common/stat-card";

export default async function ExpensesPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  const business = getBusinessBasicDetails();
  const currency = business?.currency || "INR";

  const expenses = getExpenses(setup.businessId);
  const categories = getExpenseCategories(setup.businessId);

  const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  const byCategory = new Map<string, number>();
  for (const expense of expenses) {
    const name = expense.categoryName ?? "Uncategorised";
    byCategory.set(name, (byCategory.get(name) ?? 0) + expense.amount);
  }

  const top = Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1])[0];

  return (
    <PageContainer>
      <PageHeader
        title="Expenses"
        description="Track what you spend each month and print a bill when you need one."
        actions={<AddExpenseDialog categories={categories} />}
      />

      <section className="mt-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Expenses" value={expenses.length} icon={Receipt} />
          <StatCard
            title="Total spent"
            value={formatMoney(totalAmount, currency)}
            icon={Wallet}
          />
          <StatCard title="Categories" value={categories.length} icon={Tags} />
          <StatCard
            title="Top category"
            value={top ? top[0] : "—"}
            note={top ? formatMoney(top[1], currency) : undefined}
            icon={TrendingUp}
          />
        </div>

        <ExpensesTable
          expenses={expenses}
          categories={categories}
          currency={currency}
        />
      </section>
    </PageContainer>
  );
}