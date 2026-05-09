"use client";

import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  GraduationCap,
  Search,
  CalendarClock,
  FileText,
  Users2,
  BarChart3,
  Settings,
  Plus,
  UserPlus,
} from "lucide-react";

const pages = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Applications", href: "/applications", icon: GraduationCap },
  { name: "University Search", href: "/search", icon: Search },
  { name: "Deadlines", href: "/deadlines", icon: CalendarClock },
  { name: "Documents", href: "/documents", icon: FileText },
  { name: "Supervisors", href: "/supervisors", icon: Users2 },
  { name: "Insights", href: "/insights", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setQuickAddOpen } = useAppStore();
  const router = useRouter();
  const [applications, setApplications] = useState<Array<{ id: number; universityName: string; programName: string }>>([]);

  useEffect(() => {
    if (commandPaletteOpen) {
      fetch("/api/applications")
        .then((r) => r.json())
        .then(setApplications)
        .catch(() => {});
    }
  }, [commandPaletteOpen]);

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search or jump to..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false);
              setQuickAddOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Quick Add Application
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false);
              router.push("/supervisors?new=true");
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Supervisor
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setCommandPaletteOpen(false);
              router.push("/search");
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            Search for University
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Pages">
          {pages.map((page) => (
            <CommandItem
              key={page.href}
              onSelect={() => {
                router.push(page.href);
                setCommandPaletteOpen(false);
              }}
            >
              <page.icon className="mr-2 h-4 w-4" />
              {page.name}
            </CommandItem>
          ))}
        </CommandGroup>
        {applications.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Applications">
              {applications.map((app) => (
                <CommandItem
                  key={app.id}
                  onSelect={() => {
                    router.push(`/applications/${app.id}`);
                    setCommandPaletteOpen(false);
                  }}
                >
                  <GraduationCap className="mr-2 h-4 w-4" />
                  {app.universityName} — {app.programName}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
