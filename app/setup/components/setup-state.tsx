"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadSetupDraft, saveSetupDraft } from "./setup-storage";



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
  qrCodePath: string | null;
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
  logoPath: string | null;

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

export const initialSetupData: SetupData = {
  country: "IN",
  currency: "INR",

  businessType: "",
  businessCategory: "",

  businessName: "",
  logo: null,
  logoPath: null,

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
    qrCodePath: null,
    paymentInstructions: "",
  },

  customers: [],
  products: [],
};

interface SetupStateContextValue {
  setupData: SetupData;
  currentStep: number;
  isHydrated: boolean;

  updateSetupData: <K extends keyof SetupData>(
    key: K,
    value: SetupData[K],
  ) => void;

  setCurrentStep: (step: number) => void;

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

  const [currentStep, setCurrentStepState] =
    useState(0);

  const [isHydrated, setIsHydrated] =
    useState(false);

  /*
   * Restore the saved setup draft
   * after the browser/Electron renderer loads.
   */
  useEffect(() => {
    const draft = loadSetupDraft();

    if (draft) {
      setSetupData(draft.setupData);
      setCurrentStepState(draft.currentStep);
    }

    setIsHydrated(true);
  }, []);

  /*
   * Automatically save setup progress
   * whenever data or the current step changes.
   */
  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    saveSetupDraft(setupData, currentStep);
  }, [
    setupData,
    currentStep,
    isHydrated,
  ]);

  const updateSetupData = <K extends keyof SetupData>(
    key: K,
    value: SetupData[K],
  ) => {
    setSetupData((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const setCurrentStep = (step: number) => {
    setCurrentStepState(step);
  };

  const resetSetup = () => {
    setSetupData(initialSetupData);
    setCurrentStepState(0);
  };

  const value = useMemo(
    () => ({
      setupData,
      currentStep,
      isHydrated,
      updateSetupData,
      setCurrentStep,
      resetSetup,
    }),
    [
      setupData,
      currentStep,
      isHydrated,
    ],
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