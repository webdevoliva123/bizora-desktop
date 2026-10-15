export type BusinessSettings = {
    id: number;
    name: string;
    logoPath: string | null;
    businessType: string;
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
  
  export type TaxRegistrationRow = {
    id: number;
    taxSystem: string;
    registrationNumber: string | null;
  };
  
  export type RegulatoryRow = {
    id: number;
    authorityName: string;
    registrationType: string;
    registrationNumber: string | null;
    issueDate: string | null;
    expiryDate: string | null;
  };
  
  export type PaymentDetailsSettings = {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
    branchName: string | null;
    routingCode: string | null;
    paymentIdentifier: string | null;
    qrImagePath: string | null;
    showBankDetails: boolean;
    showQr: boolean;
    paymentInstructions: string | null;
  };
  
  export type ActionResult =
    | { success: true }
    | { success: false; error: string };
  
  export type PathResult =
    | { success: true; path: string | null }
    | { success: false; error: string };