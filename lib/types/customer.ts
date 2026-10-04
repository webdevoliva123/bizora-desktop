export type CustomerType = "PERSON" | "BUSINESS";

export type CustomerTypeFilter =
  | "ALL"
  | "PERSON"
  | "BUSINESS";

export interface CustomerListItem {
  id: number;
  type: CustomerType;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  active: boolean;
  entryCount: number;
  createdAt: string;
}

export interface CustomerPersonDetails {
  firstName: string;
  lastName: string | null;
}

export interface CustomerBusinessDetails {
  businessName: string;
  contactPerson: string | null;
  taxRegistrationNumber: string | null;
}

export interface CustomerDetails {
  id: number;
  businessId: number;
  type: CustomerType;

  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;

  active: boolean;

  person: CustomerPersonDetails | null;
  business: CustomerBusinessDetails | null;

  createdAt: string;
  updatedAt: string;
}

