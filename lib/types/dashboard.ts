export interface DashboardSummary {
    todaySales: number;
    todayPayments: number;
    outstanding: number;
    lowStock: number;
  }

  export interface DashboardRecentTransaction {
    id: number;
    invoiceNumber: string;
    customerName: string;
    total: number;
    status: string;
    invoiceDate: string;
  }

  export interface DashboardSalesOverview {
    date: string;
    total: number;
  }