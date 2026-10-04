export interface DailyEntryListItem {
    id: number;
    entryDate: string;
    createdAt: string;

    customerName: string;
    customerType: "PERSON" | "BUSINESS";
    itemCount: number;
    total: number;

    paidAmount: number;
    paymentCount: number;

    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
}

  export interface DailyEntryDetailItem {
    id: number;
    productId: number;
    productName: string;
    unit: string;
    quantity: number;
    unitPrice: number;
    taxRate: number;
    total: number;
  }
  
  export interface DailyEntryDetailPayment {
    id: number;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    reference: string | null;
    notes: string | null;
  }
  
  export interface DailyEntryDetail {
    id: number;
    entryDate: string;
  
    customerId: number;
    customerName: string;
    customerType: "PERSON" | "BUSINESS";
  
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
  
    paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
  
    paidAmount: number;
    outstandingAmount: number;
  
    notes: string | null;
  
    items: DailyEntryDetailItem[];
    payments: DailyEntryDetailPayment[];
  }