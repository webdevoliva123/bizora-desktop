import { redirect } from "next/navigation";

import { getSetupStatus } from "@/lib/db/business";

export const dynamic = "force-dynamic";

// First screen of the app:
//   business not set up yet -> /setup
//   business already set up -> /dashboard
export default async function Home() {
  const { completed } = await getSetupStatus();

  redirect(completed ? "/dashboard" : "/setup");
}
