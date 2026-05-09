"use client";

import { useAppStore } from "@/lib/store";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GraduationCap, ListTodo, Mail, CalendarClock, Search, Loader2,
  CheckCircle2, RefreshCw, MapPin, Calendar, DollarSign, BookOpen, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── Shared types ──────────────────────────────────────────────────────────────

type ExtractedProgram = {
  universityName: string;
  country: string;
  city: string;
  programName: string;
  degreeLevel: string;
  intakeTerm: string;
  intakeYear: number;
  applicationDeadline: string | null;
  tuitionAmount: number | null;
  tuitionCurrency: string | null;
  tuitionPeriod: string | null;
  applicationFeeAmount: number | null;
  applicationFeeCurrency: string | null;
  ieltsRequired: number | null;
  toeflRequired: number | null;
  greRequired: boolean;
  minGpa: number | null;
  sourceUrl: string;
};

type ParsedTask = {
  title: string;
  description: string | null;
  dueDate: string | null;
  priority: "high" | "medium" | "low";
};

type EmailMeta = {
  subject: string;
  university: string | null;
  deadline: string | null;
  actionRequired: string | null;
  sentiment: "positive" | "neutral" | "negative";
  type: string;
};

// ── Root modal ────────────────────────────────────────────────────────────────

export function QuickAddModal() {
  const { quickAddOpen, setQuickAddOpen } = useAppStore();
  const [activeTab, setActiveTab] = useState("application");

  return (
    <Dialog open={quickAddOpen} onOpenChange={setQuickAddOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Add</DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="application" className="gap-1.5 text-xs">
              <GraduationCap className="h-3.5 w-3.5" /> Application
            </TabsTrigger>
            <TabsTrigger value="task" className="gap-1.5 text-xs">
              <ListTodo className="h-3.5 w-3.5" /> Task
            </TabsTrigger>
            <TabsTrigger value="email" className="gap-1.5 text-xs">
              <Mail className="h-3.5 w-3.5" /> Email
            </TabsTrigger>
            <TabsTrigger value="deadline" className="gap-1.5 text-xs">
              <CalendarClock className="h-3.5 w-3.5" /> Deadline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="application">
            <QuickAddApplication onDone={() => setQuickAddOpen(false)} />
          </TabsContent>
          <TabsContent value="task">
            <QuickAddTask onDone={() => setQuickAddOpen(false)} />
          </TabsContent>
          <TabsContent value="email">
            <QuickAddEmail onDone={() => setQuickAddOpen(false)} />
          </TabsContent>
          <TabsContent value="deadline">
            <QuickAddDeadline onDone={() => setQuickAddOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// ── Shared loading view ───────────────────────────────────────────────────────

function Spinner({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{label}</p>
      {sub && <p className="text-xs text-muted-foreground/60">{sub}</p>}
    </div>
  );
}

// ── Application tab ───────────────────────────────────────────────────────────

type AppPhase =
  | { kind: "input"; url: string }
  | { kind: "extracting" }
  | { kind: "review"; data: ExtractedProgram }
  | { kind: "saving" };

function QuickAddApplication({ onDone }: { onDone: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<AppPhase>({ kind: "input", url: "" });

  async function handleExtract() {
    if (phase.kind !== "input" || !phase.url.trim()) return;
    const url = phase.url.trim();
    setPhase({ kind: "extracting" });

    try {
      const res = await fetch("/api/extract-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Extraction failed");
      }
      const data = (await res.json()) as ExtractedProgram;
      data.sourceUrl = url;
      setPhase({ kind: "review", data });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to extract from URL");
      setPhase({ kind: "input", url });
    }
  }

  async function handleSave() {
    if (phase.kind !== "review") return;
    const { data } = phase;
    setPhase({ kind: "saving" });

    try {
      // 1. Find-or-create university
      const uniRes = await fetch("/api/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.universityName || "Unknown University",
          country: data.country || "Unknown",
          city: data.city || "Unknown",
        }),
      });
      if (!uniRes.ok) throw new Error("Could not create university");
      const uni = await uniRes.json();

      // 2. Create application
      const appRes = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: uni.id,
          programName: data.programName || "Unnamed Program",
          degreeLevel: data.degreeLevel || "Masters",
          intakeTerm: data.intakeTerm || "Fall",
          intakeYear: data.intakeYear || new Date().getFullYear() + 1,
          applicationDeadline: data.applicationDeadline ?? null,
          tuitionAmount: data.tuitionAmount ?? null,
          tuitionCurrency: data.tuitionCurrency ?? null,
          tuitionPeriod: data.tuitionPeriod ?? null,
          applicationFeeAmount: data.applicationFeeAmount ?? null,
          applicationFeeCurrency: data.applicationFeeCurrency ?? null,
          ieltsRequired: data.ieltsRequired ?? null,
          toeflRequired: data.toeflRequired ?? null,
          greRequired: data.greRequired ?? false,
          minGpa: data.minGpa ?? null,
          sourceUrl: data.sourceUrl,
          status: "researching",
          priority: "medium",
        }),
      });
      if (!appRes.ok) throw new Error("Could not create application");
      const app = await appRes.json();

      toast.success(`Added ${data.programName || "program"}`, {
        description: `at ${data.universityName}`,
        action: { label: "View", onClick: () => router.push(`/applications/${app.id}`) },
      });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
      setPhase({ kind: "review", data });
    }
  }

  if (phase.kind === "extracting") return <Spinner label="Fetching and analysing program page…" sub="This may take up to 20 seconds" />;
  if (phase.kind === "saving")    return <Spinner label="Saving application…" />;

  if (phase.kind === "review") {
    const d = phase.data;
    const reqs = [
      d.ieltsRequired  ? `IELTS ≥ ${d.ieltsRequired}`  : null,
      d.toeflRequired  ? `TOEFL ≥ ${d.toeflRequired}`  : null,
      d.greRequired    ? "GRE required"                  : null,
      d.minGpa         ? `GPA ≥ ${d.minGpa}`            : null,
    ].filter((x): x is string => x !== null);

    return (
      <div className="space-y-4 pt-4">
        {/* Extracted card */}
        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm line-clamp-2">{d.programName || "Untitled Program"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{d.universityName || "Unknown University"}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground pl-7">
            {(d.city || d.country) && (
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {[d.city, d.country].filter(Boolean).join(", ")}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-3 w-3 shrink-0" />
              {d.degreeLevel} · {d.intakeTerm} {d.intakeYear}
            </div>
            {d.applicationDeadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0" />
                Deadline: {new Date(d.applicationDeadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
            {d.tuitionAmount != null && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 shrink-0" />
                {d.tuitionCurrency ?? "USD"} {d.tuitionAmount.toLocaleString()}
                {d.tuitionPeriod === "per_year" ? " / year" : " total"}
              </div>
            )}
            {reqs.length > 0 && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3 w-3 shrink-0" />
                {reqs.join(" · ")}
              </div>
            )}
          </div>
        </div>

        {/* Accuracy disclaimer */}
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            AI-extracted — verify details on the official program page before relying on them.
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5 rounded-xl" onClick={() => setPhase({ kind: "input", url: d.sourceUrl })}>
            <RefreshCw className="h-3.5 w-3.5" /> Try Again
          </Button>
          <Button className="flex-1 rounded-xl" onClick={handleSave}>
            Save Application
          </Button>
        </div>
      </div>
    );
  }

  // Input phase
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Paste a program URL</Label>
        <div className="flex gap-2">
          <Input
            placeholder="https://university.edu/program..."
            value={phase.url}
            onChange={(e) => setPhase({ kind: "input", url: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && phase.url && handleExtract()}
          />
          <Button onClick={handleExtract} disabled={!phase.url.trim()}>
            Extract
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          We&apos;ll fetch the page and extract program details automatically
        </p>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">or</span>
        </div>
      </div>
      <Button variant="outline" className="w-full" onClick={() => { onDone(); router.push("/applications?new=true"); }}>
        Add manually
      </Button>
      <Button variant="outline" className="w-full gap-2" onClick={() => { onDone(); router.push("/search"); }}>
        <Search className="h-4 w-4" /> Search for University
      </Button>
    </div>
  );
}

// ── Task tab ──────────────────────────────────────────────────────────────────

type TaskPhase =
  | { kind: "input"; text: string }
  | { kind: "parsing" }
  | { kind: "review"; parsed: ParsedTask; originalText: string }
  | { kind: "saving" };

const PRIORITY_OPTIONS = ["high", "medium", "low"] as const;

function QuickAddTask({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<TaskPhase>({ kind: "input", text: "" });

  async function handleParse() {
    if (phase.kind !== "input" || !phase.text.trim()) return;
    const text = phase.text.trim();
    setPhase({ kind: "parsing" });

    try {
      const res = await fetch("/api/parse-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Failed to parse task");
      const parsed = (await res.json()) as ParsedTask;
      setPhase({ kind: "review", parsed, originalText: text });
    } catch {
      toast.error("Failed to parse task — please try again");
      setPhase({ kind: "input", text });
    }
  }

  async function handleSave() {
    if (phase.kind !== "review") return;
    const { parsed } = phase;
    setPhase({ kind: "saving" });

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: parsed.title,
          description: parsed.description ?? null,
          dueDate: parsed.dueDate ?? null,
          priority: parsed.priority,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Task created!", { description: parsed.title });
      onDone();
    } catch {
      toast.error("Failed to create task");
      setPhase({ kind: "review", parsed: phase.parsed, originalText: phase.originalText });
    }
  }

  if (phase.kind === "parsing") return <Spinner label="Parsing task…" />;
  if (phase.kind === "saving")  return <Spinner label="Saving task…" />;

  if (phase.kind === "review") {
    const { parsed } = phase;
    return (
      <div className="space-y-4 pt-4">
        <p className="text-xs text-muted-foreground">Review and edit the parsed task before saving</p>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Title</Label>
          <Input
            value={parsed.title}
            onChange={(e) => setPhase({ ...phase, parsed: { ...parsed, title: e.target.value } })}
            className="rounded-xl"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Due Date</Label>
            <Input
              type="date"
              value={parsed.dueDate ?? ""}
              onChange={(e) => setPhase({ ...phase, parsed: { ...parsed, dueDate: e.target.value || null } })}
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Priority</Label>
            <Select
              value={parsed.priority}
              onValueChange={(v) => setPhase({ ...phase, parsed: { ...parsed, priority: (v ?? parsed.priority) as ParsedTask["priority"] } })}
            >
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((p) => (
                  <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {parsed.description && (
          <p className="text-xs text-muted-foreground rounded-xl bg-muted/40 px-3 py-2 italic">{parsed.description}</p>
        )}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5 rounded-xl" onClick={() => setPhase({ kind: "input", text: phase.originalText })}>
            <RefreshCw className="h-3.5 w-3.5" /> Re-parse
          </Button>
          <Button className="flex-1 rounded-xl" disabled={!parsed.title.trim()} onClick={handleSave}>
            Add Task
          </Button>
        </div>
      </div>
    );
  }

  // Input phase
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Describe your task</Label>
        <Input
          placeholder='e.g. "Follow up with McGill by next Friday — urgent"'
          value={phase.text}
          onChange={(e) => setPhase({ kind: "input", text: e.target.value })}
          onKeyDown={(e) => e.key === "Enter" && phase.text.trim() && handleParse()}
        />
        <p className="text-xs text-muted-foreground">
          AI will extract the title, due date, and priority automatically
        </p>
      </div>
      <Button onClick={handleParse} disabled={!phase.text.trim()} className="w-full rounded-xl">
        Parse &amp; Preview
      </Button>
    </div>
  );
}

// ── Email tab ─────────────────────────────────────────────────────────────────

type EmailPhase =
  | { kind: "input"; content: string }
  | { kind: "extracting" }
  | { kind: "review"; meta: EmailMeta; content: string }
  | { kind: "saving" };

const SENTIMENT_COLOR: Record<string, string> = {
  positive: "text-emerald-600 dark:text-emerald-400",
  neutral:  "text-muted-foreground",
  negative: "text-red-600 dark:text-red-400",
};

const EMAIL_TYPE_LABEL: Record<string, string> = {
  admission:        "Admission",
  rejection:        "Rejection",
  waitlist:         "Waitlist",
  interview:        "Interview Invite",
  document_request: "Document Request",
  financial:        "Financial Aid",
  general:          "General",
};

function QuickAddEmail({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<EmailPhase>({ kind: "input", content: "" });

  async function handleExtract() {
    if (phase.kind !== "input" || !phase.content.trim()) return;
    const content = phase.content.trim();
    setPhase({ kind: "extracting" });

    try {
      const res = await fetch("/api/extract-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Extraction failed");
      const meta = (await res.json()) as EmailMeta;
      setPhase({ kind: "review", meta, content });
    } catch {
      toast.error("Failed to extract email metadata");
      setPhase({ kind: "input", content });
    }
  }

  async function handleLog() {
    if (phase.kind !== "review") return;
    const { meta, content } = phase;
    setPhase({ kind: "saving" });

    try {
      const res = await fetch("/api/emails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: meta.subject || "Logged Email",
          sender: meta.university || "unknown",
          recipient: "me",
          body: content,
          direction: "inbound",
          extractedMetadata: meta,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Email logged!", {
        description: meta.actionRequired ?? meta.subject ?? undefined,
      });
      onDone();
    } catch {
      toast.error("Failed to log email");
      setPhase({ kind: "review", meta: phase.meta, content: phase.content });
    }
  }

  if (phase.kind === "extracting") return <Spinner label="Analysing email…" />;
  if (phase.kind === "saving")     return <Spinner label="Logging email…" />;

  if (phase.kind === "review") {
    const { meta } = phase;
    return (
      <div className="space-y-4 pt-4">
        {/* Extracted summary card */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium">Extracted</span>
            </div>
            <div className="flex items-center gap-2">
              {meta.type && meta.type !== "general" && (
                <span className="text-[11px] font-medium bg-primary/10 text-primary rounded-full px-2 py-0.5">
                  {EMAIL_TYPE_LABEL[meta.type] ?? meta.type}
                </span>
              )}
              {meta.sentiment && (
                <span className={cn("text-[11px] font-medium capitalize", SENTIMENT_COLOR[meta.sentiment])}>
                  {meta.sentiment}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-muted-foreground">
            {meta.university && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3 w-3 shrink-0" />
                {meta.university}
              </div>
            )}
            {meta.deadline && (
              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                <Calendar className="h-3 w-3 shrink-0" />
                Deadline: {new Date(meta.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
            {meta.actionRequired && (
              <div className="flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                {meta.actionRequired}
              </div>
            )}
          </div>
        </div>

        {/* Editable subject */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Subject (for log)</Label>
          <Input
            value={meta.subject}
            onChange={(e) => setPhase({ ...phase, meta: { ...meta, subject: e.target.value } })}
            className="rounded-xl"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-1.5 rounded-xl" onClick={() => setPhase({ kind: "input", content: phase.content })}>
            <RefreshCw className="h-3.5 w-3.5" /> Re-extract
          </Button>
          <Button className="flex-1 rounded-xl" onClick={handleLog}>
            Log Email
          </Button>
        </div>
      </div>
    );
  }

  // Input phase
  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Paste email content</Label>
        <Textarea
          placeholder="Paste the email body here…"
          rows={5}
          value={phase.content}
          onChange={(e) => setPhase({ kind: "input", content: e.target.value })}
          className="rounded-xl resize-none"
        />
        <p className="text-xs text-muted-foreground">
          AI will extract deadlines, action items, and sentiment automatically
        </p>
      </div>
      <Button onClick={handleExtract} disabled={!phase.content.trim()} className="w-full rounded-xl">
        Extract &amp; Preview
      </Button>
    </div>
  );
}

// ── Deadline tab ──────────────────────────────────────────────────────────────

function QuickAddDeadline({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState("application");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title || !dueDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, dueDate, type }),
      });
      if (!res.ok) throw new Error();
      toast.success("Deadline added!", { description: title });
      onDone();
    } catch {
      toast.error("Failed to add deadline");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          placeholder="e.g. Submit application to McGill"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && title && dueDate && handleAdd()}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => setType(v ?? "application")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="application">Application</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="fee">Fee</SelectItem>
              <SelectItem value="visa">Visa</SelectItem>
              <SelectItem value="scholarship">Scholarship</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={handleAdd} disabled={!title || !dueDate || saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        Add Deadline
      </Button>
    </div>
  );
}
