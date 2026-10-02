"use client";

import { Building2, Globe2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useSetupState } from "./setup-state";

const COUNTRIES = [
  {
    code: "IN",
    name: "India",
    currency: "INR",
    currencySymbol: "₹",
  },
  {
    code: "NZ",
    name: "New Zealand",
    currency: "NZD",
    currencySymbol: "$",
  },
] as const;

const BUSINESS_TYPES = [
  "Dairy",
  "Retail",
  "Food & Beverage",
  "Wholesale",
  "Services",
  "Other",
] as const;

export function CountryBusinessStep() {
  const { setupData, updateSetupData } = useSetupState();

  const selectedCountry = COUNTRIES.find(
    (country) => country.code === setupData.country,
  );

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find(
      (item) => item.code === countryCode,
    );

    if (!country) {
      return;
    }

    updateSetupData("country", country.code);
    updateSetupData("currency", country.currency);
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Globe2 className="size-5" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Country & Business
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Tell us where your business operates and what kind of
          business you run.
        </p>
      </div>

      <div className="space-y-6">
        {/* Country */}
        <div className="space-y-2">
          <Label htmlFor="country">
            Country
          </Label>

          <select
            id="country"
            value={setupData.country}
            onChange={(event) =>
              handleCountryChange(event.target.value)
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {COUNTRIES.map((country) => (
              <option
                key={country.code}
                value={country.code}
              >
                {country.name}
              </option>
            ))}
          </select>

          <p className="text-xs text-muted-foreground">
            This helps Bizora apply the appropriate regional
            settings later.
          </p>
        </div>

        {/* Currency */}
        <div className="space-y-2">
          <Label htmlFor="currency">
            Currency
          </Label>

          <Input
            id="currency"
            value={
              selectedCountry
                ? `${selectedCountry.currency} (${selectedCountry.currencySymbol})`
                : setupData.currency
            }
            readOnly
          />

          <p className="text-xs text-muted-foreground">
            Currency is automatically selected based on the
            country.
          </p>
        </div>

        {/* Business Type */}
        <div className="space-y-2">
          <Label htmlFor="business-type">
            Business Type
          </Label>

          <select
            id="business-type"
            value={setupData.businessType}
            onChange={(event) =>
              updateSetupData(
                "businessType",
                event.target.value,
              )
            }
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">
              Select business type
            </option>

            {BUSINESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Business Category */}
        <div className="space-y-2">
          <Label htmlFor="business-category">
            Business Category
          </Label>

          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              id="business-category"
              value={setupData.businessCategory}
              onChange={(event) =>
                updateSetupData(
                  "businessCategory",
                  event.target.value,
                )
              }
              placeholder="e.g. Dairy Products"
              className="pl-9"
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Describe your specific business category.
          </p>
        </div>
      </div>
    </div>
  );
}