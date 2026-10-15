import { redirect } from "next/navigation";

import { getSetupStatus } from "@/lib/db/business";
import { getTaxRegistrations } from "@/lib/db/settings";

import { TaxSettingsForm } from "../components/tax-settings-form";

export default async function TaxSettingsPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  return <TaxSettingsForm registrations={getTaxRegistrations(setup.businessId)} />;
}