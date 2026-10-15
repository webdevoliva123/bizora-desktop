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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { PaymentDetailsSettings } from "@/lib/types/settings";

import { removeQrAction, updatePaymentAction, uploadQrAction } from "../actions";
import { ImageUploadField } from "./image-upload-field";
import { SettingsFormFooter } from "./settings-form-footer";

export function PaymentSettingsForm({
  details,
}: {
  details: PaymentDetailsSettings | null;
}) {
  const router = useRouter();

  const [form, setForm] = useState({
    bankName: details?.bankName ?? "",
    accountName: details?.accountName ?? "",
    accountNumber: details?.accountNumber ?? "",
    branchName: details?.branchName ?? "",
    routingCode: details?.routingCode ?? "",
    paymentIdentifier: details?.paymentIdentifier ?? "",
    paymentInstructions: details?.paymentInstructions ?? "",
    showBankDetails: details?.showBankDetails ?? true,
    showQr: details?.showQr ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    (key: keyof Omit<typeof form, "showBankDetails" | "showQr">) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setForm((current) => ({ ...current, [key]: event.target.value }));
    };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);

    const result = await updatePaymentAction(form);

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
          <CardTitle>Payment details</CardTitle>
          <CardDescription>
            Shown on monthly account bills so customers know how to pay you. Bills you
            already printed are not changed.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank name</Label>
            <Input
              id="bankName"
              value={form.bankName}
              onChange={field("bankName")}
              placeholder="e.g. ICICI Bank"
            />
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="accountName">Account name</Label>
              <Input
                id="accountName"
                value={form.accountName}
                onChange={field("accountName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account number</Label>
              <Input
                id="accountNumber"
                inputMode="numeric"
                value={form.accountNumber}
                onChange={field("accountNumber")}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="branchName">Branch name</Label>
              <Input id="branchName" value={form.branchName} onChange={field("branchName")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="routingCode">Routing / bank code</Label>
              <Input
                id="routingCode"
                value={form.routingCode}
                onChange={field("routingCode")}
                placeholder="e.g. IFSC"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentIdentifier">Payment ID</Label>
            <Input
              id="paymentIdentifier"
              value={form.paymentIdentifier}
              onChange={field("paymentIdentifier")}
              placeholder="e.g. UPI ID"
            />
          </div>

          <div className="space-y-2">
            <Label>Payment QR code</Label>
            <ImageUploadField
              path={details?.qrImagePath ?? null}
              alt="Payment QR code"
              uploadLabel="Upload QR code"
              onUpload={uploadQrAction}
              onRemove={removeQrAction}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentInstructions">Payment instructions</Label>
            <Textarea
              id="paymentInstructions"
              rows={4}
              value={form.paymentInstructions}
              onChange={field("paymentInstructions")}
              placeholder="e.g. Scan the QR code or use the bank details to make payment."
            />
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <p className="text-sm font-medium">Show on bills</p>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="showBankDetails" className="font-normal">
                Bank details and payment ID
              </Label>
              <Switch
                id="showBankDetails"
                checked={form.showBankDetails}
                onCheckedChange={(checked) => {
                  setSaved(false);
                  setForm((current) => ({ ...current, showBankDetails: checked }));
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="showQr" className="font-normal">
                Payment QR code
              </Label>
              <Switch
                id="showQr"
                checked={form.showQr}
                onCheckedChange={(checked) => {
                  setSaved(false);
                  setForm((current) => ({ ...current, showQr: checked }));
                }}
              />
            </div>
          </div>

          <SettingsFormFooter saving={saving} saved={saved} error={error} />
        </CardContent>
      </Card>
    </form>
  );
}