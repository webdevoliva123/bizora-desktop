"use client";

import {
  ArrowLeft,
  Building2,
  ChevronDown,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";

import { PageContainer } from "@/components/shared/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type { CustomerDetails } from "@/lib/types/customer";

import CustomerAccountView from "./components/customer-account-view";
import DeleteCustomerDialog from "./components/delete-customer-dialog";
import EditCustomerDialog from "./components/edit-customer-dialog";

type CustomerProfile = CustomerDetails & {
  summary: {
    customerId: number;
    totalEntries: number;
    totalSales: number;
    totalPaid: number;
    totalOutstanding: number;
  };
};

function getCustomerName(customer: CustomerProfile) {
  if (customer.type === "BUSINESS") {
    return customer.business?.businessName ?? "Business Customer";
  }

  return (
    [customer.person?.firstName, customer.person?.lastName]
      .filter(Boolean)
      .join(" ") || "Customer"
  );
}

function formatAmount(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value / 100);
}

export default function CustomerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false); // minimized by default
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const loadCustomer = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`/api/customers/${id}`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load customer.");
      }

      setCustomer(data.customer);
    } catch (err) {
      console.error("Failed to load customer:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load customer.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadCustomer();
  }, [loadCustomer]);

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
          Loading customer...
        </div>
      </PageContainer>
    );
  }

  if (error || !customer) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Link href="/customers">
            <Button variant="ghost">
              <ArrowLeft />
              Back to Customers
            </Button>
          </Link>

          <div className="rounded-lg border p-8 text-center">
            <p className="font-medium">{error || "Customer not found."}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const customerName = getCustomerName(customer);
  const TypeIcon = customer.type === "BUSINESS" ? Building2 : UserRound;

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Back */}
        <Link href="/customers">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft />
            Back to Customers
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <TypeIcon className="size-5 text-muted-foreground" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  {customerName}
                </h1>

                <Badge variant="outline">
                  {customer.type === "BUSINESS" ? "Business" : "Person"}
                </Badge>

                <Badge
                  variant="outline"
                  className={
                    customer.active
                      ? "border-transparent bg-emerald-100 text-emerald-700"
                      : "border-transparent bg-muted text-muted-foreground"
                  }
                >
                  {customer.active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">
                cu-{customer.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              Edit
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 />
              Delete
            </Button>
          </div>
        </div>

        {/* Compact account summary */}
        <div className="grid grid-cols-2 divide-x divide-y rounded-lg border sm:grid-cols-4 sm:divide-y-0">
          <Stat label="Entries" value={customer.summary.totalEntries.toString()} />
          <Stat label="Total Sales" value={formatAmount(customer.summary.totalSales)} />
          <Stat
            label="Paid"
            value={formatAmount(customer.summary.totalPaid)}
            valueClassName="text-emerald-600"
          />
          <Stat
            label="Outstanding"
            value={formatAmount(customer.summary.totalOutstanding)}
            valueClassName="text-red-600"
          />
        </div>

        {/* Customer details (collapsible, minimized by default) */}
        <section className="rounded-lg border">
          <button
            type="button"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/30"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">Customer details</span>

              {!detailsOpen && (
                <span className="truncate text-muted-foreground">
                  {[customer.phone, customer.email, customer.city]
                    .filter(Boolean)
                    .join("  ·  ") || "No contact info"}
                </span>
              )}
            </div>

            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                detailsOpen && "rotate-180",
              )}
            />
          </button>

          {detailsOpen && (
            <div className="border-t">
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                <Detail icon={Phone} label="Phone" value={customer.phone} />
                <Detail icon={Mail} label="Email" value={customer.email} />
                <Detail icon={MapPin} label="City" value={customer.city} />
                <Detail label="State / Region" value={customer.state} />
              </div>

              {customer.address && (
                <div className="border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="mt-1 text-sm">
                    {customer.address}
                    {customer.postalCode ? `, ${customer.postalCode}` : ""}
                  </p>
                </div>
              )}

              {customer.type === "BUSINESS" && customer.business && (
                <div className="grid gap-4 border-t p-4 sm:grid-cols-2">
                  <Detail
                    label="Contact Person"
                    value={customer.business.contactPerson}
                  />
                  <Detail
                    label="Tax Registration Number"
                    value={customer.business.taxRegistrationNumber}
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Monthly account + entries */}
        <CustomerAccountView customerId={customer.id} />
      </div>

      <EditCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onSaved={loadCustomer}
      />

      <DeleteCustomerDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        customerId={customer.id}
        customerName={customerName}
        customerType={customer.type}
        entryCount={customer.summary.totalEntries}
        onDeleted={() => {
          router.push("/customers");
          router.refresh();
        }}
      />
    </PageContainer>
  );
}

function Stat({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="px-4 py-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("text-base font-semibold tabular-nums", valueClassName)}>
        {value}
      </p>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon?: typeof Phone;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2 text-sm">
        {Icon && <Icon className="size-4 text-muted-foreground" />}
        {value || "—"}
      </div>
    </div>
  );
}