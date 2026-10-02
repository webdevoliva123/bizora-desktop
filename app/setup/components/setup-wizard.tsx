"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { BusinessDetailsStep } from "./business-details-step";
import { CountryBusinessStep } from "./country-business-step";
import { CustomersStep } from "./customers-step";
import { PaymentDetailsStep } from "./payment-details-step";
import { ProductsStep } from "./products-step";
import { RegulatoryStep } from "./regulatory-step";
import { SetupCompleteStep } from "./setup-complete-step";
import { TaxInformationStep } from "./tax-information-step";
import { WelcomeStep } from "./welcome-step";
import { SetupStateProvider } from "./setup-state";

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
  const [currentStep, setCurrentStep] = useState(0);

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      return;
    }

    setCurrentStep((step) => step + 1);
  };

  const handleBack = () => {
    if (isFirstStep) {
      return;
    }

    setCurrentStep((step) => step - 1);
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
      <SetupStateProvider>
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
        {/* Header */}
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

        {/* Progress */}
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

        {/* Step Content */}
        <section className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-3xl">
            <CardContent className="p-8">
              {renderStep()}
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="mt-8 flex items-center justify-between border-t pt-6">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
          >
            Back
          </Button>

          <Button
            onClick={handleNext}
          >
            {isLastStep ? "Finish Setup" : "Continue"}
          </Button>
        </footer>
      </div>
    </main>
    </SetupStateProvider>
  );
}