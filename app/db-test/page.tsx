import { db } from "@/lib/db";
import { businesses } from "@/lib/db/schema";

export default async function DatabaseTestPage() {
  const result = await db.select().from(businesses);

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-xl space-y-4">
        <h1 className="text-2xl font-semibold">
          Bizora Database Test
        </h1>

        <div className="rounded-lg border p-4">
          <p className="font-medium">
            Database connection: ✅ Working
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Businesses found: {result.length}
          </p>
        </div>
      </div>
    </main>
  );
}