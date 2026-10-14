export const WORKER_PAYMENT_TYPES = [
    "MONTHLY",
    "WEEKLY",
    "DAILY",
    "HOURLY",
    "OTHER",
  ] as const;
  
  export type WorkerPaymentType = (typeof WORKER_PAYMENT_TYPES)[number];
  
  export const WORKER_PAYMENT_TYPE_OPTIONS: {
    value: WorkerPaymentType;
    label: string;
  }[] = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "DAILY", label: "Daily" },
    { value: "HOURLY", label: "Hourly" },
    { value: "OTHER", label: "Other" },
  ];
  
  export type WorkerStatusFilter = "ALL" | "ACTIVE" | "INACTIVE";
  
  export interface WorkerListItem {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    role: string | null;
    joiningDate: string | null;
    paymentType: string | null;
    defaultPaymentAmount: number | null; // paise
    active: boolean;
    createdAt: string;
  }
  
  export interface WorkerDetails {
    id: number;
    businessId: number;
    name: string;
    phone: string | null;
    email: string | null;
    role: string | null;
    joiningDate: string | null;
    paymentType: string | null;
    defaultPaymentAmount: number | null; // paise
    address: string | null;
    notes: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    summary: {
      totalPaid: number; // paise
      paymentCount: number;
      lastPaymentDate: string | null;
    };
  }
  
  export interface WorkerSalaryPayment {
    id: number;
    amount: number; // paise
    paymentMethod: string;
    paymentDate: string;
    paymentPeriod: string; // yyyy-MM (salary month)
    reference: string | null;
    notes: string | null;
  }
  
  export interface WorkerSalaryMonth {
    month: string; // yyyy-MM
    total: number; // paise
    payments: WorkerSalaryPayment[];
  }
  
  export interface WorkerSalaryYear {
    year: number;
    availableYears: number[];
    months: WorkerSalaryMonth[]; // always 12, Jan to Dec
    totalPaid: number;
    paymentCount: number;
  }
  
  export interface WorkerSalaryStatement {
    year: number;
    business: {
      name: string;
      logoPath: string | null;
      businessCategory: string | null;
      currency: string;
      address: string | null;
      city: string | null;
      state: string | null;
      postalCode: string | null;
      phone: string | null;
      email: string | null;
    };
    worker: {
      id: number;
      name: string;
      role: string | null;
      phone: string | null;
      paymentType: string | null;
      defaultPaymentAmount: number | null;
    };
    salary: WorkerSalaryYear;
  }