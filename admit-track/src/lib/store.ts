import { create } from "zustand";

type Profile = {
  id: number;
  name: string;
  degreeLevel: string;
  fieldOfStudy: string;
  targetCountries: string;
  ieltsScore: number | null;
  toeflScore: number | null;
  gpa: number | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  accentColor: string;
  isActive: boolean;
};

interface AppState {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  activeProfileId: number | null;
  setActiveProfileId: (id: number | null) => void;
  profiles: Profile[];
  setProfiles: (profiles: Profile[]) => void;
  fetchProfiles: () => Promise<void>;
  whatIfGpa: number;
  whatIfSkillMatch: number;
  projectedScore: number;
  setWhatIf: (dimension: "gpa" | "skillMatch", value: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  activeProfileId: null,
  setActiveProfileId: (id) => set({ activeProfileId: id }),
  profiles: [],
  setProfiles: (profiles) => set({ profiles }),
  fetchProfiles: async () => {
    const res = await fetch("/api/profiles");
    const data = await res.json();
    set({ profiles: data });
    const active = (data as Profile[]).find((p: Profile) => p.isActive);
    if (active) set({ activeProfileId: active.id });
    else if (data.length > 0) set({ activeProfileId: (data as Profile[])[0].id });
  },
  whatIfGpa: 0,
  whatIfSkillMatch: 0,
  projectedScore: 0,
  setWhatIf: (dimension, value) =>
    set((s) => {
      const updated = { ...s, [dimension === "gpa" ? "whatIfGpa" : "whatIfSkillMatch"]: value };
      return updated;
    }),
}));
