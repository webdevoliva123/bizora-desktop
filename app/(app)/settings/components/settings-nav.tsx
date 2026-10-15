"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CreditCard, Receipt, ShieldCheck } from "lucide-react";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/settings", label: "Business", icon: Building2 },
  { href: "/settings/tax", label: "Tax", icon: Receipt },
  { href: "/settings/regulatory", label: "Regulatory", icon: ShieldCheck },
  { href: "/settings/payment", label: "Payment", icon: CreditCard },
];

export function SettingsNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Settings">
      {ITEMS.map((item) => {
        const active =
          item.href === "/settings"
            ? pathname === "/settings"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
              active
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}