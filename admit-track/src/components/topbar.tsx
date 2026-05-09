"use client";

import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Plus, User, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function TopBar() {
  const router = useRouter();
  const { sidebarOpen, setQuickAddOpen, setCommandPaletteOpen, profiles, activeProfileId, setActiveProfileId, fetchProfiles } = useAppStore();
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCommandPaletteOpen]);

  async function switchProfile(id: number) {
    await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    setActiveProfileId(id);
    setShowProfileSwitcher(false);
    fetchProfiles();
  }

  const activeProfile = profiles.find(p => p.id === activeProfileId);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-16 items-center justify-between gap-4 bg-background/90 backdrop-blur-md px-6 transition-all topbar-shadow",
        sidebarOpen ? "ml-64 w-[calc(100%-16rem)]" : "ml-16 w-[calc(100%-4rem)]"
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          onClick={() => setQuickAddOpen(true)}
          size="sm"
          className="gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 hover:bg-[#1A4040] hover:shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />Quick Add
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {profiles.length > 0 && (
          <div className="relative">
            <Button variant="ghost" size="sm" className="gap-2 rounded-xl text-sm font-medium" onClick={async () => { await fetchProfiles(); setShowProfileSwitcher(!showProfileSwitcher); }}>
              <div className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold" style={{ backgroundColor: activeProfile?.accentColor || "#1A4040" }}>
                <User className="h-3.5 w-3.5" />
              </div>
              {activeProfile && <span className="hidden md:inline max-w-[120px] truncate">{activeProfile.name}</span>}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
            {showProfileSwitcher && (
              <div className="absolute right-0 top-full mt-1 w-64 rounded-2xl bg-popover border-0 card-shadow p-2 z-50">
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground px-3 py-1.5">Switch Profile</div>
                {profiles.map(p => (
                  <button key={p.id} onClick={() => switchProfile(p.id)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left", p.id === activeProfileId ? "bg-accent text-primary" : "text-foreground hover:bg-muted")}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold" style={{ backgroundColor: p.accentColor }}>{p.name.charAt(0)}</div>
                    <div className="min-w-0"><div className="truncate">{p.name}</div><div className="text-[10px] text-muted-foreground">{p.degreeLevel} · {p.fieldOfStudy}</div></div>
                    {p.id === activeProfileId && <div className="ml-auto h-2 w-2 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" className="rounded-lg" onClick={logout} title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
