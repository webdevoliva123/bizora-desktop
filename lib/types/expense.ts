export type ExpenseCategoryOption = {
    id: number;
    name: string;
  };
  
  export type ExpenseListItem = {
    id: number;
    expenseDate: string;
    description: string;
    amount: number; // paise
    paymentMethod: string;
    reference: string | null;
    notes: string | null;
    categoryId: number | null;
    categoryName: string | null;
  };
  
  export type ExpenseStatementData = {
    month: string;
    business: {
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
    expenses: ExpenseListItem[];
    categories: {
      categoryId: number | null;
      name: string;
      count: number;
      total: number;
    }[];
    taxRegistrations: {
      taxSystem: string;
      registrationNumber: string | null;
    }[];
    businessRegistrations: {
      registrationType: string;
      registrationNumber: string | null;
    }[];
    totals: {
      expenseCount: number;
      totalAmount: number;
    };
  };