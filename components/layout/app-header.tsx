"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const TITLES: Record<string, string> = {
  dashboard: "Dashboard",
  "daily-entries": "Daily Entries",
  customers: "Customers",
  products: "Products",
  reports: "Reports",
  settings: "Settings",
};

const toTitle = (segment: string) =>
  TITLES[segment] ??
  segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

export function AppHeader() {
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger />

        <Separator
          orientation="vertical"
          className="mr-2 h-4 mt-2"
        />

        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const href =
                "/" + segments.slice(0, index + 1).join("/");

              const isLast =
                index === segments.length - 1;

              return (
                <div
                  key={href}
                  className="flex items-center gap-1.5"
                >
                  {index > 0 && <BreadcrumbSeparator />}

                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>
                        {toTitle(segment)}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink>
                        <Link href={href}>
                          {toTitle(segment)}
                        </Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  );
}