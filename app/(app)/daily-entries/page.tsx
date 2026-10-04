import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { DailyEntriesTable } from "./components/daily-entries-table";
import { getSetupStatus } from "@/lib/db/business";
import { getDailyEntries } from "@/lib/db/daily-entries";
import { getBusinessBasicDetails } from "@/lib/db/business";
import {
    getCustomersForDailyEntry,
    getProductsForDailyEntry,
} from "@/lib/db/daily-entry-options";

import { AddDailyEntryDialog } from "./components/add-daily-entry-dialog";

export default async function DailyEntriesPage() {
    const setupStatus = await getSetupStatus();

    if (!setupStatus.completed || !setupStatus.businessId) {
        return null;
    }

    const business = getBusinessBasicDetails();

    if (!business) {
        return null;
    }

    const entries = getDailyEntries(
        setupStatus.businessId,
    );

    const customers = getCustomersForDailyEntry(setupStatus.businessId);

    const products = getProductsForDailyEntry(setupStatus.businessId);

    return (
        <PageContainer>
            <PageHeader
                title="Daily Entries"
                description="Record and manage your daily business entries."
                actions={
                    <AddDailyEntryDialog
                        customers={customers}
                        products={products}
                    />
                }
            />

            <section className="mt-6">
                <DailyEntriesTable
                    entries={entries}
                    currency={business.currency}
                />
            </section>
        </PageContainer>
    );
}