
import Footer from "@/components/global-common/footer";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/constant/platfrom-details";
import { Home, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";



export default function NotFound() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
  

            {/* Main content */}
            <main className="flex flex-1 items-center justify-center p-8">
                <div className="max-w-md text-center">
                    <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                        <SearchX className="h-7 w-7 text-muted-foreground" />
                    </div>

                    <p className="text-sm font-medium text-muted-foreground">
                        Error 404
                    </p>

                    <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                        Page not found
                    </h1>

                    <p className="mt-3 text-sm text-muted-foreground">
                        The page you&apos;re looking for doesn&apos;t exist or may have been
                        moved. Please check the URL or return to the home page.
                    </p>

                    <div className="mt-8 flex justify-center">
                        <Link href="/">
                            <Button size="lg">
                                <Home className="mr-2 h-4 w-4" />
                                Go to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}