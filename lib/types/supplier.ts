export type SupplierRecord = {
    id: number;
    name: string;
    contactPerson: string | null;
    phone: string | null;
    email: string | null;
    taxRegistrationNumber: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    notes: string | null;
    active: boolean;
  };
  
  export type SupplierListItem = SupplierRecord & {
    purchaseCount: number;
    totalAmount: number; // paise
    paidAmount: number; // paise
  };
  
  export type SupplierPurchase = {
    id: number;
    purchaseNumber: string | null;
    purchaseDate: string;
    total: number;
    paidAmount: number;
    paymentStatus: string;
    items: {
      id: number;
      productId: number;
      productName: string;
      unit: string;
      quantity: number;
      total: number;
    }[];
  };