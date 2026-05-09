"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { cn, supervisorResearchMatch } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Plus, LayoutGrid, TableIcon, Search, Filter, ExternalLink,
  Mail, AlertTriangle, Clock, User, GraduationCap, Loader2,
  Globe, BookOpen, ChevronRight, Sparkles,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Supervisor = {
  id: number;
  profileId: number | null;
  name: string;
  email: string;
  university: string;
  department: string | null;
  title: string | null;
  researchInterests: string | null;
  personalWebsiteUrl: string | null;
  status: SupervisorStatus;
  firstContactedAt: string | null;
  lastContactedAt: string | null;
  lastResponseAt: string | null;
  notes: string | null;
  nextAction: string;
  nextActionUrgent: boolean;
  daysSinceLastContact: number | null;
  followUpCount: number;
  linkedApplications: Array<{
    applicationId: number;
    universityName: string;
    programName: string;
    status: string;
  }>;
  eventCount: number;
};

type SupervisorStatus =
  | "not_contacted" | "emailed" | "replied_positive" | "replied_neutral"
  | "replied_declined" | "meeting_scheduled" | "meeting_completed" | "cold";

type Application = { id: number; universityName: string; programName: string };

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<SupervisorStatus, { label: string; color: string }> = {
  not_contacted:    { label: "Not Contacted",   color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
  emailed:          { label: "Emailed",          color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  replied_positive: { label: "Replied — Positive", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  replied_neutral:  { label: "Replied — Neutral", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
  replied_declined: { label: "Declined",         color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  meeting_scheduled:{ label: "Meeting Scheduled", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  meeting_completed:{ label: "Meeting Done",     color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300" },
  cold:             { label: "Cold",             color: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG) as SupervisorStatus[];

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: SupervisorStatus }) {
  const { label, color } = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_contacted;
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", color)}>
      {label}
    </span>
  );
}

function NextActionBadge({ label, urgent }: { label: string; urgent: boolean }) {
  if (!label || label === "No action needed" || label === "No action (cold)") {
    return <span className="text-xs text-muted-foreground">{label}</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        urgent
          ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      )}
    >
      {urgent && <AlertTriangle className="h-3 w-3" />}
      {label}
    </span>
  );
}

// ── Add Supervisor Modal ───────────────────────────────────────────────────────

function AddSupervisorModal({
  open,
  onClose,
  onCreated,
  applications,
  activeProfileId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (s: Supervisor) => void;
  applications: Application[];
  activeProfileId: number | null;
}) {
  const [form, setForm] = useState({
    name: "", email: "", university: "", department: "", program: "",
    title: "", researchInterests: "", personalWebsiteUrl: "", notes: "",
    status: "not_contacted" as SupervisorStatus,
  });
  const [linkedAppIds, setLinkedAppIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  function toggle(id: number) {
    setLinkedAppIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.university) return;
    setSaving(true);
    try {
      const res = await fetch("/api/supervisors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, profileId: activeProfileId, applicationIds: linkedAppIds }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      toast.success(`${created.name} added!`);
      onCreated(created);
      onClose();
      setForm({ name: "", email: "", university: "", department: "", program: "", title: "", researchInterests: "", personalWebsiteUrl: "", notes: "", status: "not_contacted" });
      setLinkedAppIds([]);
    } catch {
      toast.error("Failed to add supervisor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Supervisor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="Dr. Jane Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Email *</Label>
              <Input type="email" placeholder="j.smith@university.edu" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>University *</Label>
              <Input placeholder="University of Toronto" value={form.university} onChange={(e) => setForm({ ...form, university: e.target.value })} required />
            </div>
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input placeholder="Associate Professor" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Input placeholder="Dept. of Computer Science" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Program / Lab</Label>
              <Input placeholder="Machine Learning Lab" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Research Interests</Label>
            <Input placeholder="Reinforcement learning, robotics, multi-agent systems" value={form.researchInterests} onChange={(e) => setForm({ ...form, researchInterests: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Personal Website</Label>
              <Input placeholder="https://..." value={form.personalWebsiteUrl} onChange={(e) => setForm({ ...form, personalWebsiteUrl: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SupervisorStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Notes (papers read, talking points)</Label>
            <Textarea placeholder="Read their 2024 paper on hierarchical RL. Ask about the follow-up work..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} />
          </div>
          {applications.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Applications</Label>
              <div className="rounded-xl border border-border max-h-36 overflow-y-auto divide-y divide-border">
                {applications.map((app) => (
                  <label key={app.id} className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox
                      checked={linkedAppIds.includes(app.id)}
                      onCheckedChange={() => toggle(app.id)}
                    />
                    <span className="text-sm">{app.universityName} — {app.programName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.name || !form.email || !form.university}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Add Supervisor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SupervisorsPage() {
  const { activeProfileId, profiles } = useAppStore();
  const router = useRouter();
  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );

  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"table" | "card">("table");
  const [showAdd, setShowAdd] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterUniversity, setFilterUniversity] = useState<string>("all");
  const [filterNeedsFollowUp, setFilterNeedsFollowUp] = useState(false);

  // Open add modal if ?new=true (e.g. from command palette)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") {
        setShowAdd(true);
        // Remove the query param without reload
        const url = new URL(window.location.href);
        url.searchParams.delete("new");
        window.history.replaceState({}, "", url.toString());
      }
    }
  }, []);

  useEffect(() => {
    const params = activeProfileId ? `?profileId=${activeProfileId}` : "";
    Promise.all([
      fetch(`/api/supervisors${params}`).then((r) => r.json()),
      fetch("/api/applications").then((r) => r.json()),
    ]).then(([sups, apps]) => {
      setSupervisors(sups);
      setApplications(apps);
      setLoading(false);
    });
  }, [activeProfileId]);

  const universities = useMemo(
    () => [...new Set(supervisors.map((s) => s.university))].sort(),
    [supervisors]
  );

  const filtered = useMemo(() => {
    return supervisors.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
          !s.university.toLowerCase().includes(search.toLowerCase()) &&
          !s.researchInterests?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus !== "all" && s.status !== filterStatus) return false;
      if (filterUniversity !== "all" && s.university !== filterUniversity) return false;
      if (filterNeedsFollowUp && !s.nextActionUrgent) return false;
      return true;
    });
  }, [supervisors, search, filterStatus, filterUniversity, filterNeedsFollowUp]);

  const urgentCount = supervisors.filter((s) => s.nextActionUrgent).length;

  function handleCreated(s: Supervisor) {
    setSupervisors((prev) => [...prev, s]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading supervisors...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Supervisors</h1>
          <p className="text-muted-foreground">
            {supervisors.length} supervisor{supervisors.length !== 1 ? "s" : ""}
            {urgentCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                <AlertTriangle className="h-3 w-3" />
                {urgentCount} need{urgentCount === 1 ? "s" : ""} follow-up
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-xl"
            onClick={() => setView("table")}
          >
            <TableIcon className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "card" ? "secondary" : "ghost"}
            size="icon"
            className="rounded-xl"
            onClick={() => setView("card")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button className="gap-2 rounded-xl" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Supervisor
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, university, interests..."
            className="pl-9 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v ?? "all")}>
          <SelectTrigger className="w-[180px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {universities.length > 1 && (
          <Select value={filterUniversity} onValueChange={(v) => setFilterUniversity(v ?? "all")}>
            <SelectTrigger className="w-[200px] rounded-xl">
              <SelectValue placeholder="University" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All universities</SelectItem>
              {universities.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm">
          <Checkbox
            checked={filterNeedsFollowUp}
            onCheckedChange={(v) => setFilterNeedsFollowUp(!!v)}
          />
          <span>Needs follow-up only</span>
        </label>
        {(search || filterStatus !== "all" || filterUniversity !== "all" || filterNeedsFollowUp) && (
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl text-muted-foreground"
            onClick={() => { setSearch(""); setFilterStatus("all"); setFilterUniversity("all"); setFilterNeedsFollowUp(false); }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16">
          <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            {supervisors.length === 0 ? "No supervisors yet" : "No matches"}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {supervisors.length === 0
              ? "Add potential supervisors to track your outreach pipeline."
              : "Try adjusting your filters."}
          </p>
          {supervisors.length === 0 && (
            <Button onClick={() => setShowAdd(true)} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Add your first supervisor
            </Button>
          )}
        </div>
      )}

      {/* Table view */}
      {view === "table" && filtered.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">University</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Last Contact</TableHead>
                <TableHead className="font-semibold">Next Action</TableHead>
                <TableHead className="font-semibold text-center">Linked Apps</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((sup) => {
                const matchScore = supervisorResearchMatch(
                  sup.researchInterests,
                  activeProfile?.fieldOfStudy ?? null,
                );
                const matchColor =
                  matchScore >= 70
                    ? "text-emerald-600 dark:text-emerald-400"
                    : matchScore >= 40
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-muted-foreground";
                return (
                <TableRow
                  key={sup.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() => router.push(`/supervisors/${sup.id}`)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{sup.name}</p>
                      {sup.title && <p className="text-xs text-muted-foreground">{sup.title}</p>}
                      {matchScore > 0 && (
                        <span className={cn("inline-flex items-center gap-0.5 mt-0.5 text-[10px] font-medium", matchColor)}>
                          <Sparkles className="h-2.5 w-2.5" />
                          {matchScore}% research match
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{sup.university}</p>
                      {sup.department && <p className="text-xs text-muted-foreground">{sup.department}</p>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sup.status} />
                  </TableCell>
                  <TableCell>
                    {sup.daysSinceLastContact !== null ? (
                      <span className={cn("text-sm", sup.daysSinceLastContact > 14 && "text-amber-600 dark:text-amber-400 font-medium")}>
                        {sup.daysSinceLastContact === 0 ? "Today" : `${sup.daysSinceLastContact}d ago`}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <NextActionBadge label={sup.nextAction} urgent={sup.nextActionUrgent} />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {sup.linkedApplications.length}
                    </span>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Card view */}
      {view === "card" && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((sup) => {
            const matchScore = supervisorResearchMatch(
              sup.researchInterests,
              activeProfile?.fieldOfStudy ?? null,
            );
            const matchBg =
              matchScore >= 70
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                : matchScore >= 40
                ? "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
                : "bg-muted/50 border-border text-muted-foreground";
            return (
              <Link key={sup.id} href={`/supervisors/${sup.id}`}>
                <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{sup.name}</p>
                        {sup.title && <p className="text-xs text-muted-foreground truncate">{sup.title}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {matchScore > 0 && (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            matchBg
                          )}>
                            <Sparkles className="h-2.5 w-2.5" />
                            {matchScore}%
                          </span>
                        )}
                        <StatusBadge status={sup.status} />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{sup.university}</span>
                      {sup.department && <span className="truncate text-muted-foreground/70">· {sup.department}</span>}
                    </div>

                    {sup.researchInterests && (
                      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{sup.researchInterests}</span>
                      </div>
                    )}

                    <div className="pt-1 border-t border-border flex items-center justify-between">
                      <NextActionBadge label={sup.nextAction} urgent={sup.nextActionUrgent} />
                      {sup.daysSinceLastContact !== null && (
                        <span className={cn("text-xs", sup.daysSinceLastContact > 14 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-muted-foreground")}>
                          {sup.daysSinceLastContact === 0 ? "Today" : `${sup.daysSinceLastContact}d ago`}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <AddSupervisorModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={handleCreated}
        applications={applications}
        activeProfileId={activeProfileId}
      />
    </div>
  );
}
