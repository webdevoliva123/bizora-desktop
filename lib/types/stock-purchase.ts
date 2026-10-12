export type SupplierOption = {
    id: number;
    name: string;
    phone: string | null;
  };
  
  export type ProductOption = {
    id: number;
    name: string;
    unit: string;
    purchasePrice: number | null;
    taxRate: number | null;
    currentStock: number;
  };

  export type StockPurchaseListItem = {
    id: number;
    purchaseNumber: string | null;
    purchaseDate: string;
    supplierName: string | null;
    total: number;
    paymentStatus: string;
    paidAmount: number;
    paymentCount: number;
    itemCount: number;
  };
  
  export type StockPurchaseDetail = {
    id: number;
    supplierId: number | null;
    supplierName: string | null;
    purchaseDate: string;
    purchaseNumber: string | null;
    subtotal: number;
    tax: number;
    total: number;
    paymentStatus: string;
    notes: string | null;
    paidAmount: number;
    items: {
      id: number;
      productId: number;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      taxRate: number | null;
      total: number;
    }[];
    payments: {
      id: number;
      amount: number;
      paymentMethod: string;
      paymentDate: string;
      reference: string | null;
      notes: string | null;
    }[];
  };