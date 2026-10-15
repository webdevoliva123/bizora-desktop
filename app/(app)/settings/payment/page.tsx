import { redirect } from "next/navigation";

import { getSetupStatus } from "@/lib/db/business";
import { getPaymentDetails } from "@/lib/db/settings";

import { PaymentSettingsForm } from "../components/payment-settings-form";

export default async function PaymentSettingsPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  return <PaymentSettingsForm details={getPaymentDetails(setup.businessId) ?? null} />;
}