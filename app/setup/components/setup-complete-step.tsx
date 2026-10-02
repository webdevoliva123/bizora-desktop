"use client";

import {
  Building2,
  CheckCircle2,
  CreditCard,
  Package,
  UserRound,
} from "lucide-react";

import { useSetupState } from "./setup-state";

export function SetupCompleteStep() {
  const { setupData } = useSetupState();

  const customerCount = setupData.customers.length;
  const productCount = setupData.products.length;

  const hasPaymentDetails =
    Boolean(
      setupData.paymentDetails.bankName ||
        setupData.paymentDetails.accountNumber ||
        setupData.paymentDetails.paymentIdentifier ||
        setupData.paymentDetails.qrCode,
    );

  return (
    <div className="py-6">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2 className="size-8" />
        </div>

        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          You&apos;re all set!
        </h1>

        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
          Your Bizora setup is ready. Review the information below
          and finish setup to start managing your business.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {/* Business */}
        <SummaryCard
          icon={<Building2 className="size-5" />}
          title="Business"
          value={setupData.businessName || "Not provided"}
          detail={
            setupData.businessType ||
            setupData.businessCategory ||
            setupData.country
          }
        />

        {/* Customers */}
        <SummaryCard
          icon={<UserRound className="size-5" />}
          title="Customers"
          value={`${customerCount} ${
            customerCount === 1 ? "customer" : "customers"
          }`}
          detail={
            customerCount > 0
              ? "Ready to use"
              : "You can add customers later"
          }
        />

        {/* Products */}
        <SummaryCard
          icon={<Package className="size-5" />}
          title="Products"
          value={`${productCount} ${
            productCount === 1 ? "product" : "products"
          }`}
          detail={
            productCount > 0
              ? "Ready to use"
              : "You can add products later"
          }
        />

        {/* Payment */}
        <SummaryCard
          icon={<CreditCard className="size-5" />}
          title="Payment Details"
          value={hasPaymentDetails ? "Configured" : "Not configured"}
          detail={
            hasPaymentDetails
              ? "Payment information will be available on invoices"
              : "You can configure this later"
          }
        />
      </div>

      <div className="mt-8 rounded-lg border bg-muted/30 p-5">
        <p className="text-sm font-medium">
          What happens next?
        </p>

        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>Your business information will be saved locally.</span>
          </li>

          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              Your customers and products will be ready to use.
            </span>
          </li>

          <li className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              You can update your configuration anytime from
              Settings.
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>

        <p className="text-sm font-medium">{title}</p>
      </div>

      <p className="mt-4 text-sm font-medium">{value}</p>

      <p className="mt-1 text-xs text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}