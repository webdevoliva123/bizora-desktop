import { ArrowRight, CheckCircle2 } from "lucide-react";

export function WelcomeStep() {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      {/* Logo */}
      <img
        src="/platform-assets/platform-logo.png"
        alt="Bizora"
        className="mb-8 h-auto w-52"
      />

      {/* Heading */}
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome to Bizora
      </h1>

      <p className="mt-3 max-w-xl text-muted-foreground">
        Let&apos;s get your business set up. We&apos;ll guide you
        through a few simple steps so Bizora can work the way your
        business needs.
      </p>

      {/* What we'll configure */}
      <div className="mt-8 w-full max-w-lg rounded-xl border bg-muted/30 p-5 text-left">
        <p className="mb-4 text-sm font-medium">
          During setup, we&apos;ll configure:
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <SetupItem label="Business information" />
          <SetupItem label="Tax & registrations" />
          <SetupItem label="Payment details" />
          <SetupItem label="Customers" />
          <SetupItem label="Products & pricing" />
          <SetupItem label="Initial business settings" />
        </div>
      </div>

      {/* Footer message */}
      <div className="mt-8 flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4" />

        <span>
          You can change these settings later from Settings.
        </span>

        <ArrowRight className="size-4" />
      </div>
    </div>
  );
}

function SetupItem({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className="size-4 shrink-0 text-primary" />

      <span className="text-sm">{label}</span>
    </div>
  );
}