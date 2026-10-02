"use client";

import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { uploadSetupTempFile } from "../actions";
import { useSetupState } from "./setup-state";

export function PaymentDetailsStep() {
  const {
    setupData,
    updateSetupData,
  } = useSetupState();

  const [qrPreviewUrl, setQrPreviewUrl] =
    useState<string | null>(null);

  const [isUploadingQr, setIsUploadingQr] =
    useState(false);

  /*
   * Create a browser preview for a newly
   * selected QR File.
   */
  useEffect(() => {
    if (!setupData.paymentDetails.qrCode) {
      setQrPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(
      setupData.paymentDetails.qrCode,
    );

    setQrPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [
    setupData.paymentDetails.qrCode,
  ]);

  /*
   * After refresh/restart the File object is gone,
   * so use the persisted temporary file path.
   */
  const savedQrUrl = useMemo(() => {
    const qrCode =
      setupData.paymentDetails.qrCode;

    const qrCodePath =
      setupData.paymentDetails.qrCodePath;

    if (qrCode || !qrCodePath) {
      return null;
    }

    return `/api/setup/temp-file?path=${encodeURIComponent(
      qrCodePath,
    )}`;
  }, [
    setupData.paymentDetails.qrCode,
    setupData.paymentDetails.qrCodePath,
  ]);

  const previewUrl =
    qrPreviewUrl ?? savedQrUrl;

  const handleQrChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      updateSetupData(
        "paymentDetails",
        {
          ...setupData.paymentDetails,
          qrCode: null,
          qrCodePath: null,
        },
      );

      return;
    }

    try {
      setIsUploadingQr(true);

      const path =
        await uploadSetupTempFile(
          file,
          "payment",
        );

      updateSetupData(
        "paymentDetails",
        {
          ...setupData.paymentDetails,
          qrCode: file,
          qrCodePath: path,
        },
      );
    } catch (error) {
      console.error(
        "Failed to save payment QR code:",
        error,
      );
    } finally {
      setIsUploadingQr(false);
    }
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Payment Details
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add your business payment details. These
          details can appear directly on customer
          invoices and bills.
        </p>
      </div>

      <div className="space-y-6">
        {/* Bank Name */}
        <div className="space-y-2">
          <Label htmlFor="payment-bank-name">
            Bank Name
          </Label>

          <Input
            id="payment-bank-name"
            value={
              setupData.paymentDetails.bankName
            }
            onChange={(event) =>
              updateSetupData(
                "paymentDetails",
                {
                  ...setupData.paymentDetails,
                  bankName:
                    event.target.value,
                },
              )
            }
            placeholder="e.g. ICICI Bank"
          />
        </div>

        {/* Account Name */}
        <div className="space-y-2">
          <Label htmlFor="payment-account-name">
            Account Name
          </Label>

          <Input
            id="payment-account-name"
            value={
              setupData.paymentDetails.accountName
            }
            onChange={(event) =>
              updateSetupData(
                "paymentDetails",
                {
                  ...setupData.paymentDetails,
                  accountName:
                    event.target.value,
                },
              )
            }
            placeholder="Business account name"
          />
        </div>

        {/* Account Number */}
        <div className="space-y-2">
          <Label htmlFor="payment-account-number">
            Account Number
          </Label>

          <Input
            id="payment-account-number"
            value={
              setupData.paymentDetails.accountNumber
            }
            onChange={(event) =>
              updateSetupData(
                "paymentDetails",
                {
                  ...setupData.paymentDetails,
                  accountNumber:
                    event.target.value,
                },
              )
            }
            placeholder="Bank account number"
          />
        </div>

        {/* Branch + Routing */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment-branch-name">
              Branch Name
            </Label>

            <Input
              id="payment-branch-name"
              value={
                setupData.paymentDetails.branchName
              }
              onChange={(event) =>
                updateSetupData(
                  "paymentDetails",
                  {
                    ...setupData.paymentDetails,
                    branchName:
                      event.target.value,
                  },
                )
              }
              placeholder="Branch name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-routing-code">
              Routing / Bank Code
            </Label>

            <Input
              id="payment-routing-code"
              value={
                setupData.paymentDetails.routingCode
              }
              onChange={(event) =>
                updateSetupData(
                  "paymentDetails",
                  {
                    ...setupData.paymentDetails,
                    routingCode:
                      event.target.value,
                  },
                )
              }
              placeholder="e.g. IFSC / routing code"
            />
          </div>
        </div>

        {/* Payment Identifier */}
        <div className="space-y-2">
          <Label htmlFor="payment-identifier">
            Payment Identifier
          </Label>

          <Input
            id="payment-identifier"
            value={
              setupData.paymentDetails
                .paymentIdentifier
            }
            onChange={(event) =>
              updateSetupData(
                "paymentDetails",
                {
                  ...setupData.paymentDetails,
                  paymentIdentifier:
                    event.target.value,
                },
              )
            }
            placeholder="e.g. UPI ID / payment identifier"
          />

          <p className="text-xs text-muted-foreground">
            This can be shown on invoices alongside
            your payment details.
          </p>
        </div>

        {/* QR Code */}
        <div className="space-y-2">
          <Label htmlFor="payment-qr-code">
            Payment QR Code
            <span className="ml-1 text-muted-foreground">
              (Optional)
            </span>
          </Label>

          <Input
            id="payment-qr-code"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleQrChange}
            disabled={isUploadingQr}
          />

          <p className="text-xs text-muted-foreground">
            Upload the QR code customers can scan
            to make a payment.
          </p>

          {/* QR Preview */}
          {previewUrl && (
            <div className="mt-4 flex items-center gap-4 rounded-lg border p-4">
              <div className="flex size-28 items-center justify-center overflow-hidden rounded-md border bg-muted p-2">
                <img
                  src={previewUrl}
                  alt="Payment QR code preview"
                  className="size-full object-contain"
                />
              </div>

              <div>
                <p className="text-sm font-medium">
                  {setupData.paymentDetails
                    .qrCode
                    ? setupData.paymentDetails
                        .qrCode.name
                    : "Saved payment QR code"}
                </p>

                <p className="text-xs text-muted-foreground">
                  {setupData.paymentDetails
                    .qrCode
                    ? "QR code selected"
                    : "QR code restored from saved setup"}
                </p>
              </div>
            </div>
          )}

          {isUploadingQr && (
            <p className="text-xs text-muted-foreground">
              Saving QR code...
            </p>
          )}
        </div>

        {/* Payment Instructions */}
        <div className="space-y-2">
          <Label htmlFor="payment-instructions">
            Payment Instructions
          </Label>

          <Textarea
            id="payment-instructions"
            value={
              setupData.paymentDetails
                .paymentInstructions
            }
            onChange={(event) =>
              updateSetupData(
                "paymentDetails",
                {
                  ...setupData.paymentDetails,
                  paymentInstructions:
                    event.target.value,
                },
              )
            }
            placeholder="e.g. Scan the QR code or use the bank details above to make payment."
            rows={4}
          />

          <p className="text-xs text-muted-foreground">
            These instructions can appear on your
            invoices and bills.
          </p>
        </div>
      </div>
    </div>
  );
}