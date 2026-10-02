// app/global-error.tsx
"use client";

import Footer from "@/components/global-common/footer";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constant/platfrom-details";
import { Home, RefreshCw, TriangleAlert } from "lucide-react";
import Image from "next/image";
import { useEffect } from "react";
import "./globals.css"; // required: global-error replaces the root layout, so styles must be imported here



export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to your error reporting service (Sentry, etc.)
        console.error(error);
    }, [error]);

    return (
        <html lang="en">
            <body>
                <div className="flex min-h-screen flex-col bg-background">
                    {/* Header with business logo */}
                    <header className="border-b">
                        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
                            {/* Plain <a>: forces a full reload, which is safer after a root-level crash */}
                            <a href="/" className="flex items-center gap-3">
                                <img
                                    src={BRAND.logo}
                                    alt={`${BRAND.name} logo`}
                                    width={36}
                                    height={36}
                                />
                                <span className="text-base font-semibold">{BRAND.name}</span>
                            </a>
                        </div>
                    </header>

                    {/* Main content */}
                    <main className="flex flex-1 items-center justify-center p-8">
                        <div className="max-w-md text-center">
                            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                <TriangleAlert className="h-7 w-7 text-muted-foreground" />
                            </div>

                            <p className="text-sm font-medium text-muted-foreground">
                                Error 500
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                                Something went wrong
                            </h1>

                            <p className="mt-3 text-sm text-muted-foreground">
                                We hit an unexpected problem while loading this page. Please try
                                again, or return to the home page.
                            </p>

                            {error.digest && (
                                <p className="mt-3 text-xs text-muted-foreground">
                                    Reference ID: {error.digest}
                                </p>
                            )}

                            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                <Button size="lg" onClick={() => reset()}>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try again
                                </Button>

                                <a href="/">
                                    <Button size="lg" variant="outline">
                                        <Home className="mr-2 h-4 w-4" />
                                        Go to Home
                                    </Button>
                                </a>
                            </div>
                        </div>
                    </main>

                    {/* Footer */}
                    <Footer />
                </div>
            </body>
        </html>
    );
}