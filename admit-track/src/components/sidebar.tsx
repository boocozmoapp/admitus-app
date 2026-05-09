"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import {
  LayoutDashboard,
  GraduationCap,
  Search,
  CalendarClock,
  FileText,
  Users2,
  BarChart3,
  Settings,
  ChevronLeft,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { BrandLogo } from "@/components/brand-logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/applications", label: "Applications", icon: GraduationCap },
  { href: "/search", label: "University Search", icon: Search },
  { href: "/deadlines", label: "Deadlines", icon: CalendarClock },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/supervisors", label: "Supervisors", icon: Users2 },
  { href: "/insights", label: "Insights", icon: BarChart3 },
  { href: "/profiles", label: "Profiles", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useAppStore();

  return (
    <TooltipProvider>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col bg-sidebar transition-all duration-300",
          sidebarOpen ? "w-64" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
          <BrandLogo
            compact={!sidebarOpen}
            markClassName="h-9 w-8"
            textClassName="text-lg"
            taglineClassName="text-[#6A9A9A]"
          />
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "ml-auto h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              !sidebarOpen && "ml-0"
            )}
            onClick={toggleSidebar}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                !sidebarOpen && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4">
          {sidebarOpen && (
            <div className="mb-3 px-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
                Main Navigation
              </span>
            </div>
          )}
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    !sidebarOpen && "justify-center px-0"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", isActive ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/70")} />
                  {sidebarOpen && <span>{item.label}</span>}
                </Link>
              );

              if (!sidebarOpen) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                );
              }
              return link;
            })}
          </div>
        </nav>
    </aside>
    </TooltipProvider>
  );
}
