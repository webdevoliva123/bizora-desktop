export interface BusinessBasicDetails {
    id: string;
    name: string;
    logoPath: string | null;
    businessType: string | null;
    businessCategory: string | null;
    country: string;
    currency: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
  }