"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { completeSetup } from "../actions";

import { BusinessDetailsStep } from "./business-details-step";
import { CountryBusinessStep } from "./country-business-step";
import { CustomersStep } from "./customers-step";
import { PaymentDetailsStep } from "./payment-details-step";
import { ProductsStep } from "./products-step";
import { RegulatoryStep } from "./regulatory-step";
import { SetupCompleteStep } from "./setup-complete-step";
import { SetupStateProvider, useSetupState } from "./setup-state";
import { TaxInformationStep } from "./tax-information-step";
import { WelcomeStep } from "./welcome-step";

const STEPS = [
  "Welcome",
  "Country & Business",
  "Business Details",
  "Tax Information",
  "Regulatory",
  "Payment Details",
  "Customers",
  "Products",
  "Complete",
] as const;

export function SetupWizard() {
  return (
    <SetupStateProvider>
      <SetupWizardContent />
    </SetupStateProvider>
  );
}

function SetupWizardContent() {
  const router = useRouter();

  const {
    setupData,
    currentStep,
    setCurrentStep,
    isHydrated,
  } = useSetupState();

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /*
   * Wait until the setup draft has been restored
   * from localStorage before rendering the wizard.
   */
  if (!isHydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">
          Loading setup...
        </p>
      </main>
    );
  }

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = async () => {
    setError(null);
  
    if (!isLastStep) {
      setCurrentStep(currentStep + 1);
      return;
    }
  
    try {
      setIsSaving(true);
  
      /*
       * File objects must NOT be sent to the final
       * Server Action.
       *
       * The files are already stored inside
       * .setup-temp.
       */
      const {
        logo,
        paymentDetails,
        ...setupDataWithoutLogo
      } = setupData;
  
      const {
        qrCode,
        ...paymentDetailsWithoutFile
      } = paymentDetails;
  
      await completeSetup({
        ...setupDataWithoutLogo,
  
        logoPath: setupData.logoPath,
  
        paymentDetails: {
          ...paymentDetailsWithoutFile,
  
          qrCodePath:
            setupData.paymentDetails.qrCodePath,
        },
      });
  
      router.replace("/dashboard");
    } catch (error) {
      console.error(error);
  
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong while completing setup.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (isFirstStep || isSaving) {
      return;
    }

    setError(null);
    setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep />;

      case 1:
        return <CountryBusinessStep />;

      case 2:
        return <BusinessDetailsStep />;

      case 3:
        return <TaxInformationStep />;

      case 4:
        return <RegulatoryStep />;

      case 5:
        return <PaymentDetailsStep />;

      case 6:
        return <CustomersStep />;

      case 7:
        return <ProductsStep />;

      case 8:
        return <SetupCompleteStep />;

      default:
        return null;
    }
  };

  const progress =
    ((currentStep + 1) / STEPS.length) * 100;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/platform-assets/platform-app-icon.png"
              alt="Bizora"
              className="size-10"
            />

            <div>
              <p className="text-lg font-semibold">
                Bizora
              </p>

              <p className="text-xs text-muted-foreground">
                Your Business, Simplified.
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Step {currentStep + 1} of {STEPS.length}
          </p>
        </header>

        <section className="mb-8">
          <div className="flex gap-2">
            {STEPS.map((step, index) => (
              <div
                key={step}
                className={`h-1.5 flex-1 rounded-full ${
                  index <= currentStep
                    ? "bg-primary"
                    : "bg-muted"
                }`}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{STEPS[currentStep]}</span>

            <span>{Math.round(progress)}%</span>
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-3xl">
            <CardContent className="p-8">
              {renderStep()}

              {error && (
                <div className="mt-6 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">
                    {error}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <footer className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep || isSaving}
          >
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSaving}
          >
            {isSaving
              ? "Saving..."
              : isLastStep
                ? "Finish Setup"
                : "Continue"}
          </Button>
        </footer>
      </div>
    </main>
  );
}