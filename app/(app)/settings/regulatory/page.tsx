import { redirect } from "next/navigation";

import { getSetupStatus } from "@/lib/db/business";
import { getRegulatoryRegistrations } from "@/lib/db/settings";

import { RegulatorySettingsForm } from "../components/regulatory-settings-form";

export default async function RegulatorySettingsPage() {
  const setup = await getSetupStatus();

  if (!setup.completed || !setup.businessId) {
    redirect("/setup");
  }

  return (
    <RegulatorySettingsForm
      registrations={getRegulatoryRegistrations(setup.businessId)}
    />
  );
}