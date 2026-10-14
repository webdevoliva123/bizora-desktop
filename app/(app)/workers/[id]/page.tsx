"use client";

import {
  ArrowLeft,
  ChevronDown,
  HardHat,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Power,
  PowerOff,
} from "lucide-react";
import Link from "next/link";
import { use, useCallback, useEffect, useState } from "react";

import { PageContainer } from "@/components/shared/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { WorkerDetails } from "@/lib/types/worker";

import { setWorkerActiveAction } from "../actions";
import { WorkerFormDialog } from "../components/worker-form-dialog";
import WorkerSalaryView from "../components/worker-salary-view";
import {
  formatCurrency,
  formatDate,
  paymentTypeLabel,
} from "../components/worker-shared";

export default function WorkerDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [worker, setWorker] = useState<WorkerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detailsOpen, setDetailsOpen] = useState(false); // minimized by default
  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusError, setStatusError] = useState("");

  const loadWorker = useCallback(async () => {
    try {
      setError("");

      const response = await fetch(`/api/workers/${id}`, { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load worker.");
      }

      setWorker(data.worker);
    } catch (err) {
      console.error("Failed to load worker:", err);
      setError(err instanceof Error ? err.message : "Failed to load worker.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadWorker();
  }, [loadWorker]);

  async function handleToggleActive() {
    if (!worker) return;

    setStatusSaving(true);
    setStatusError("");

    const result = await setWorkerActiveAction(worker.id, !worker.active);

    setStatusSaving(false);

    if (!result.success) {
      setStatusError(result.error);
      return;
    }

    setStatusOpen(false);
    await loadWorker();
  }

  if (loading) {
    return (
      <PageContainer>
        <div className="flex min-h-64 items-center justify-center text-sm text-muted-foreground">
          Loading worker...
        </div>
      </PageContainer>
    );
  }

  if (error || !worker) {
    return (
      <PageContainer>
        <div className="space-y-4">
          <Link href="/workers">
            <Button variant="ghost">
              <ArrowLeft />
              Back to Workers
            </Button>
          </Link>

          <div className="rounded-lg border p-8 text-center">
            <p className="font-medium">{error || "Worker not found."}</p>
          </div>
        </div>
      </PageContainer>
    );
  }

  const nextActionLabel = worker.active ? "Deactivate" : "Activate";

  return (
    <PageContainer>
      <div className="space-y-4">
        {/* Back */}
        <Link href="/workers">
          <Button variant="ghost" size="sm" className="-ml-2">
            <ArrowLeft />
            Back to Workers
          </Button>
        </Link>

        {/* Header */}
        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <HardHat className="size-5 text-muted-foreground" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold tracking-tight">
                  {worker.name}
                </h1>

                {worker.role && <Badge variant="outline">{worker.role}</Badge>}

                <Badge
                  variant="outline"
                  className={
                    worker.active
                      ? "border-transparent bg-emerald-100 text-emerald-700"
                      : "border-transparent bg-muted text-muted-foreground"
                  }
                >
                  {worker.active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground">wk-{worker.id}</p>
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
              className={
                worker.active ? "text-destructive hover:text-destructive" : ""
              }
              onClick={() => {
                setStatusError("");
                setStatusOpen(true);
              }}
            >
              {worker.active ? <PowerOff /> : <Power />}
              {nextActionLabel}
            </Button>
          </div>
        </div>

        {/* Compact summary */}
        <div className="grid grid-cols-2 divide-x divide-y rounded-lg border sm:grid-cols-4 sm:divide-y-0">
          <Stat
            label="Total Paid"
            value={formatCurrency(worker.summary.totalPaid)}
            valueClassName="text-emerald-600"
          />
          <Stat label="Payments" value={String(worker.summary.paymentCount)} />
          <Stat
            label="Last Payment"
            value={formatDate(worker.summary.lastPaymentDate)}
          />
          <Stat
            label={`${paymentTypeLabel(worker.paymentType)} Salary`}
            value={
              worker.defaultPaymentAmount != null
                ? formatCurrency(worker.defaultPaymentAmount)
                : "—"
            }
          />
        </div>

        {/* Worker details (collapsible, minimized by default) */}
        <section className="rounded-lg border">
          <button
            type="button"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-muted/30"
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">Worker details</span>

              {!detailsOpen && (
                <span className="truncate text-muted-foreground">
                  {[worker.phone, worker.email, worker.role]
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
                <Detail icon={Phone} label="Phone" value={worker.phone} />
                <Detail icon={Mail} label="Email" value={worker.email} />
                <Detail label="Role" value={worker.role} />
                <Detail label="Joined" value={formatDate(worker.joiningDate)} />
              </div>

              {worker.address && (
                <div className="border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="size-4 text-muted-foreground" />
                    {worker.address}
                  </div>
                </div>
              )}

              {worker.notes && (
                <div className="border-t px-4 py-3">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="mt-1 text-sm whitespace-pre-wrap">
                    {worker.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Salary by year */}
        <WorkerSalaryView
          workerId={worker.id}
          workerName={worker.name}
          paymentType={worker.paymentType}
          defaultAmount={worker.defaultPaymentAmount}
          onChanged={loadWorker}
        />
      </div>

      <WorkerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        worker={worker}
        onSaved={loadWorker}
      />

      {/* Activate / deactivate confirmation */}
      <Dialog
        open={statusOpen}
        onOpenChange={(next) => !statusSaving && setStatusOpen(next)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{nextActionLabel} worker?</DialogTitle>
            <DialogDescription>
              {worker.active
                ? `${worker.name} will be marked inactive. Their salary history is kept and you can activate them again at any time.`
                : `${worker.name} will be marked active again.`}
            </DialogDescription>
          </DialogHeader>

          {statusError && (
            <p className="text-sm text-destructive">{statusError}</p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              disabled={statusSaving}
              onClick={() => setStatusOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant={worker.active ? "destructive" : "default"}
              disabled={statusSaving}
              onClick={handleToggleActive}
            >
              {statusSaving ? "Saving..." : nextActionLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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