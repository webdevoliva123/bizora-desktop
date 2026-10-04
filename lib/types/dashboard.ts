export interface DashboardSummary {
    todaySales: number;
    todayPayments: number;
    outstanding: number;
    lowStock: number;
  }

  export interface DashboardRecentTransaction {
    id: string;

    type: "CREDIT" | "DEBIT";

    category:
        | "SALE"
        | "PAYMENT"
        | "EXPENSE"
        | "STOCK_PURCHASE";

    title: string;

    description: string;

    amount: number;

    transactionDate: string;
}

  export interface DashboardSalesOverview {
    date: string;
    total: number;
  }