"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useSetupState } from "./setup-state";

export function BusinessDetailsStep() {
  const { setupData, updateSetupData } = useSetupState();

  const handleLogoChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateSetupData(
      "logo",
      event.target.files?.[0] ?? null,
    );
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Business Details
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add the information that identifies your business. These
          details can appear on invoices, bills and other business
          documents.
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Name */}
        <div className="space-y-2">
          <Label htmlFor="business-name">
            Business Name
          </Label>

          <Input
            id="business-name"
            value={setupData.businessName}
            onChange={(event) =>
              updateSetupData(
                "businessName",
                event.target.value,
              )
            }
            placeholder="e.g. Rajaram Dairy & Sweets"
          />
        </div>

        {/* Logo */}
        <div className="space-y-2">
          <Label htmlFor="business-logo">
            Business Logo
            <span className="ml-1 text-muted-foreground">
              (Optional)
            </span>
          </Label>

          <Input
            id="business-logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleLogoChange}
          />

          <p className="text-xs text-muted-foreground">
            PNG, JPG or WebP. You can add or change your logo later
            from Settings.
          </p>

          {setupData.logo && (
            <p className="text-xs text-muted-foreground">
              Selected: {setupData.logo.name}
            </p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <Label htmlFor="business-address">
            Address
          </Label>

          <Textarea
            id="business-address"
            value={setupData.address}
            onChange={(event) =>
              updateSetupData(
                "address",
                event.target.value,
              )
            }
            placeholder="Street address, building, area..."
            rows={3}
          />
        </div>

        {/* Location */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="business-city">
              City
            </Label>

            <Input
              id="business-city"
              value={setupData.city}
              onChange={(event) =>
                updateSetupData(
                  "city",
                  event.target.value,
                )
              }
              placeholder="e.g. Mumbai"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-region">
              State / Region
            </Label>

            <Input
              id="business-region"
              value={setupData.region}
              onChange={(event) =>
                updateSetupData(
                  "region",
                  event.target.value,
                )
              }
              placeholder="e.g. Maharashtra"
            />
          </div>
        </div>

        {/* Postal Code */}
        <div className="space-y-2">
          <Label htmlFor="business-postal-code">
            Postal / ZIP Code
          </Label>

          <Input
            id="business-postal-code"
            value={setupData.postalCode}
            onChange={(event) =>
              updateSetupData(
                "postalCode",
                event.target.value,
              )
            }
            placeholder="e.g. 400001"
          />
        </div>

        {/* Contact */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="business-phone">
              Phone
            </Label>

            <Input
              id="business-phone"
              type="tel"
              value={setupData.phone}
              onChange={(event) =>
                updateSetupData(
                  "phone",
                  event.target.value,
                )
              }
              placeholder="Business phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="business-email">
              Email
            </Label>

            <Input
              id="business-email"
              type="email"
              value={setupData.email}
              onChange={(event) =>
                updateSetupData(
                  "email",
                  event.target.value,
                )
              }
              placeholder="business@example.com"
            />
          </div>
        </div>
      </div>
    </div>
  );
}