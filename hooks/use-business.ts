"use client";

import { useEffect, useState } from "react";

import type { BusinessBasicDetails } from "@/lib/types/business";

export function useBusiness() {
  const [business, setBusiness] =
    useState<BusinessBasicDetails | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBusiness() {
      try {
        const response = await fetch(
          "/api/business/basic-details",
        );

        if (!response.ok) {
          return;
        }

        const result = await response.json();

        setBusiness(result.data);
      } catch (error) {
        console.error(
          "Failed to load business details:",
          error,
        );
      } finally {
        setLoading(false);
      }
    }

    loadBusiness();
  }, []);

  return {
    business,
    loading,
  };
}