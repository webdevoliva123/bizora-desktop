import { redirect } from "next/navigation";

import { getSetupStatus } from "@/lib/db/business";
import { getBusinessSettings } from "@/lib/db/settings";

import { BusinessSettingsForm } from "./components/business-settings-form";

export default async function BusinessSettingsPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  const settings = getBusinessSettings(setup.businessId);

  if (!settings) {
    redirect("/setup");
  }

  return <BusinessSettingsForm settings={settings} />;
}