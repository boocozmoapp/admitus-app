"use client";

import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { sidebarOpen } = useAppStore();

  return (
    <main
      className={cn(
        "min-h-screen pt-16 transition-all duration-300",
        sidebarOpen ? "ml-64 w-[calc(100%-16rem)]" : "ml-16 w-[calc(100%-4rem)]"
      )}
    >
      <div className="p-6">{children}</div>
    </main>
  );
}
