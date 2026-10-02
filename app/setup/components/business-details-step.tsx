"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { uploadSetupTempFile } from "../actions";
import { useSetupState } from "./setup-state";

export function BusinessDetailsStep() {
  const {
    setupData,
    updateSetupData,
  } = useSetupState();

  const [logoPreviewUrl, setLogoPreviewUrl] =
    useState<string | null>(null);

  const [isUploadingLogo, setIsUploadingLogo] =
    useState(false);

  /*
   * Create a temporary browser preview when
   * the user selects a new File.
   */
  useEffect(() => {
    if (!setupData.logo) {
      setLogoPreviewUrl(null);
      return;
    }

    const objectUrl =
      URL.createObjectURL(setupData.logo);

    setLogoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [setupData.logo]);

  /*
   * If there is no File object after a refresh,
   * use the persisted temporary file path.
   */
  const savedLogoUrl = useMemo(() => {
    if (
      setupData.logo ||
      !setupData.logoPath
    ) {
      return null;
    }

    return `/api/setup/temp-file?path=${encodeURIComponent(
      setupData.logoPath,
    )}`;
  }, [
    setupData.logo,
    setupData.logoPath,
  ]);

  const previewUrl =
    logoPreviewUrl ?? savedLogoUrl;

  const handleLogoChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      updateSetupData("logo", null);
      updateSetupData("logoPath", null);
      return;
    }

    try {
      setIsUploadingLogo(true);

      const path =
        await uploadSetupTempFile(
          file,
          "logo",
        );

      /*
       * Keep the File object for the current
       * session so we can immediately preview it.
       */
      updateSetupData("logo", file);

      /*
       * Keep the server-side temporary path
       * so the file survives a refresh.
       */
      updateSetupData("logoPath", path);
    } catch (error) {
      console.error(
        "Failed to save business logo:",
        error,
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Business Details
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add the information that identifies your
          business. These details can appear on
          invoices, bills and other business
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
            disabled={isUploadingLogo}
          />

          <p className="text-xs text-muted-foreground">
            PNG, JPG or WebP. You can add or change
            your logo later from Settings.
          </p>

          {/* Logo Preview */}
          {previewUrl && (
            <div className="mt-4 flex items-center gap-4 rounded-lg border p-4">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-md border bg-muted">
                <img
                  src={previewUrl}
                  alt="Business logo preview"
                  className="size-full object-contain"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  {setupData.logo
                    ? setupData.logo.name
                    : "Saved business logo"}
                </p>

                <p className="text-xs text-muted-foreground">
                  {setupData.logo
                    ? "Logo selected"
                    : "Logo restored from saved setup"}
                </p>
              </div>
            </div>
          )}

          {isUploadingLogo && (
            <p className="text-xs text-muted-foreground">
              Saving logo...
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