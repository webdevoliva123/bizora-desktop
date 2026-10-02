"use client";

import { CreditCard, QrCode } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useSetupState } from "./setup-state";

export function PaymentDetailsStep() {
  const { setupData, updateSetupData } = useSetupState();

  const paymentDetails = setupData.paymentDetails;

  const updatePaymentDetails = (
    field: keyof typeof paymentDetails,
    value: string | File | null,
  ) => {
    updateSetupData("paymentDetails", {
      ...paymentDetails,
      [field]: value,
    });
  };

  const handleQrCodeChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updatePaymentDetails(
      "qrCode",
      event.target.files?.[0] ?? null,
    );
  };

  return (
    <div className="py-4">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CreditCard className="size-5" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Payment Details
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Add the payment information you want to display on your
          bills and invoices.
        </p>
      </div>

      <div className="space-y-8">
        {/* Bank Details */}
        <section className="space-y-5">
          <div>
            <h2 className="text-sm font-medium">
              Bank Details
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              These details can be displayed on customer invoices
              for bank transfers.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="bank-name">
                Bank Name
              </Label>

              <Input
                id="bank-name"
                value={paymentDetails.bankName}
                onChange={(event) =>
                  updatePaymentDetails(
                    "bankName",
                    event.target.value,
                  )
                }
                placeholder="e.g. State Bank"
              />
            </div>

            {/* Account Name */}
            <div className="space-y-2">
              <Label htmlFor="account-name">
                Account Name
              </Label>

              <Input
                id="account-name"
                value={paymentDetails.accountName}
                onChange={(event) =>
                  updatePaymentDetails(
                    "accountName",
                    event.target.value,
                  )
                }
                placeholder="Name on bank account"
              />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="account-number">
                Account Number
              </Label>

              <Input
                id="account-number"
                value={paymentDetails.accountNumber}
                onChange={(event) =>
                  updatePaymentDetails(
                    "accountNumber",
                    event.target.value,
                  )
                }
                placeholder="Bank account number"
              />
            </div>

            {/* Branch */}
            <div className="space-y-2">
              <Label htmlFor="branch-name">
                Branch
                <span className="ml-1 text-muted-foreground">
                  (Optional)
                </span>
              </Label>

              <Input
                id="branch-name"
                value={paymentDetails.branchName}
                onChange={(event) =>
                  updatePaymentDetails(
                    "branchName",
                    event.target.value,
                  )
                }
                placeholder="Branch name"
              />
            </div>

            {/* Routing Code */}
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="routing-code">
                Routing / Bank Code
                <span className="ml-1 text-muted-foreground">
                  (Optional)
                </span>
              </Label>

              <Input
                id="routing-code"
                value={paymentDetails.routingCode}
                onChange={(event) =>
                  updatePaymentDetails(
                    "routingCode",
                    event.target.value,
                  )
                }
                placeholder="e.g. IFSC, SWIFT, routing number"
              />

              <p className="text-xs text-muted-foreground">
                Use the bank identification code applicable to your
                country.
              </p>
            </div>
          </div>
        </section>

        {/* QR / Payment Identifier */}
        <section className="space-y-5 border-t pt-8">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="size-4 text-muted-foreground" />

              <h2 className="text-sm font-medium">
                QR / Payment Identifier
              </h2>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Optionally add a QR code or payment identifier that
              customers can use to make payments.
            </p>
          </div>

          {/* Payment Identifier */}
          <div className="space-y-2">
            <Label htmlFor="payment-identifier">
              Payment Identifier
              <span className="ml-1 text-muted-foreground">
                (Optional)
              </span>
            </Label>

            <Input
              id="payment-identifier"
              value={paymentDetails.paymentIdentifier}
              onChange={(event) =>
                updatePaymentDetails(
                  "paymentIdentifier",
                  event.target.value,
                )
              }
              placeholder="e.g. UPI ID, payment handle, account identifier"
            />

            <p className="text-xs text-muted-foreground">
              This is displayed as payment information. Bizora does
              not create a payment request or dynamically generate
              payment amounts.
            </p>
          </div>

          {/* QR Code */}
          <div className="space-y-2">
            <Label htmlFor="payment-qr">
              Payment QR Code
              <span className="ml-1 text-muted-foreground">
                (Optional)
              </span>
            </Label>

            <Input
              id="payment-qr"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleQrCodeChange}
            />

            <p className="text-xs text-muted-foreground">
              Upload a static payment QR code provided by your
              payment provider or bank.
            </p>

            {paymentDetails.qrCode && (
              <p className="text-xs text-muted-foreground">
                Selected: {paymentDetails.qrCode.name}
              </p>
            )}
          </div>
        </section>

        {/* Payment Instructions */}
        <section className="space-y-2 border-t pt-8">
          <Label htmlFor="payment-instructions">
            Payment Instructions
            <span className="ml-1 text-muted-foreground">
              (Optional)
            </span>
          </Label>

          <Textarea
            id="payment-instructions"
            value={paymentDetails.paymentInstructions}
            onChange={(event) =>
              updatePaymentDetails(
                "paymentInstructions",
                event.target.value,
              )
            }
            placeholder="e.g. Please include your invoice number as the payment reference."
            rows={4}
          />

          <p className="text-xs text-muted-foreground">
            These instructions can appear on your customer bills
            and invoices.
          </p>
        </section>

        {/* Information */}
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            How payment information works
          </p>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Your configured payment details will be shown directly
            on invoices. Customers can scan the QR code or use the
            bank details to make the payment and enter the invoice
            total themselves.
          </p>
        </div>
      </div>
    </div>
  );
}