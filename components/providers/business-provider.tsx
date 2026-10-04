"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { BusinessBasicDetails } from "@/lib/types/business";

interface BusinessContextValue {
  business: BusinessBasicDetails | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
}

const BusinessContext =
  createContext<BusinessContextValue | null>(null);

export function BusinessProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [business, setBusiness] =
    useState<BusinessBasicDetails | null>(null);

  const [loading, setLoading] = useState(true);

  async function loadBusiness() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/business/basic-details",
      );

      if (!response.ok) {
        setBusiness(null);
        return;
      }

      const result = await response.json();

      setBusiness(result.data ?? null);
    } catch (error) {
      console.error(
        "Failed to load business details:",
        error,
      );

      setBusiness(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBusiness();
  }, []);

  return (
    <BusinessContext.Provider
      value={{
        business,
        loading,
        refreshBusiness: loadBusiness,
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusinessContext() {
  const context = useContext(BusinessContext);

  if (!context) {
    throw new Error(
      "useBusinessContext must be used inside BusinessProvider",
    );
  }

  return context;
}