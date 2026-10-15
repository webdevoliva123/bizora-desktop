export type ReportPeriodType = "month" | "year";

export type ReportTotals = {
  sales: number;
  salesCount: number;
  purchases: number;
  purchaseCount: number;
  expenses: number;
  expenseCount: number;
  salaries: number;
  collected: number; // cash received from customers
  supplierPaid: number; // cash paid to suppliers
  cashIn: number;
  cashOut: number;
  netCash: number;
  profit: number;
  margin: number | null; // fraction, null when there are no sales
};

export type ReportPoint = {
  key: string; // yyyy-MM-dd (month report) or yyyy-MM (year report)
  label: string;
  sales: number;
  purchases: number;
  expenses: number;
  salaries: number;
  profit: number;
  cashIn: number;
  cashOut: number;
  receivable: number; // balance at the end of this bucket
  payable: number;
  previousSales: number; // same position in the previous period
};

export type ReportHealthStatus =
  | "excellent"
  | "good"
  | "fair"
  | "weak"
  | "critical"
  | "no_data";

export type ReportHealthComponent = {
  key: string;
  label: string;
  weight: number;
  score: number; // 0-100
  detail: string;
};

export type ReportHealth = {
  score: number | null;
  status: ReportHealthStatus;
  label: string;
  summary: string;
  trend: "improving" | "steady" | "declining" | "new";
  components: ReportHealthComponent[];
};

export type ReportInsight = {
  tone: "positive" | "negative" | "neutral";
  text: string;
};

export type RankedRow = {
  id: number | null;
  name: string;
  count: number;
  amount: number;
};

export type ProductRow = {
  id: number;
  name: string;
  unit: string;
  quantity: number;
  amount: number;
};

export type DueRow = {
  id: number | null;
  name: string;
  amount: number;
};

export type SalaryDueRow = {
  id: number;
  name: string;
  role: string | null;
  expected: number;
  paid: number;
  due: number;
};

export type ReportBusiness = {
  name: string;
  logoPath: string | null;
  businessCategory: string | null;
  country: string;
  currency: string;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
};

export type ReportData = {
  period: {
    type: ReportPeriodType;
    key: string;
    label: string;
    previousKey: string;
    previousLabel: string;
    isCurrent: boolean;
  };
  business: ReportBusiness;
  totals: ReportTotals;
  previous: ReportTotals;
  series: ReportPoint[];
  outstanding: {
    receivable: number;
    payable: number;
    salaryDue: number;
  };
  health: ReportHealth;
  insights: ReportInsight[];
  breakdown: {
    products: ProductRow[];
    customers: RankedRow[];
    expenseCategories: RankedRow[];
    suppliers: RankedRow[];
  };
  dues: {
    customers: DueRow[];
    suppliers: DueRow[];
    salaries: SalaryDueRow[];
  };
  taxRegistrations: { taxSystem: string; registrationNumber: string | null }[];
  businessRegistrations: {
    registrationType: string;
    registrationNumber: string | null;
  }[];
  generatedAt: string;
};