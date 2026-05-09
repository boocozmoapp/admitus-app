"use client";

import { useEffect, useState } from "react";
import { cn, daysUntil, urgencyColor, statusColor, priorityColor, formatCurrency, STATUS_OPTIONS, PRIORITY_OPTIONS, DEGREE_LEVELS, INTAKE_TERMS } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";
import { toast } from "sonner";
import {
  Plus, LayoutGrid, TableIcon, GraduationCap, Search, Filter, X, Loader2, Users2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { extractFromURL } from "@/lib/ai/mocks";

type Application = {
  id: number;
  universityId: number;
  universityName: string;
  universityCountry: string;
  universityCity: string;
  programName: string;
  degreeLevel: string;
  intakeTerm: string;
  intakeYear: number;
  applicationDeadline: string | null;
  decisionExpectedDate: string | null;
  tuitionAmount: number | null;
  tuitionCurrency: string | null;
  tuitionPeriod: string | null;
  applicationFeeAmount: number | null;
  applicationFeeCurrency: string | null;
  status: string;
  priority: string;
  minGpa: number | null;
  ieltsRequired: number | null;
  toeflRequired: number | null;
  greRequired: boolean | null;
  sourceUrl: string | null;
  notes: string | null;
  documents?: Array<{ id: number; name: string; type: string; status: string }>;
};

type University = { id: number; name: string; country: string; city: string };

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [supervisorCounts, setSupervisorCounts] = useState<Record<number, number>>({});
  const [view, setView] = useState<"card" | "table">("card");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCountry, setFilterCountry] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showNewApp, setShowNewApp] = useState(false);
  const [newAppTab, setNewAppTab] = useState<"url" | "manual">("url");
  const [urlValue, setUrlValue] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { setQuickAddOpen } = useAppStore();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  const [manualForm, setManualForm] = useState({
    universityId: "",
    programName: "",
    degreeLevel: "Masters",
    intakeTerm: "Fall",
    intakeYear: new Date().getFullYear() + 1,
    applicationDeadline: "",
    tuitionAmount: "",
    tuitionCurrency: "CAD",
    priority: "medium",
    status: "researching",
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get("new") === "true") setShowNewApp(true);
    }
    setInitialLoadComplete(true);
  }, []);

  useEffect(() => {
    fetch("/api/applications").then((r) => r.json()).then((data) => { setApplications(data); setInitialLoadComplete(true); });
    fetch("/api/universities").then((r) => r.json()).then(setUniversities);
    fetch("/api/supervisors")
      .then((r) => r.json())
      .then((sups: Array<{ linkedApplications: Array<{ applicationId: number }> }>) => {
        const counts: Record<number, number> = {};
        for (const sup of sups) {
          for (const la of sup.linkedApplications ?? []) {
            counts[la.applicationId] = (counts[la.applicationId] ?? 0) + 1;
          }
        }
        setSupervisorCounts(counts);
      })
      .catch(() => {});
  }, []);

  const filtered = applications.filter((a) => {
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    if (filterCountry !== "all" && a.universityCountry !== filterCountry) return false;
    if (filterPriority !== "all" && a.priority !== filterPriority) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        a.universityName.toLowerCase().includes(q) ||
        a.programName.toLowerCase().includes(q) ||
        a.universityCountry.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countries = [...new Set(applications.map((a) => a.universityCountry))];

  async function handleUrlExtract() {
    setLoading(true);
    try {
      const data = await extractFromURL(urlValue);
      let universityId = universities.find((u) => u.name === data.universityName)?.id;
      if (!universityId) universityId = universities[0]?.id;
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId,
          programName: data.programName,
          degreeLevel: data.degreeLevel,
          intakeTerm: data.intakeTerm,
          intakeYear: data.intakeYear,
          applicationDeadline: data.applicationDeadline,
          tuitionAmount: data.tuitionAmount,
          tuitionCurrency: data.tuitionCurrency,
          tuitionPeriod: data.tuitionPeriod,
          applicationFeeAmount: data.applicationFeeAmount,
          applicationFeeCurrency: data.applicationFeeCurrency,
          ieltsRequired: data.ieltsRequired,
          toeflRequired: data.toeflRequired,
          greRequired: data.greRequired,
          minGpa: data.minGpa,
          sourceUrl: data.sourceUrl,
        }),
      });
      const app = await res.json();
      toast.success("Application added!", {
        action: { label: "View", onClick: () => router.push(`/applications/${app.id}`) },
      });
      setShowNewApp(false);
      setUrlValue("");
      fetch("/api/applications").then((r) => r.json()).then(setApplications);
    } catch {
      toast.error("Failed to extract from URL");
    } finally {
      setLoading(false);
    }
  }

  async function handleManualCreate() {
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: parseInt(manualForm.universityId),
          programName: manualForm.programName,
          degreeLevel: manualForm.degreeLevel,
          intakeTerm: manualForm.intakeTerm,
          intakeYear: manualForm.intakeYear,
          applicationDeadline: manualForm.applicationDeadline || null,
          priority: manualForm.priority,
          status: manualForm.status,
          tuitionAmount: manualForm.tuitionAmount ? parseFloat(manualForm.tuitionAmount) : null,
          tuitionCurrency: manualForm.tuitionCurrency,
        }),
      });
      const app = await res.json();
      toast.success("Application created!");
      setShowNewApp(false);
      fetch("/api/applications").then((r) => r.json()).then(setApplications);
    } catch {
      toast.error("Failed to create application");
    }
  }

  if (!initialLoadComplete) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground">{applications.length} applications tracked</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-2xl border-0 bg-white p-1">
            <Button
              variant={view === "card" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => setView("card")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              className="rounded-lg"
              onClick={() => setView("table")}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
          <Dialog open={showNewApp} onOpenChange={setShowNewApp}>
            <DialogTrigger render={<Button className="gap-2 rounded-xl" />}>
                <Plus className="h-4 w-4" />
                New Application
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New Application</DialogTitle>
              </DialogHeader>
              <Tabs value={newAppTab} onValueChange={(v) => setNewAppTab(v as "url" | "manual")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url">Paste URL</TabsTrigger>
                  <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Paste program URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://university.edu/program..."
                        value={urlValue}
                        onChange={(e) => setUrlValue(e.target.value)}
                      />
                      <Button onClick={handleUrlExtract} disabled={!urlValue || loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Extract"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">We&apos;ll extract details automatically with the configured LLM.</p>
                  </div>
                </TabsContent>
                <TabsContent value="manual" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>University</Label>
                    <Select value={manualForm.universityId} onValueChange={(v) => setManualForm({ ...manualForm, universityId: v ?? "" })}>
                      <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                      <SelectContent>
                        {universities.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>{u.name} ({u.country})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Program Name</Label>
                    <Input value={manualForm.programName} onChange={(e) => setManualForm({ ...manualForm, programName: e.target.value })} placeholder="MSc Computer Science" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Degree Level</Label>
                      <Select value={manualForm.degreeLevel} onValueChange={(v) => setManualForm({ ...manualForm, degreeLevel: v ?? "Masters" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEGREE_LEVELS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Intake Term</Label>
                      <Select value={manualForm.intakeTerm} onValueChange={(v) => setManualForm({ ...manualForm, intakeTerm: v ?? "Fall" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {INTAKE_TERMS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Intake Year</Label>
                      <Input type="number" value={manualForm.intakeYear} onChange={(e) => setManualForm({ ...manualForm, intakeYear: parseInt(e.target.value) })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Application Deadline</Label>
                      <Input type="date" value={manualForm.applicationDeadline} onChange={(e) => setManualForm({ ...manualForm, applicationDeadline: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tuition Amount</Label>
                      <Input type="number" value={manualForm.tuitionAmount} onChange={(e) => setManualForm({ ...manualForm, tuitionAmount: e.target.value })} placeholder="15000" />
                    </div>
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={manualForm.tuitionCurrency} onValueChange={(v) => setManualForm({ ...manualForm, tuitionCurrency: v ?? "CAD" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CAD">CAD</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="GBP">GBP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select value={manualForm.priority} onValueChange={(v) => setManualForm({ ...manualForm, priority: v ?? "medium" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={manualForm.status} onValueChange={(v) => setManualForm({ ...manualForm, status: v ?? "researching" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleManualCreate} disabled={!manualForm.universityId || !manualForm.programName} className="w-full">
                    Create Application
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search universities, programs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v || "all")}>
          <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCountry} onValueChange={(v) => setFilterCountry(v || "all")}>
          <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Countries</SelectItem>
            {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={(v) => setFilterPriority(v || "all")}>
          <SelectTrigger className="w-[130px] rounded-xl"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priority</SelectItem>
            {PRIORITY_OPTIONS.map((p) => <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
        {(filterStatus !== "all" || filterCountry !== "all" || filterPriority !== "all" || search) && (
          <Button variant="ghost" size="sm" className="gap-1" onClick={() => { setFilterStatus("all"); setFilterCountry("all"); setFilterPriority("all"); setSearch(""); }}>
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      {applications.length === 0 ? (
        <Card className="rounded-2xl border-0 card-shadow">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No applications yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Start by adding your first university application</p>
            <div className="flex gap-2">
              <Button className="rounded-xl gap-2" onClick={() => setShowNewApp(true)}>
                <Plus className="h-4 w-4" /> Add Application
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => router.push("/search")}>
                Find Universities
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : view === "card" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((app) => {
            const days = app.applicationDeadline ? daysUntil(app.applicationDeadline) : null;
            return (
              <Link key={app.id} href={`/applications/${app.id}`}>
                <Card className="rounded-2xl border-0 card-shadow hover:border-primary/50 transition-colors cursor-pointer h-full">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate">{app.universityName}</h3>
                        <p className="text-sm text-muted-foreground truncate">{app.programName}</p>
                      </div>
                      <Badge className={cn("ml-2 shrink-0", statusColor(app.status))}>
                        {app.status}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{app.intakeTerm} {app.intakeYear}</span>
                      <span>•</span>
                      <span>{app.universityCountry}</span>
                    </div>
                    {app.tuitionAmount && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {formatCurrency(app.tuitionAmount, app.tuitionCurrency || "USD")}{app.tuitionPeriod === "per_year" ? "/yr" : " total"}
                      </div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <span className={cn("text-xs", priorityColor(app.priority))}>
                          {app.priority === "high" ? "●" : app.priority === "medium" ? "●" : "●"}
                        </span>
                        <span className="text-xs text-muted-foreground">{app.priority} priority</span>
                      </div>
                      {days !== null && (
                        <span className={cn("text-xs font-medium", urgencyColor(days))}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
                        </span>
                      )}
                    </div>
                    {((app.documents?.length ?? 0) > 0 || (supervisorCounts[app.id] ?? 0) > 0) && (
                      <div className="mt-2 flex flex-wrap gap-1 items-center">
                        {app.documents?.map(d => (
                          <span key={d.id} className="text-[10px] px-2 py-0.5 rounded-full bg-accent text-accent-foreground font-medium">{d.name}</span>
                        ))}
                        {supervisorCounts[app.id] > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium dark:bg-indigo-900/40 dark:text-indigo-300">
                            <Users2 className="h-2.5 w-2.5" />
                            {supervisorCounts[app.id]} supervisor{supervisorCounts[app.id] !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card className="rounded-2xl border-0 card-shadow">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>University</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Intake</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Tuition</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Supervisors</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => {
                const days = app.applicationDeadline ? daysUntil(app.applicationDeadline) : null;
                return (
                  <TableRow key={app.id} className="cursor-pointer" onClick={() => router.push(`/applications/${app.id}`)}>
                    <TableCell className="font-medium">{app.universityName}</TableCell>
                    <TableCell>{app.universityCountry}</TableCell>
                    <TableCell>{app.programName}</TableCell>
                    <TableCell>{app.intakeTerm} {app.intakeYear}</TableCell>
                    <TableCell>
                      {days !== null ? (
                        <span className={cn(urgencyColor(days))}>
                          {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {app.tuitionAmount ? formatCurrency(app.tuitionAmount, app.tuitionCurrency || "USD") : "—"}
                    </TableCell>
                    <TableCell><Badge className={statusColor(app.status)}>{app.status}</Badge></TableCell>
                    <TableCell><span className={priorityColor(app.priority)}>●</span> {app.priority}</TableCell>
                    <TableCell>
                      {supervisorCounts[app.id] > 0 ? (
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                          <Users2 className="h-3 w-3" />
                          {supervisorCounts[app.id]}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
