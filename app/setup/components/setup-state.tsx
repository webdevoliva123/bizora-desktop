"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from "react";

export interface SetupTaxRegistration {
  id: string;
  taxSystem: string;
  registrationType: string;
  registrationNumber: string;
}

export interface SetupBusinessRegistration {
  id: string;
  authorityName: string;
  registrationType: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
}

export interface SetupPaymentDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branchName: string;
  routingCode: string;
  paymentIdentifier: string;
  qrCode: File | null;
  paymentInstructions: string;
}

export interface SetupCustomer {
  id: string;
  type: "person" | "business";

  firstName: string;
  lastName: string;

  businessName: string;
  contactPerson: string;

  phone: string;
  email: string;

  taxRegistration: string;
  address: string;
}

export interface SetupProduct {
  id: string;
  name: string;
  category: string;
  unit: string;
  sellingPrice: string;
  purchasePrice: string;
  openingStock: string;
  lowStockThreshold: string;
  taxRate: string;
}

export interface SetupData {
  country: string;
  currency: string;
  businessType: string;
  businessCategory: string;

  businessName: string;
  logo: File | null;
  address: string;
  city: string;
  region: string;
  postalCode: string;
  phone: string;
  email: string;

  taxSystem: string;
  taxRegistrations: SetupTaxRegistration[];

  businessRegistrations: SetupBusinessRegistration[];
  regulatoryNotes: string;

  paymentDetails: SetupPaymentDetails;

  customers: SetupCustomer[];

  products: SetupProduct[];
}

const initialSetupData: SetupData = {
  country: "IN",
  currency: "INR",
  businessType: "",
  businessCategory: "",

  businessName: "",
  logo: null,
  address: "",
  city: "",
  region: "",
  postalCode: "",
  phone: "",
  email: "",

  taxSystem: "",
  taxRegistrations: [],

  businessRegistrations: [],
  regulatoryNotes: "",

  paymentDetails: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    branchName: "",
    routingCode: "",
    paymentIdentifier: "",
    qrCode: null,
    paymentInstructions: "",
  },

  customers: [],

  products: [],
};

interface SetupStateContextValue {
  setupData: SetupData;

  updateSetupData: <K extends keyof SetupData>(
    key: K,
    value: SetupData[K],
  ) => void;

  resetSetup: () => void;
}

const SetupStateContext =
  createContext<SetupStateContextValue | null>(null);

export function SetupStateProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [setupData, setSetupData] =
    useState<SetupData>(initialSetupData);

  const updateSetupData = <K extends keyof SetupData>(
    key: K,
    value: SetupData[K],
  ) => {
    setSetupData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const resetSetup = () => {
    setSetupData(initialSetupData);
  };

  const value = useMemo(
    () => ({
      setupData,
      updateSetupData,
      resetSetup,
    }),
    [setupData],
  );

  return (
    <SetupStateContext.Provider value={value}>
      {children}
    </SetupStateContext.Provider>
  );
}

export function useSetupState() {
  const context = useContext(SetupStateContext);

  if (!context) {
    throw new Error(
      "useSetupState must be used inside SetupStateProvider",
    );
  }

  return context;
}