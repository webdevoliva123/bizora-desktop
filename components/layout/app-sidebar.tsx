"use client";

import {
    BarChart3,
    BookOpen,
    Boxes,
    LayoutDashboard,
    Receipt,
    Settings,
    ShoppingCart,
    Truck,
    UserRoundCog,
    Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar";
import { BRAND, PLATFORM } from "@/lib/constant/platfrom-details";




  const navigation = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Daily Entries",
      href: "/daily-entries",
      icon: BookOpen,
    },
    {
      title: "Customers",
      href: "/customers",
      icon: Users,
    },
    {
      title: "Products",
      href: "/products",
      icon: Boxes,
    },
    {
      title: "Stock Purchases",
      href: "/stock-purchases",
      icon: ShoppingCart,
    },
    {
      title: "Suppliers",
      href: "/suppliers",
      icon: Truck,
    },
    {
      title: "Expenses",
      href: "/expenses",
      icon: Receipt,
    },
    {
      title: "Workers",
      href: "/workers",
      icon: UserRoundCog,
    },
    {
      title: "Reports",
      href: "/reports",
      icon: BarChart3,
    },
  ];

export function AppSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Sidebar collapsible="icon">
      {/* Business brand */}
      <SidebarHeader className="border-b">
        <SidebarMenu>
          <SidebarMenuItem>
              <Link href="/dashboard">
            <SidebarMenuButton size="lg" tooltip={BRAND.name}>
                <div className="flex aspect-square size-8 items-center justify-center overflow-hidden rounded-md border bg-background">
                  <img
                    src={PLATFORM.logo}
                    alt={`${BRAND.name} logo`}
                    width={32}
                    height={32}
                    className="size-8 object-contain"
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold">
                    {BRAND.name}
                  </span>
                 
                </div>
            </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <Link href={item.href}>
                  <SidebarMenuButton
                    
                    isActive={isActive(item.href)}
                    tooltip={item.title}
                  >
                      <item.icon />
                      <span>{item.title}</span>
                  </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Settings + platform branding */}
      <SidebarFooter className="border-t">
        <SidebarMenu>
          <SidebarMenuItem>
              <Link href="/settings">
            <SidebarMenuButton
              
              isActive={isActive("/settings")}
              tooltip="Settings"
            >
                <Settings />
                <span>Settings</span>
            </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Expanded: full "Powered by" logo */}
        <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-muted-foreground group-data-[collapsible=icon]:hidden">
          <span>Powered by</span>
          <img
            src={PLATFORM.logo}
            alt={`${PLATFORM.name} logo`}
            width={66}
            height={66}
          />
        </div>

        {/* Collapsed: just the platform icon */}
        <div className="hidden justify-center group-data-[collapsible=icon]:flex">
          <img
            src={PLATFORM.logo}
            alt={PLATFORM.name}
            width={24}
            height={24}
            className="size-6 object-contain"
          />
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}