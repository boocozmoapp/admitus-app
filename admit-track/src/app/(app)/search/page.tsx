"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { cn, formatCurrency, calculateProfileFitScore, type FitDimension, type PrerequisiteGate } from "@/lib/utils";
import { generateStarterTasks } from "@/lib/ai/mocks";
import { FitScoreCard } from "@/components/fit-score/fit-score-card";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search, Bookmark, BookmarkCheck, Plus, Eye, X, SlidersHorizontal,
  MapPin, GraduationCap, Globe, DollarSign, Loader2,
  ExternalLink, Calendar, FileText, Filter, Sparkles, AlertCircle,
  MessageSquare, Users2, UserPlus, BookOpen, ArrowLeft, Mail, Send, Bot, Medal,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useRouter } from "next/navigation";

type FacultyMember = {
  name: string;
  title: string;
  department: string;
  researchInterests: string | null;
  labName: string | null;
  personalWebsiteUrl: string | null;
  scholarUrl: string | null;
  email: string | null;
  matchScore: number | null;
  matchReason: string | null;
};

type Intake = {
  id: number;
  intakeTerm: string;
  intakeYear: number;
  applicationDeadline: string | null;
  decisionExpectedDate: string | null;
  applicationOpenDate: string | null;
};

type DocumentRequired = {
  id: number;
  documentType: string;
  notes: string | null;
};

type Program = {
  id: number;
  universityId: number;
  universityName: string;
  universityCountry: string;
  universityCity: string;
  name: string;
  degreeLevel: string;
  fieldOfStudy: string;
  languageOfInstruction: string;
  description: string | null;
  durationMonths: number | null;
  tuitionAmount: number | null;
  tuitionCurrency: string | null;
  tuitionPeriod: string | null;
  applicationFeeAmount: number | null;
  applicationFeeCurrency: string | null;
  ieltsMin: number | null;
  toeflMin: number | null;
  gpaMin: number | null;
  greRequired: boolean | null;
  scholarshipAvailable: boolean | null;
  sourceUrl: string | null;
  ranking: number | null;
  requiredSkills: string | null;
  prerequisites: string | null;
  researchAreas: string | null;
  intakes: Intake[];
  documentsRequired: DocumentRequired[];
  links?: Array<{ l: string; u: string }>;
};

const DEGREE_LEVELS = ["Bachelors", "Masters", "PhD"];

function safeParseJsonArray(val: string | null | undefined): string[] | null {
  if (!val) return null;
  try { const p = JSON.parse(val); return Array.isArray(p) ? p : null; } catch { return null; }
}
const FIELDS_OF_STUDY = ["CS", "Engineering", "Business", "Data Science", "Public Policy", "Life Sciences", "Arts & Humanities"];
const LANGUAGES = ["English", "French", "German", "Bilingual"];
const GRE_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "true", label: "Required" },
  { value: "false", label: "Not Required" },
];
const SORT_OPTIONS = [
  { value: "ranking", label: "Ranking" },
  { value: "tuition_asc", label: "Tuition: Low → High" },
  { value: "deadline_soonest", label: "Deadline: Soonest" },
];

function getNextIntake(intakes: Intake[]): Intake | null {
  if (!intakes || intakes.length === 0) return null;
  const now = new Date();
  const future = intakes
    .filter((i) => i.applicationDeadline && new Date(i.applicationDeadline) > now)
    .sort((a, b) => new Date(a.applicationDeadline!).getTime() - new Date(b.applicationDeadline!).getTime());
  return future[0] || intakes[0];
}

function FitScoreRing({ score, dimensions, prerequisites, noProfile }: {
  score: number;
  dimensions: FitDimension[];
  prerequisites?: PrerequisiteGate[];
  noProfile?: boolean;
}) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const strokeClass = score > 70 ? "stroke-emerald-500" : score > 50 ? "stroke-amber-500" : "stroke-red-500";
  const textClass = score > 70 ? "text-emerald-600 dark:text-emerald-400" : score > 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger className="inline-flex cursor-help">
          <div className="relative inline-flex items-center justify-center">
            <svg width={52} height={52} className="-rotate-90">
              <circle cx={26} cy={26} r={radius} fill="none" strokeWidth={3.5} className="stroke-muted/40" />
              <circle cx={26} cy={26} r={radius} fill="none" strokeWidth={3.5} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={cn("transition-all duration-500", strokeClass)} />
            </svg>
            <span className={cn("absolute text-[11px] font-bold", textClass)}>{score}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left" className="p-0 max-w-[250px]">
          {noProfile || dimensions.length === 0 ? (
            <div className="px-3 py-2 text-[11px]">
              Set up a profile to see your personalized fit score
            </div>
          ) : (
            <div className="px-3 py-2.5 space-y-1.5 min-w-[170px]">
              {prerequisites && prerequisites.length > 0 && (
                <div className="flex flex-wrap gap-1 pb-1 border-b border-background/20 mb-1">
                  {prerequisites.map((g) => (
                    <span key={g.label} className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                      g.met === true ? "text-emerald-300 bg-emerald-500/20" :
                      g.met === false ? "text-red-300 bg-red-500/20" :
                      "text-amber-300 bg-amber-500/20"
                    )}>{g.label}</span>
                  ))}
                </div>
              )}
              <p className="text-[10px] font-semibold opacity-70 pb-0.5">
                Profile Fit Breakdown
              </p>
              {dimensions.map((d) => (
                <div key={d.label} className="flex items-center gap-2 text-[11px]">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full shrink-0",
                    d.met === true ? "bg-emerald-400" : d.met === false ? "bg-red-400" : "bg-amber-300"
                  )} />
                  <span className="flex-1 opacity-90">{d.label}</span>
                  <span className="font-mono font-medium tabular-nums">{d.earned}/{d.max}</span>
                </div>
              ))}
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Common grad-program destination countries (merged with dynamically loaded ones)
const COMMON_COUNTRIES = [
  "Australia", "Austria", "Belgium", "Canada", "China", "Czech Republic",
  "Denmark", "Estonia", "Finland", "France", "Germany", "Greece",
  "Hong Kong", "Hungary", "Iceland", "India", "Ireland", "Israel",
  "Italy", "Japan", "Latvia", "Lithuania", "Luxembourg", "Malaysia",
  "Netherlands", "New Zealand", "Norway", "Poland", "Portugal",
  "Saudi Arabia", "Singapore", "Slovakia", "Slovenia", "South Korea",
  "Spain", "Sweden", "Switzerland", "Taiwan", "Turkey", "UAE",
  "UK", "USA",
];

