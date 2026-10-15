"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { BusinessSettings } from "@/lib/types/settings";

import {
  removeLogoAction,
  updateBusinessAction,
  uploadLogoAction,
} from "../actions";
import { ImageUploadField } from "./image-upload-field";
import { SettingsFormFooter } from "./settings-form-footer";
import { BUSINESS_TYPES, COUNTRIES } from "@/lib/constant/business";

export function BusinessSettingsForm({ settings }: { settings: BusinessSettings }) {
  const router = useRouter();

  const [form, setForm] = useState({
    name: settings.name,
    businessType: settings.businessType,
    businessCategory: settings.businessCategory ?? "",
    country: settings.country,
    address: settings.address ?? "",
    city: settings.city ?? "",
    state: settings.state ?? "",
    postalCode: settings.postalCode ?? "",
    phone: settings.phone ?? "",
    email: settings.email ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    (key: keyof typeof form) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  const country = COUNTRIES.find((item) => item.code === form.country);
  const countryChanged = form.country !== settings.country;

  const types: readonly string[] = (BUSINESS_TYPES as readonly string[]).includes(
    form.businessType,
  )
    ? BUSINESS_TYPES
    : [form.businessType, ...BUSINESS_TYPES];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const result = await updateBusinessAction(form);

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Business</CardTitle>
          <CardDescription>
            These details appear on your bills, statements and reports.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Business logo</Label>
            <ImageUploadField
              path={settings.logoPath}
              alt="Business logo"
              uploadLabel="Upload logo"
              onUpload={uploadLogoAction}
              onRemove={removeLogoAction}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Business name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={field("name")}
              placeholder="e.g. Rajaram Dairy & Sweets"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Business type</Label>
              <Select
                value={form.businessType}
                onValueChange={(value) => {
                  setSaved(false);
                  setForm((current) => ({ ...current, businessType: value ?? "" }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select business type">
                    {form.businessType}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessCategory">
                Business category{" "}
                <span className="font-normal text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="businessCategory"
                value={form.businessCategory}
                onChange={field("businessCategory")}
                placeholder="e.g. Dairy Products"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={form.country}
                onValueChange={(value) => {
                  setSaved(false);
                  setForm((current) => ({ ...current, country: value ?? current.country }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country">
                    {country?.name ?? form.country}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((item) => (
                    <SelectItem key={item.code} value={item.code}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                readOnly
                value={country ? `${country.currency} (${country.currencySymbol})` : settings.currency}
              />
            </div>
          </div>

          {countryChanged && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Changing the country changes the currency shown on every amount. Existing
              amounts are not converted.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={field("address")}
              placeholder="Street address, building, area..."
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city} onChange={field("city")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State / region</Label>
              <Input id="state" value={form.state} onChange={field("state")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postal code</Label>
              <Input id="postalCode" value={form.postalCode} onChange={field("postalCode")} />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={field("phone")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={field("email")} />
            </div>
          </div>

          <SettingsFormFooter saving={saving} saved={saved} error={error} />
        </CardContent>
      </Card>
    </form>
  );
}