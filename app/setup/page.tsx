import { redirect } from "next/navigation";

import { getSetupStatus } from "@/lib/db/business";

import { SetupWizard } from "./components/setup-wizard";

export default async function SetupPage() {
  const setupStatus = await getSetupStatus();

  if (setupStatus.completed) {
    redirect("/dashboard");
  }

  return <SetupWizard />;
}