function FilterPanel({
  search, setSearch, availableCountries, countries, toggleCountry, degreeLevel, setDegreeLevel,
  fieldOfStudy, setFieldOfStudy, language, setLanguage, maxTuition, setMaxTuition,
  greRequired, setGreRequired, scholarship, setScholarship, sortBy, setSortBy,
  onClear, activeCount,
}: {
  search: string; setSearch: (v: string) => void;
  availableCountries: string[];
  countries: string[]; toggleCountry: (c: string) => void;
  degreeLevel: string; setDegreeLevel: (v: string) => void;
  fieldOfStudy: string; setFieldOfStudy: (v: string) => void;
  language: string; setLanguage: (v: string) => void;
  maxTuition: string; setMaxTuition: (v: string) => void;
  greRequired: string; setGreRequired: (v: string) => void;
  scholarship: boolean; setScholarship: (v: boolean) => void;
  sortBy: string; setSortBy: (v: string) => void;
  onClear: () => void; activeCount: number;
}) {
  const [countrySearch, setCountrySearch] = useState("");

  // Merge common + dynamically loaded countries, sorted
  const allCountryOptions = useMemo(
    () => [...new Set([...COMMON_COUNTRIES, ...availableCountries])].sort(),
    [availableCountries]
  );

  // Suggestions: filter by search text, exclude already-selected
  const q = countrySearch.trim().toLowerCase();
  const suggestions = useMemo(
    () => q
      ? allCountryOptions.filter(
          (c) => c.toLowerCase().includes(q) && !countries.includes(c)
        ).slice(0, 8)
      : [],
    [q, allCountryOptions, countries]
  );

  // "Add custom" option when typed text isn't in the list at all
  const typedExact = countrySearch.trim();
  const showAddCustom =
    typedExact.length > 1 &&
    !allCountryOptions.some((c) => c.toLowerCase() === typedExact.toLowerCase()) &&
    !countries.includes(typedExact);

  function selectSuggestion(c: string) {
    toggleCountry(c);
    setCountrySearch("");
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Search</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="University or program..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl" />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Country</Label>

        {/* Selected country chips */}
        {countries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {countries.map((c) => (
              <button
                key={c}
                onClick={() => toggleCountry(c)}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                {c} <X className="h-3 w-3 opacity-70" />
              </button>
            ))}
          </div>
        )}

        {/* Country search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search or add country…"
            value={countrySearch}
            onChange={(e) => setCountrySearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typedExact) {
                e.preventDefault();
                if (suggestions.length > 0) selectSuggestion(suggestions[0]);
                else if (showAddCustom) { toggleCountry(typedExact); setCountrySearch(""); }
              }
              if (e.key === "Escape") setCountrySearch("");
            }}
            className="pl-8 pr-3 h-8 text-xs rounded-lg"
          />
          {countrySearch && (
            <button onClick={() => setCountrySearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Suggestions dropdown */}
        {(suggestions.length > 0 || showAddCustom) && (
          <div className="rounded-lg border border-border bg-popover shadow-sm overflow-hidden">
            {suggestions.map((c) => (
              <button
                key={c}
                onClick={() => selectSuggestion(c)}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-2"
              >
                <span className="flex-1">{c}</span>
                {availableCountries.includes(c) && (
                  <span className="text-[10px] text-indigo-500 font-medium">has results</span>
                )}
              </button>
            ))}
            {showAddCustom && (
              <button
                onClick={() => { toggleCountry(typedExact); setCountrySearch(""); }}
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-muted transition-colors flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 border-t border-border"
              >
                <Plus className="h-3 w-3" /> Add &ldquo;{typedExact}&rdquo;
              </button>
            )}
          </div>
        )}

        {/* Quick-pick chips (when not searching) */}
        {!countrySearch && (
          <div className="flex flex-wrap gap-1.5">
            {availableCountries.filter((c) => !countries.includes(c)).map((c) => (
              <button
                key={c}
                onClick={() => toggleCountry(c)}
                className="rounded-full px-2.5 py-1 text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Degree Level</Label>
        <div className="flex gap-1.5">
          {DEGREE_LEVELS.map((d) => (
            <button
              key={d}
              onClick={() => setDegreeLevel(degreeLevel === d ? "all" : d)}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                degreeLevel === d
                  ? "bg-primary text-primary-foreground dark:bg-primary/80"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Field of Study</Label>
        <Select value={fieldOfStudy} onValueChange={(v) => setFieldOfStudy(v || "all")}>
          <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="All Fields" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fields</SelectItem>
            {FIELDS_OF_STUDY.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Language</Label>
        <Select value={language} onValueChange={(v) => setLanguage(v || "all")}>
          <SelectTrigger className="w-full rounded-xl"><SelectValue placeholder="All Languages" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Languages</SelectItem>
            {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Max Tuition</Label>
        <Input type="number" placeholder="e.g. 20000" value={maxTuition} onChange={(e) => setMaxTuition(e.target.value)} className="rounded-xl" />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">GRE Requirement</Label>
        <Select value={greRequired} onValueChange={(v) => setGreRequired(v || "all")}>
          <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {GRE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Scholarship Available</Label>
          <Switch checked={scholarship} onCheckedChange={setScholarship} />
        </div>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Sort By</Label>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v || "ranking")}>
          <SelectTrigger className="w-full rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <>
          <Separator />
          <Button variant="ghost" size="sm" className="w-full gap-1.5 rounded-xl" onClick={onClear}>
            <X className="h-3.5 w-3.5" /> Clear filters ({activeCount})
          </Button>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  const router = useRouter();
  const { activeProfileId, profiles } = useAppStore();
  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
  const [view, setView] = useState<"all" | "saved">("all");
  const [detailProgram, setDetailProgram] = useState<Program | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Faculty search panel state
  const [facultyOpen, setFacultyOpen] = useState(false);
  const [facultyProgram, setFacultyProgram] = useState<Program | null>(null);
  const [facultyResults, setFacultyResults] = useState<FacultyMember[]>([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [addingFaculty, setAddingFaculty] = useState<string | null>(null); // name of faculty being added

  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user'|'bot', text: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatProgramInfo, setChatProgramInfo] = useState<any>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Cache: universityName → rankings array (grows, never resets)
  const [rankingCache, setRankingCache] = useState<Record<string, Array<{ source: string; rank: number; year: number | null }>>>({});
  const fetchingRef = useRef<Set<string>>(new Set());

  function fetchRankingFor(universityName: string) {
    if (rankingCache[universityName] !== undefined) return;
    if (fetchingRef.current.has(universityName)) return;
    fetchingRef.current.add(universityName);
    fetch(`/api/university-ranking?name=${encodeURIComponent(universityName)}`)
      .then((r) => r.json())
      .then((data) => {
        const rankings = Array.isArray(data.rankings) ? data.rankings : [];
        setRankingCache((prev) => ({ ...prev, [universityName]: rankings }));
      })
      .catch(() => {
        setRankingCache((prev) => ({ ...prev, [universityName]: [] }));
      })
      .finally(() => fetchingRef.current.delete(universityName));
  }

  // When programs list updates, kick off Wikipedia ranking fetches for new universities
  useEffect(() => {
    for (const p of programs) fetchRankingFor(p.universityName);
  }, [programs]);

  // Detail dialog rankings: pull from cache (already fetched) or wait
  const detailRankings = detailProgram ? (rankingCache[detailProgram.universityName] ?? null) : null;
  const detailRankingsLoading = detailProgram
    ? rankingCache[detailProgram.universityName] === undefined
    : false;

  // When detail dialog opens for a university not yet in cache, trigger its fetch
  useEffect(() => {
    if (detailProgram) fetchRankingFor(detailProgram.universityName);
  }, [detailProgram?.universityName]);

  const [isAiResults, setIsAiResults] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Accumulates every country seen across all searches — never resets
  const [knownCountries, setKnownCountries] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [countries, setCountries] = useState<string[]>([]);
  const [degreeLevel, setDegreeLevel] = useState("all");
  const [fieldOfStudy, setFieldOfStudy] = useState("all");
  const [language, setLanguage] = useState("all");
  const [maxTuition, setMaxTuition] = useState("");
  const [greRequired, setGreRequired] = useState("all");
  const [scholarship, setScholarship] = useState(false);
  const [sortBy, setSortBy] = useState("ranking");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 600);
    return () => clearTimeout(timer);
  }, [search]);

  const toggleCountry = useCallback((c: string) => {
    setCountries((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
  }, []);

  // Helper: merge new countries into the ever-growing knownCountries set
  const mergeCountries = useCallback((newPrograms: Program[]) => {
    const incoming = newPrograms.map((p) => p.universityCountry).filter(Boolean);
    if (incoming.length === 0) return;
    setKnownCountries((prev) => {
      const merged = [...new Set([...prev, ...incoming])].sort();
      return merged.length === prev.length ? prev : merged; // avoid re-render if nothing new
    });
  }, []);

  // availableCountries is the accumulated set — never empties on search reset
  const availableCountries = knownCountries;

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (countries.length > 0) count++;
    if (degreeLevel !== "all") count++;
    if (fieldOfStudy !== "all") count++;
    if (language !== "all") count++;
    if (maxTuition) count++;
    if (greRequired !== "all") count++;
    if (scholarship) count++;
    return count;
  }, [debouncedSearch, countries, degreeLevel, fieldOfStudy, language, maxTuition, greRequired, scholarship]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
    setCountries([]);
    setDegreeLevel("all");
    setFieldOfStudy("all");
    setLanguage("all");
    setMaxTuition("");
    setGreRequired("all");
    setScholarship(false);
    setSortBy("ranking");
  }, []);

  const handleSeeMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);

    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (countries.length > 0) params.set("country", countries.join(","));
    if (degreeLevel !== "all") params.set("degreeLevel", degreeLevel);
    if (fieldOfStudy !== "all") params.set("field", fieldOfStudy);
    if (language !== "all") params.set("language", language);
    if (maxTuition) params.set("maxTuition", maxTuition);
    if (greRequired !== "all") params.set("greRequired", greRequired);
    if (scholarship) params.set("scholarship", "true");

    const exclude = programs.map((p) => p.universityName).join(",");
    if (exclude) params.set("exclude", exclude);

    try {
      const res = await fetch(`/api/ai-search?${params.toString()}`);
      if (!res.ok || !res.body) {
        toast.error("Search failed. Please try again.");
        setLoadingMore(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let hadError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });

        let newline: number;
        while ((newline = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, newline).trim();
          buf = buf.slice(newline + 1);
          if (!line) continue;
          try {
            const parsed = JSON.parse(line) as Program & { error?: string };
            if ("error" in parsed) {
              if (!hadError) {
                hadError = true;
                const msg = parsed.error ?? "Search temporarily unavailable";
                toast.error(msg.includes("429") || msg.includes("overloaded") || msg.includes("rate")
                  ? "AI search is busy — please try again in a moment"
                  : `Search error: ${msg}`
                );
              }
              continue;
            }
            setPrograms((prev) => [...prev, parsed]);
            mergeCountries([parsed]);
          } catch { /* skip */ }
        }
      }
    } catch { /* network error */ }

    setLoadingMore(false);
  }, [loadingMore, programs, debouncedSearch, countries, degreeLevel, fieldOfStudy, language, maxTuition, greRequired, scholarship, mergeCountries]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (countries.length > 0) params.set("country", countries.join(","));
    if (degreeLevel !== "all") params.set("degreeLevel", degreeLevel);
    if (fieldOfStudy !== "all") params.set("field", fieldOfStudy);
    if (language !== "all") params.set("language", language);
    if (maxTuition) params.set("maxTuition", maxTuition);
    if (greRequired !== "all") params.set("greRequired", greRequired);
    if (scholarship) params.set("scholarship", "true");
    if (sortBy !== "ranking") params.set("sortBy", sortBy);

    const hasFilters = !!(
      debouncedSearch || countries.length > 0 || degreeLevel !== "all" ||
      fieldOfStudy !== "all" || language !== "all" || maxTuition ||
      greRequired !== "all" || scholarship
    );

    setLoading(true);
    setPrograms([]);
    setIsAiResults(hasFilters);

    if (!hasFilters) {
      fetch(`/api/programs?${params.toString()}`, { signal: controller.signal })
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setPrograms(data as Program[]);
            mergeCountries(data as Program[]);
          }
          setLoading(false);
        })
        .catch(() => { if (!controller.signal.aborted) setLoading(false); });
    } else {
      // Streaming AI search — render programs one by one as they arrive
      (async () => {
        try {
          const res = await fetch(`/api/ai-search?${params.toString()}`, { signal: controller.signal });
          if (!res.ok || !res.body) {
            toast.error("Search failed. Please try again.");
            setLoading(false);
            return;
          }

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buf = "";
          let hadError = false;

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buf += decoder.decode(value, { stream: true });

            let newline: number;
            while ((newline = buf.indexOf("\n")) !== -1) {
              const line = buf.slice(0, newline).trim();
              buf = buf.slice(newline + 1);
              if (!line) continue;
              try {
                const parsed = JSON.parse(line) as Program & { error?: string };
                if ("error" in parsed) {
                  if (!hadError) {
                    hadError = true;
                    const msg = parsed.error ?? "Search temporarily unavailable";
                    toast.error(msg.toLowerCase().includes("rate") || msg.includes("429")
                      ? "AI search is busy — please try again in a moment"
                      : `Search error: ${msg}`
                    );
                  }
                  continue;
                }
                setPrograms((prev) => [...prev, parsed]);
                mergeCountries([parsed]);
                setLoading(false);
              } catch { /* skip malformed line */ }
            }
          }
        } catch (e) {
          if (e instanceof Error && e.name !== "AbortError") {
            toast.error("Search failed. Please try again.");
          }
        }
        setLoading(false);
      })();
    }

    return () => controller.abort();
  }, [debouncedSearch, countries, degreeLevel, fieldOfStudy, language, maxTuition, greRequired, scholarship, sortBy]);

  useEffect(() => {
    fetch("/api/programs/saved")
      .then((r) => r.json())
      .then((data) => {
        setSavedIds(new Set(data.map((s: { programId: number }) => s.programId)));
      });
  }, []);

  const displayedPrograms = useMemo(() => {
    if (view === "saved") {
      return programs.filter((p) => savedIds.has(p.id));
    }
    return programs;
  }, [programs, view, savedIds]);

  const uniqueUniversities = useMemo(() => new Set(displayedPrograms.map((p) => p.universityId)).size, [displayedPrograms]);

  async function handleSave(programId: number) {
    if (savedIds.has(programId)) {
      await fetch(`/api/programs/saved?programId=${programId}`, { method: "DELETE" });
      setSavedIds((prev) => { const next = new Set(prev); next.delete(programId); return next; });
      toast.success("Program removed from saved");
    } else {
      await fetch("/api/programs/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId }),
      });
      setSavedIds((prev) => new Set(prev).add(programId));
      toast.success("Program saved");
    }
  }

  async function handleSearchFaculty(program?: Program) {
    const prog = program ?? detailProgram;
    if (!prog) return;
    setFacultyProgram(prog);
    setFacultyResults([]);
    setFacultyLoading(true);
    setFacultyOpen(true);
    setDetailProgram(null); // close detail dialog

    // Get active profile for personalised match scoring
    const { profiles, activeProfileId: apid } = useAppStore.getState();
    const activeProfile = profiles.find((p) => p.id === apid);

    const params = new URLSearchParams({
      university: prog.universityName,
      field: prog.fieldOfStudy,
      program: prog.name,
    });
    if (activeProfile?.fieldOfStudy) params.set("userField", activeProfile.fieldOfStudy);
    if (activeProfile?.degreeLevel) params.set("degreeTarget", activeProfile.degreeLevel);

    try {
      const res = await fetch(`/api/search-faculty?${params.toString()}`);
      if (!res.ok || !res.body) {
        toast.error("Faculty search unavailable");
        setFacultyLoading(false);
        return;
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          try {
            const parsed = JSON.parse(line);
            if ("error" in parsed) {
              toast.error(parsed.error ?? "Faculty search temporarily unavailable");
              continue;
            }
            // Append and keep sorted by matchScore desc
            setFacultyResults((prev) => {
              const next = [...prev, parsed as FacultyMember];
              return next.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
            });
          } catch { /* skip */ }
        }
      }
    } catch {
      toast.error("Faculty search failed");
    }
    setFacultyLoading(false);
  }

  async function handleAddFacultyToSupervisors(faculty: FacultyMember) {
    if (!facultyProgram) return;
    setAddingFaculty(faculty.name);
    try {
      const res = await fetch("/api/supervisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: faculty.name,
          email: faculty.email ?? "",
          university: facultyProgram.universityName,
          department: faculty.department,
          title: faculty.title,
          researchInterests: faculty.researchInterests ?? "",
          personalWebsiteUrl: faculty.personalWebsiteUrl ?? "",
          status: "not_contacted",
          profileId: activeProfileId ?? null,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      toast.success(`${faculty.name} added to Supervisors`, {
        action: {
          label: "View",
          onClick: () => router.push(`/supervisors/${created.id}`),
        },
      });
    } catch {
      toast.error("Failed to add supervisor");
    }
    setAddingFaculty(null);
  }

  function toggleChat() {
    if (detailProgram) {
      setChatProgramInfo({
        id: detailProgram.id,
        name: detailProgram.name,
        universityName: detailProgram.universityName,
        universityCountry: detailProgram.universityCountry,
        degreeLevel: detailProgram.degreeLevel,
        fieldOfStudy: detailProgram.fieldOfStudy,
        description: detailProgram.description,
        tuitionAmount: detailProgram.tuitionAmount,
        tuitionCurrency: detailProgram.tuitionCurrency,
        tuitionPeriod: detailProgram.tuitionPeriod,
        requiredSkills: detailProgram.requiredSkills,
        prerequisites: detailProgram.prerequisites,
        researchAreas: detailProgram.researchAreas,
        ranking: detailProgram.ranking ?? null,
        intakes: detailProgram.intakes ?? [],
        documentsRequired: detailProgram.documentsRequired ?? [],
        links: detailProgram.links ?? [],
        sourceUrl: detailProgram.sourceUrl ?? null,
      });
    }
    setDetailProgram(null);
    setChatMessages([]);
    setChatInput("");
    setChatOpen(true);
  }

  async function sendChatMessage() {
    if (!chatInput.trim() || !chatProgramInfo) return;
    const userMsg = chatInput.trim();
    const tempId = Date.now();
    setChatMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setChatMessages((m) => [...m, { role: 'bot', text: "Typing..." }]);
    setChatInput("");
    
    try {
      const res = await fetch(`/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId: chatProgramInfo.id,
          programName: chatProgramInfo.name,
          universityName: chatProgramInfo.universityName,
          universityCountry: chatProgramInfo.universityCountry ?? null,
          degreeLevel: chatProgramInfo.degreeLevel,
          fieldOfStudy: chatProgramInfo.fieldOfStudy,
          description: chatProgramInfo.description ?? null,
          tuitionAmount: chatProgramInfo.tuitionAmount,
          tuitionCurrency: chatProgramInfo.tuitionCurrency,
          tuitionPeriod: chatProgramInfo.tuitionPeriod,
          requiredSkills: chatProgramInfo.requiredSkills ?? null,
          prerequisites: chatProgramInfo.prerequisites ?? null,
          researchAreas: chatProgramInfo.researchAreas ?? null,
          ranking: chatProgramInfo.ranking ?? null,
          intakes: chatProgramInfo.intakes ?? [],
          documentsRequired: chatProgramInfo.documentsRequired ?? [],
          links: chatProgramInfo.links ?? [],
          sourceUrl: chatProgramInfo.sourceUrl ?? null,
          message: userMsg,
        }),
      });

      if (!res.ok || !res.body) {
        setChatMessages((prev) => {
          const lastIdx = prev.length - 1;
          if (prev[lastIdx]?.role === 'bot' && prev[lastIdx]?.text === "Typing...") {
            return [...prev.slice(0, -1), { role: 'bot', text: 'Sorry, I couldn\'t fetch an answer right now. Please try again.' }];
          }
          return prev;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";
      const messagesRef = { current: [...chatMessages, { role: 'user' as const, text: userMsg }, { role: 'bot' as const, text: "Typing..." }] };
      let lastFlush = Date.now();

      const flush = () => {
        setChatMessages([...messagesRef.current.slice(0, -1), { role: 'bot', text: fullReply }]);
        messagesRef.current = [...messagesRef.current.slice(0, -1), { role: 'bot', text: fullReply }];
        lastFlush = Date.now();
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullReply += decoder.decode(value, { stream: true });
        
        // Throttle state updates to every 80ms to prevent typing lag
        if (Date.now() - lastFlush > 80) {
          flush();
        }
      }
      // Final flush
      flush();
    } catch {
      setChatMessages((prev) => {
        const lastIdx = prev.length - 1;
        if (prev[lastIdx]?.role === 'bot' && prev[lastIdx]?.text === "Typing...") {
          return [...prev.slice(0, -1), { role: 'bot', text: 'Error contacting the chat service.' }];
        }
        return prev;
      });
    }
  }

  async function handleAddToPipeline(program: Program) {
    setAddingId(program.id);
    try {
      const nextIntake = getNextIntake(program.intakes);

      const appRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: program.universityId,
          programName: program.name,
          degreeLevel: program.degreeLevel,
          intakeTerm: nextIntake?.intakeTerm || "Fall",
          intakeYear: nextIntake?.intakeYear || new Date().getFullYear() + 1,
          applicationDeadline: nextIntake?.applicationDeadline || null,
          decisionExpectedDate: nextIntake?.decisionExpectedDate || null,
          tuitionAmount: program.tuitionAmount,
          tuitionCurrency: program.tuitionCurrency,
          tuitionPeriod: program.tuitionPeriod,
          applicationFeeAmount: program.applicationFeeAmount,
          applicationFeeCurrency: program.applicationFeeCurrency,
          ieltsRequired: program.ieltsMin,
          toeflRequired: program.toeflMin,
          greRequired: program.greRequired,
          minGpa: program.gpaMin,
          sourceUrl: program.sourceUrl,
          status: "researching",
          priority: "medium",
        }),
      });
      const app = await appRes.json();

      const starterTasks = await generateStarterTasks(program.id);
      await Promise.all(
        starterTasks.map((title) =>
          fetch("/api/tasks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ applicationId: app.id, title }),
          })
        )
      );

      if (nextIntake?.applicationDeadline) {
        await fetch("/api/deadlines", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applicationId: app.id,
            title: `${program.universityName} — ${program.name} Deadline`,
            type: "application",
            dueDate: nextIntake.applicationDeadline,
          }),
        });
      }

      await fetch("/api/xp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionType: "added_to_pipeline",
          xpAwarded: 25,
          relatedEntityType: "application",
          relatedEntityId: app.id,
        }),
      });

      toast.success(`Added ${program.universityName} to your pipeline + ${starterTasks.length} starter tasks created`, {
        action: { label: "View", onClick: () => router.push(`/applications/${app.id}`) },
      });
    } catch {
      toast.error("Failed to add program to pipeline");
    } finally {
      setAddingId(null);
    }
  }

  const filterPanelProps = {
    search, setSearch, availableCountries, countries, toggleCountry, degreeLevel, setDegreeLevel,
    fieldOfStudy, setFieldOfStudy, language, setLanguage, maxTuition, setMaxTuition,
    greRequired, setGreRequired, scholarship, setScholarship, sortBy, setSortBy,
    onClear: clearFilters, activeCount: activeFilterCount,
  };

  return (
    <div className="flex gap-6">
      <aside className="hidden lg:block w-[280px] shrink-0">
        <div className="sticky top-6 rounded-xl border border-border bg-muted/30 flex flex-col overflow-hidden" style={{ maxHeight: "calc(100vh - 5rem)" }}>
          <div className="px-4 pt-4 pb-2 shrink-0">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </h2>
          </div>
          <div className="overflow-y-auto flex-1 px-4 pb-4">
            <FilterPanel {...filterPanelProps} />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">University Search</h1>
              {isAiResults && !loading && (
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="h-3 w-3" /> AI
                </span>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {loading
                ? (isAiResults ? "Searching with AI… this may take a moment" : "Loading…")
                : `Found ${displayedPrograms.length} program${displayedPrograms.length !== 1 ? "s" : ""} across ${uniqueUniversities} universit${uniqueUniversities !== 1 ? "ies" : "y"}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-2xl border-0 bg-white p-0.5">
              <Button variant={view === "all" ? "default" : "ghost"} size="sm" className="rounded-lg text-xs" onClick={() => setView("all")}>
                All Programs
              </Button>
              <Button variant={view === "saved" ? "default" : "ghost"} size="sm" className="rounded-lg text-xs gap-1" onClick={() => setView("saved")}>
                <Bookmark className="h-3.5 w-3.5" /> Saved ({savedIds.size})
              </Button>
            </div>
            <Button variant="outline" size="sm" className="lg:hidden rounded-xl gap-1.5" onClick={() => setMobileFiltersOpen(true)}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : displayedPrograms.length === 0 ? (
          <Card className="rounded-2xl border-0 card-shadow">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                {view === "saved" ? "No saved programs" : "No programs found"}
              </h3>
              <p className="text-muted-foreground text-sm">
                {view === "saved" ? "Save programs to track them here" : "Try adjusting your filters or search terms"}
              </p>
              {activeFilterCount > 0 && view === "all" && (
                <Button variant="outline" className="mt-4 rounded-xl gap-1.5" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" /> Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {displayedPrograms.map((program) => {
              const { score: fitScore, dimensions: fitDimensions, prerequisites: fitPrereqs } = calculateProfileFitScore(
                {
                  universityCountry: program.universityCountry,
                  degreeLevel: program.degreeLevel,
                  ieltsMin: program.ieltsMin,
                  toeflMin: program.toeflMin,
                  gpaMin: program.gpaMin,
                  greRequired: program.greRequired,
                  tuitionAmount: program.tuitionAmount,
                  tuitionCurrency: program.tuitionCurrency,
                  scholarshipAvailable: program.scholarshipAvailable,
                  requiredSkills: safeParseJsonArray(program.requiredSkills),
                  prerequisites: safeParseJsonArray(program.prerequisites),
                  researchAreas: safeParseJsonArray(program.researchAreas),
                },
                activeProfile
                  ? {
                      targetCountries: activeProfile.targetCountries,
                      degreeLevel: activeProfile.degreeLevel,
                      ieltsScore: activeProfile.ieltsScore,
                      toeflScore: activeProfile.toeflScore,
                      gpa: activeProfile.gpa,
                      budgetAmount: activeProfile.budgetAmount,
                      budgetCurrency: activeProfile.budgetCurrency,
                    }
                  : null,
              );
              const isSaved = savedIds.has(program.id);
              const isAdding = addingId === program.id;

              const now = new Date();
              const upcomingIntakes = (program.intakes ?? [])
                .slice()
                .sort((a, b) => {
                  if (!a.applicationDeadline) return 1;
                  if (!b.applicationDeadline) return -1;
                  return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime();
                })
                .slice(0, 3);

              // Pull QS ranking from cache (null = not yet fetched, [] = fetched but none found)
              const cachedRankings = rankingCache[program.universityName];
              const topRanking = cachedRankings?.[0] ?? null; // QS first (sorted)

              return (
                <Card key={program.id} size="sm" className="rounded-2xl border-0 card-shadow transition-all hover:border-primary/40 hover:shadow-md">
                  <CardHeader className="gap-1.5 pb-0">
                    <CardTitle className="pr-7 text-sm leading-tight line-clamp-2">{program.name}</CardTitle>
                    <CardDescription className="flex items-start gap-1.5 text-xs leading-snug line-clamp-2">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {program.universityName} — {program.universityCity}, {program.universityCountry}
                    </CardDescription>
                    <CardAction>
                      <button onClick={() => handleSave(program.id)} className="text-muted-foreground hover:text-indigo-600 transition-colors">
                        {isSaved ? <BookmarkCheck className="h-4.5 w-4.5 text-indigo-600" /> : <Bookmark className="h-4.5 w-4.5" />}
                      </button>
                    </CardAction>
                  </CardHeader>
                  <CardContent className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-1.5 pr-1">
                        <Badge variant="secondary" className="text-[10px]">
                          <GraduationCap className="h-3 w-3 mr-0.5" /> {program.degreeLevel}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          <Globe className="h-3 w-3 mr-0.5" /> {program.languageOfInstruction}
                        </Badge>
                        {program.scholarshipAvailable && (
                          <Badge className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <Sparkles className="h-3 w-3 mr-0.5" /> Scholarship
                          </Badge>
                        )}
                        {topRanking && (
                          <Badge className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 gap-0.5">
                            <Medal className="h-3 w-3" />
                            #{topRanking.rank}
                            <span className="opacity-60 ml-0.5">
                              {topRanking.source.includes("QS") ? "QS" :
                               topRanking.source.includes("Times") ? "THE" :
                               topRanking.source.includes("ARWU") ? "ARWU" : ""}
                            </span>
                          </Badge>
                        )}
                        {/* Spinner while Wikipedia fetch is in progress */}
                        {cachedRankings === undefined && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          </span>
                        )}
                      </div>
                      <FitScoreRing score={fitScore} dimensions={fitDimensions} prerequisites={fitPrereqs} noProfile={!activeProfile} />
                    </div>

                    <div className="space-y-1 text-xs leading-tight text-muted-foreground">
                      {program.tuitionAmount != null && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="h-3 w-3 shrink-0" />
                          {formatCurrency(program.tuitionAmount, program.tuitionCurrency || "USD")}
                          {program.tuitionPeriod === "per_year" ? "/yr" : " total"}
                        </div>
                      )}
                      {upcomingIntakes.length > 0 && (
                        <div className="space-y-0.5">
                          {upcomingIntakes.map((intake, idx) => {
                            const isPast = intake.applicationDeadline && new Date(intake.applicationDeadline) < now;
                            return (
                              <div key={intake.id} className={cn("flex items-center gap-1.5", isPast && "opacity-50 line-through")}>
                                {idx === 0 ? <Calendar className="h-3 w-3 shrink-0" /> : <span className="w-3" />}
                                <span>{intake.intakeTerm} {intake.intakeYear}</span>
                                {intake.applicationDeadline && (
                                  <span className={cn("ml-auto", !isPast && new Date(intake.applicationDeadline).getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000 && "text-red-500 font-medium")}>
                                    Due {new Date(intake.applicationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {program.ieltsMin != null && (
                        <Badge variant="outline" className="text-[10px]">IELTS ≥{program.ieltsMin}</Badge>
                      )}
                      {program.toeflMin != null && (
                        <Badge variant="outline" className="text-[10px]">TOEFL ≥{program.toeflMin}</Badge>
                      )}
                      {program.gpaMin != null && (
                        <Badge variant="outline" className="text-[10px]">GPA ≥{program.gpaMin}</Badge>
                      )}
                      {program.greRequired && (
                        <Badge variant="outline" className="text-[10px]">GRE Required</Badge>
                      )}
                    </div>

                    {program.links && program.links.length > 0 && (
                      <div className="flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                        {program.links.map((lk) => (
                          <a
                            key={lk.u}
                            href={lk.u}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            {lk.l}
                          </a>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-[minmax(0,1fr)_2rem_minmax(0,1fr)] items-center gap-1.5 pt-1">
                      <Button size="sm" variant="outline" className="min-w-0 rounded-lg text-xs h-8 px-2" onClick={() => setDetailProgram(program)}>
                        <Eye className="h-3.5 w-3.5 mr-1" /> Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 rounded-lg border-indigo-200 p-0 text-xs text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                        onClick={() => handleSearchFaculty(program)}
                        title="Search Faculty"
                      >
                        <Users2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" className="min-w-0 rounded-lg text-xs h-8 px-2 bg-primary hover:bg-primary/90" disabled={isAdding} onClick={() => handleAddToPipeline(program)}>
                        {isAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
                        <span className="truncate">Pipeline</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {isAiResults && !loading && displayedPrograms.length > 0 && view === "all" && (
          <div className="flex justify-center pt-2 pb-4">
            <Button
              variant="outline"
              className="rounded-xl gap-2 px-8"
              disabled={loadingMore}
              onClick={handleSeeMore}
            >
              {loadingMore ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Loading more...</>
              ) : (
                "See More"
              )}
            </Button>
          </div>
        )}
      </main>

      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-[300px] p-0">
          <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filters
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-4rem)]">
            <div className="p-4">
              <FilterPanel {...filterPanelProps} />
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={!!detailProgram} onOpenChange={(open) => { if (!open) setDetailProgram(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailProgram && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg">{detailProgram.name}</DialogTitle>
                <DialogDescription className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {detailProgram.universityName} — {detailProgram.universityCity}, {detailProgram.universityCountry}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {detailProgram.description && (
                  <div className="rounded-xl border border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex gap-2.5">
                    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-1">Heads Up</p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">{detailProgram.description}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Degree</p>
                    <p className="text-sm font-medium">{detailProgram.degreeLevel}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Field</p>
                    <p className="text-sm font-medium">{detailProgram.fieldOfStudy}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Language</p>
                    <p className="text-sm font-medium">{detailProgram.languageOfInstruction}</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Duration</p>
                    <p className="text-sm font-medium">{detailProgram.durationMonths ? `${detailProgram.durationMonths} months` : "N/A"}</p>
                  </div>
                  {/* Real rankings from Wikipedia */}
                  {(detailRankingsLoading || (detailRankings && detailRankings.length > 0)) && (
                    <div className="col-span-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Medal className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                        <p className="text-[10px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-medium">Global Rankings</p>
                        <span className="ml-auto text-[10px] text-muted-foreground">via Wikipedia</span>
                      </div>
                      {detailRankingsLoading ? (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Fetching rankings…
                        </div>
                      ) : detailRankings && detailRankings.length > 0 ? (
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                          {detailRankings.map((r) => (
                            <div key={r.source} className="flex items-baseline gap-1">
                              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">#{r.rank}</span>
                              <span className="text-[11px] text-muted-foreground">{r.source}{r.year ? ` ${r.year}` : ""}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Tuition & Fees</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Tuition</p>
                      <p className="text-sm font-medium">
                        {detailProgram.tuitionAmount != null
                          ? `${formatCurrency(detailProgram.tuitionAmount, detailProgram.tuitionCurrency || "USD")}${detailProgram.tuitionPeriod === "per_year" ? "/yr" : ""}`
                          : "N/A"}
                      </p>
                    </div>
                    <div className="rounded-xl bg-muted/50 p-3 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Application Fee</p>
                      <p className="text-sm font-medium">
                        {detailProgram.applicationFeeAmount != null
                          ? formatCurrency(detailProgram.applicationFeeAmount, detailProgram.applicationFeeCurrency || "USD")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  {detailProgram.scholarshipAvailable && (
                    <Badge className="mt-2 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      <Sparkles className="h-3 w-3 mr-1" /> Scholarship available
                    </Badge>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="text-sm font-semibold mb-2">Requirements</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {detailProgram.ieltsMin != null && <Badge variant="outline">IELTS ≥ {detailProgram.ieltsMin}</Badge>}
                    {detailProgram.toeflMin != null && <Badge variant="outline">TOEFL ≥ {detailProgram.toeflMin}</Badge>}
                    {detailProgram.gpaMin != null && <Badge variant="outline">GPA ≥ {detailProgram.gpaMin}</Badge>}
                    {detailProgram.greRequired != null && <Badge variant="outline">GRE {detailProgram.greRequired ? "Required" : "Not Required"}</Badge>}
                  </div>
                </div>

                {detailProgram.intakes && detailProgram.intakes.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Intakes</h4>
                      <div className="space-y-2">
                        {detailProgram.intakes.map((intake) => (
                          <div key={intake.id} className="rounded-xl bg-muted/50 p-3 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{intake.intakeTerm} {intake.intakeYear}</span>
                              {intake.applicationDeadline && (
                                <span className="text-xs text-muted-foreground">
                                  Deadline: {new Date(intake.applicationDeadline).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            {intake.applicationOpenDate && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Opens: {new Date(intake.applicationOpenDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {detailProgram.documentsRequired && detailProgram.documentsRequired.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Documents Required</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {detailProgram.documentsRequired.map((doc) => (
                          <Badge key={doc.id} variant="secondary" className="text-xs">
                            <FileText className="h-3 w-3 mr-1" />
                            {doc.documentType}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(detailProgram.links?.length || detailProgram.sourceUrl) && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold mb-2">Useful Links</h4>
                      <div className="flex flex-wrap gap-3">
                        {detailProgram.links && detailProgram.links.length > 0
                          ? detailProgram.links.map((lk) => (
                              <a
                                key={lk.u}
                                href={lk.u}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" /> {lk.l}
                              </a>
                            ))
                          : (
                            <a
                              href={detailProgram.sourceUrl!}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                            >
                              <ExternalLink className="h-3.5 w-3.5" /> Visit program page
                            </a>
                          )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <DialogFooter className="flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5"
                  onClick={() => handleSearchFaculty(detailProgram ?? undefined)}
                >
                  <Users2 className="h-4 w-4" /> Search Faculty
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5"
                  onClick={toggleChat}
                >
                  <MessageSquare className="h-4 w-4" /> Chat
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl gap-1.5"
                  onClick={() => handleSave(detailProgram.id)}
                >
                  {savedIds.has(detailProgram.id) ? (
                    <><BookmarkCheck className="h-4 w-4" /> Saved</>
                  ) : (
                    <><Bookmark className="h-4 w-4" /> Save</>
                  )}
                </Button>
                <Button
                  className="rounded-xl gap-1.5 bg-primary hover:bg-primary/90"
                  disabled={addingId === detailProgram.id}
                  onClick={() => handleAddToPipeline(detailProgram)}
                >
                  {addingId === detailProgram.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add to Pipeline
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Faculty Search Dialog */}
      <Dialog open={facultyOpen} onOpenChange={(open) => { if (!open) setFacultyOpen(false); }}>
        <DialogContent className="sm:max-w-2xl flex flex-col gap-0 p-0 max-h-[88vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b shrink-0">
            <button
              onClick={() => { setFacultyOpen(false); if (facultyProgram) setDetailProgram(facultyProgram); }}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Back to program"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold flex items-center gap-1.5 leading-tight">
                <Users2 className="h-4 w-4 text-indigo-500 shrink-0" />
                Faculty — {facultyProgram?.universityName}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {facultyProgram?.fieldOfStudy} · {facultyProgram?.name}
                {" · "}AI-fetched — verify on official faculty pages
              </p>
            </div>
            {facultyResults.length > 0 && (
              <span className="shrink-0 text-xs text-muted-foreground">
                {facultyResults.length} found · sorted by match
              </span>
            )}
          </div>

          {/* Scrollable body */}
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-3">
            {facultyLoading && facultyResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-indigo-500" />
                <p className="text-sm">Searching faculty directory…</p>
              </div>
            ) : facultyResults.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-2 text-muted-foreground">
                <Users2 className="h-10 w-10 opacity-20" />
                <p className="text-sm">No faculty found</p>
              </div>
            ) : (
              <>
                {facultyLoading && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Fetching more…
                  </div>
                )}
                {facultyResults.map((faculty, idx) => {
                  const score = faculty.matchScore ?? 0;
                  const scoreColor =
                    score >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                    score >= 55 ? "text-amber-600 dark:text-amber-400" :
                    "text-muted-foreground";
                  const scoreBg =
                    score >= 80 ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800" :
                    score >= 55 ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800" :
                    "bg-muted/50 border-border";

                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-border bg-card p-4 flex gap-3 items-start hover:border-indigo-200 dark:hover:border-indigo-700 transition-colors"
                    >
                      {/* Initials avatar */}
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-300">
                          {faculty.name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("")}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Name row */}
                        <div className="flex items-start gap-2 justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-sm leading-tight">{faculty.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                              {faculty.title} · {faculty.department}
                            </p>
                            {faculty.labName && (
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 flex items-center gap-1">
                                <BookOpen className="h-3 w-3 shrink-0" />
                                <span className="truncate">{faculty.labName}</span>
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Match score pill */}
                            {faculty.matchScore != null && (
                              <div className={cn("flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", scoreBg, scoreColor)}>
                                <Sparkles className="h-2.5 w-2.5" />
                                {faculty.matchScore}%
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-xs h-7 gap-1 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                              disabled={addingFaculty === faculty.name}
                              onClick={() => handleAddFacultyToSupervisors(faculty)}
                            >
                              {addingFaculty === faculty.name ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <UserPlus className="h-3 w-3" />
                              )}
                              Add
                            </Button>
                          </div>
                        </div>

                        {/* Match reason */}
                        {faculty.matchReason && (
                          <p className="mt-2 text-xs text-muted-foreground leading-relaxed italic border-l-2 border-indigo-200 dark:border-indigo-700 pl-2">
                            {faculty.matchReason}
                          </p>
                        )}

                        {/* Research interest chips */}
                        {faculty.researchInterests && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {faculty.researchInterests.split(",").map((interest) => (
                              <span
                                key={interest}
                                className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
                              >
                                {interest.trim()}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Links row */}
                        <div className="mt-2.5 flex flex-wrap gap-3">
                          {faculty.email && (
                            <a
                              href={`mailto:${faculty.email}`}
                              className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-indigo-600 transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Mail className="h-3 w-3" />
                              {faculty.email}
                            </a>
                          )}
                          {faculty.personalWebsiteUrl && (
                            <a
                              href={faculty.personalWebsiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Globe className="h-3 w-3" /> Website
                            </a>
                          )}
                          {faculty.scholarUrl && (
                            <a
                              href={faculty.scholarUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <BookOpen className="h-3 w-3" /> Scholar
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t bg-muted/30 shrink-0">
            <p className="text-[11px] text-muted-foreground text-center">
              ⚠ AI-fetched results — always verify on official university faculty pages before reaching out
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {chatOpen && (
        <div className="fixed right-4 bottom-4 w-[340px] rounded-2xl z-50 flex flex-col overflow-hidden shadow-2xl border border-border/60 bg-card"
          style={{ maxHeight: "min(520px, calc(100vh - 5rem))" }}>

          {/* Header — indigo gradient */}
          <div className="flex items-center gap-3 px-4 py-3 shrink-0"
            style={{ background: "linear-gradient(135deg, #022226 0%, #6366f1 100%)" }}>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/20 shrink-0">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white leading-tight">Program Chat</p>
              {chatProgramInfo && (
                <p className="text-[10px] text-white/70 truncate leading-tight mt-0.5">
                  {chatProgramInfo.universityName} · {chatProgramInfo.name}
                </p>
              )}
            </div>
            <button
              aria-label="Close chat"
              onClick={() => setChatOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-8 text-center">
                <div className="h-10 w-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ask anything about this program</p>
                  <p className="text-xs text-muted-foreground mt-1">Research focus, admission tips, career outcomes…</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center mt-1">
                  {["Research focus?", "Admission tips?", "Career outcomes?"].map((q) => (
                    <button
                      key={q}
                      onClick={() => { setChatInput(q); }}
                      className="rounded-full border border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-[11px] font-medium text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((m, idx) => {
              const isUser = m.role === "user";
              const isTyping = !isUser && m.text === "Typing...";
              // Warn if bot mentions specific dates or currency figures — may be hallucinated
              const hasSpecificClaim = !isUser && !isTyping &&
                /\b(january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}\/\d{1,2}|\$[\d,]+|CAD\s*[\d,]+|USD\s*[\d,]+|\d{1,3},\d{3})\b/i.test(m.text);
              return (
                <div key={idx} className={cn("flex gap-2 items-end", isUser ? "flex-row-reverse" : "flex-row")}>
                  {!isUser && (
                    <div className="h-6 w-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0 mb-0.5">
                      <Sparkles className="h-3 w-3 text-indigo-500" />
                    </div>
                  )}
                  <div className={cn("max-w-[80%] flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
                    <div
                      className={cn(
                        "rounded-2xl px-3 py-2 text-sm leading-relaxed break-words",
                        isUser
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      )}
                    >
                      {isTyping ? (
                        <span className="flex items-center gap-1 h-4">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </span>
                      ) : m.text}
                    </div>
                    {hasSpecificClaim && (
                      <div className="flex items-center gap-1 px-1">
                        <AlertCircle className="h-3 w-3 text-amber-500 shrink-0" />
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">Verify on the official program page</span>
                        {chatProgramInfo?.sourceUrl && (
                          <a href={chatProgramInfo.sourceUrl} target="_blank" rel="noopener noreferrer"
                            className="text-[10px] text-indigo-500 hover:underline ml-0.5">↗</a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={chatMessagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-border/60 shrink-0">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-300/40 transition-all">
              <input
                placeholder="Ask a question…"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } }}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
              <button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || !chatProgramInfo}
                className="h-7 w-7 flex items-center justify-center rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
