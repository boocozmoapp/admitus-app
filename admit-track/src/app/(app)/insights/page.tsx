"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Sparkles, AlertTriangle, Search, Plus, Loader2, BarChart3, FileText,
  MailCheck, Users2, Gauge,
} from "lucide-react";

type Application = {
  id: number;
  universityName: string;
  programName: string;
  status: string;
  priority: string;
  applicationDeadline: string | null;
  decisionExpectedDate: string | null;
  tuitionAmount: number | null;
  tuitionCurrency: string | null;
};

type Email = {
  id: number;
  applicationId: number;
  subject: string;
  sender: string;
  direction: string;
  sentAt: string;
  extractedMetadata: string;
  universityName: string;
};

type DecisionEntry = {
  id: number;
  entryType: string;
  title: string;
  reasoning: string;
  relatedApplicationId: number | null;
  universityName: string | null;
  programName: string | null;
  createdAt: string;
};

type Stats = {
  xp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalApplicationsSubmitted: number;
  totalEmailsSent: number;
};

type Supervisor = {
  id: number;
  name: string;
  university: string;
  status: string;
  firstContactedAt: string | null;
  lastContactedAt: string | null;
  lastResponseAt: string | null;
  followUpCount: number;
  nextAction: string;
  nextActionUrgent: boolean;
  daysSinceLastContact: number | null;
};

type Profile = {
  id: number;
  name: string;
  degreeLevel: string;
  fieldOfStudy: string;
  targetCountries: string;
  ieltsScore: number | null;
  toeflScore: number | null;
  gpa: number | null;
  greScore: number | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  isActive: boolean;
};

const COLORS = ["#022226", "#F7E28B", "#10b981", "#ef4444", "#AAD8D8", "#f97316", "#1A4040", "#6A9A9A"];

const ENTRY_TYPES = [
  { value: "priority_change", label: "Priority Change" },
  { value: "dropped_application", label: "Dropped Application" },
  { value: "added_application", label: "Added Application" },
  { value: "strategy_note", label: "Strategy Note" },
];

const ENTRY_TYPE_COLORS: Record<string, string> = {
  priority_change: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  dropped_application: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  added_application: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  strategy_note: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
};

export default function InsightsPage() {
  const [summary, setSummary] = useState<string[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [decisions, setDecisions] = useState<DecisionEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newEntry, setNewEntry] = useState({
    entryType: "strategy_note",
    title: "",
    reasoning: "",
    relatedApplicationId: "",
  });

  useEffect(() => {
    fetch("/api/weekly-summary")
      .then((r) => r.json())
      .then((data) => setSummary(data.bullets ?? []))
      .catch(() => setSummary(["Weekly summary is unavailable right now."]))
      .finally(() => setSummaryLoading(false));
    fetch("/api/applications").then((r) => r.json()).then(setApplications);
    fetch("/api/emails").then((r) => r.json()).then(setEmails);
    fetch("/api/supervisors").then((r) => r.json()).then(setSupervisors);
    fetch("/api/profiles").then((r) => r.json()).then(setProfiles);
    fetch("/api/decision-log").then((r) => r.json()).then(setDecisions);
    fetch("/api/stats").then((r) => r.json()).then(setStats);
  }, []);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const app of applications) {
      counts[app.status] = (counts[app.status] || 0) + 1;
    }
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [applications]);

  const deadlinePressureData = useMemo(() => {
    const today = new Date();
    const buckets = [
      { label: "Overdue", count: 0 },
      { label: "0-14 days", count: 0 },
      { label: "15-30 days", count: 0 },
      { label: "31-60 days", count: 0 },
      { label: "60+ days", count: 0 },
    ];

    const upcoming = applications
      .filter((app) => app.applicationDeadline && !["admitted", "rejected", "waitlisted", "withdrawn"].includes(app.status))
      .map((app) => {
        const deadline = new Date(app.applicationDeadline!);
        const daysRemaining = Math.ceil((deadline.getTime() - today.getTime()) / 86400000);
        if (daysRemaining < 0) buckets[0].count += 1;
        else if (daysRemaining <= 14) buckets[1].count += 1;
        else if (daysRemaining <= 30) buckets[2].count += 1;
        else if (daysRemaining <= 60) buckets[3].count += 1;
        else buckets[4].count += 1;

        return {
          id: app.id,
          label: `${app.universityName} - ${app.programName}`,
          deadline: app.applicationDeadline!,
          daysRemaining,
        };
      })
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 4);

    return {
      buckets: buckets.filter((bucket) => bucket.count > 0),
      upcoming,
    };
  }, [applications]);

  const communicationMetrics = useMemo(() => {
    const byUniversity = new Map<string, { university: string; inbound: number; outbound: number; lastInbound: Date | null; lastOutbound: Date | null }>();

    for (const email of emails) {
      const current = byUniversity.get(email.universityName) ?? {
        university: email.universityName,
        inbound: 0,
        outbound: 0,
        lastInbound: null,
        lastOutbound: null,
      };
      const sentAt = new Date(email.sentAt);

      if (email.direction === "inbound") {
        current.inbound += 1;
        if (!current.lastInbound || sentAt > current.lastInbound) current.lastInbound = sentAt;
      } else {
        current.outbound += 1;
        if (!current.lastOutbound || sentAt > current.lastOutbound) current.lastOutbound = sentAt;
      }
      byUniversity.set(email.universityName, current);
    }

    const universityData = Array.from(byUniversity.values())
      .map((row) => ({
        ...row,
        shortName: row.university.length > 18 ? row.university.slice(0, 16) + "..." : row.university,
      }))
      .sort((a, b) => (b.inbound + b.outbound) - (a.inbound + a.outbound))
      .slice(0, 8);

    const awaitingReply = universityData.filter((row) =>
      row.outbound > 0 && (!row.lastInbound || (row.lastOutbound && row.lastOutbound > row.lastInbound))
    );

    return {
      inbound: emails.filter((email) => email.direction === "inbound").length,
      outbound: emails.filter((email) => email.direction === "outbound").length,
      awaitingReply,
      universityData,
    };
  }, [emails]);

  const supervisorMetrics = useMemo(() => {
    const contacted = supervisors.filter((s) => s.status !== "not_contacted" || s.lastContactedAt || s.firstContactedAt);
    const replied = contacted.filter((s) =>
      s.status.startsWith("replied") ||
      s.status === "meeting_scheduled" ||
      s.status === "meeting_completed" ||
      Boolean(s.lastResponseAt)
    );
    const positive = replied.filter((s) =>
      s.status === "replied_positive" ||
      s.status === "meeting_scheduled" ||
      s.status === "meeting_completed"
    );
    const pendingFollowUp = supervisors.filter((s) => s.nextActionUrgent && s.nextAction.toLowerCase().includes("follow-up"));
    const cold = supervisors.filter((s) => s.status === "cold" || s.status === "replied_declined");

    const responseDays = replied
      .map((s) => {
        if (!s.lastContactedAt || !s.lastResponseAt) return null;
        return Math.max(0, Math.round((new Date(s.lastResponseAt).getTime() - new Date(s.lastContactedAt).getTime()) / 86400000));
      })
      .filter((days): days is number => days !== null);

    const repliedIds = new Set(replied.map((s) => s.id));
    const positiveIds = new Set(positive.map((s) => s.id));
    const byUniversity = new Map<string, { university: string; contacted: number; replied: number; positive: number }>();

    for (const sup of contacted) {
      const current = byUniversity.get(sup.university) ?? { university: sup.university, contacted: 0, replied: 0, positive: 0 };
      current.contacted += 1;
      if (repliedIds.has(sup.id)) current.replied += 1;
      if (positiveIds.has(sup.id)) current.positive += 1;
      byUniversity.set(sup.university, current);
    }

    const universityData = Array.from(byUniversity.values())
      .map((row) => ({
        ...row,
        replyRate: row.contacted > 0 ? Math.round((row.replied / row.contacted) * 100) : 0,
        positiveRate: row.contacted > 0 ? Math.round((row.positive / row.contacted) * 100) : 0,
        shortName: row.university.length > 18 ? row.university.slice(0, 16) + "..." : row.university,
      }))
      .sort((a, b) => b.replyRate - a.replyRate || b.contacted - a.contacted)
      .slice(0, 8);

    return {
      contacted: contacted.length,
      replied: replied.length,
      positive: positive.length,
      cold: cold.length,
      pendingFollowUp: pendingFollowUp.length,
      replyRate: contacted.length > 0 ? Math.round((replied.length / contacted.length) * 100) : 0,
      positiveRate: contacted.length > 0 ? Math.round((positive.length / contacted.length) * 100) : 0,
      avgResponseDays: responseDays.length > 0 ? Math.round(responseDays.reduce((sum, days) => sum + days, 0) / responseDays.length) : null,
      universityData,
      nextFollowUps: pendingFollowUp.slice(0, 4),
    };
  }, [supervisors]);

  const fafoMeter = useMemo(() => {
    const activeProfile = profiles.find((profile) => profile.isActive) ?? profiles[0] ?? null;
    const activeApplications = applications.filter((app) => !["rejected", "withdrawn"].includes(app.status));
    const submittedApplications = applications.filter((app) =>
      ["submitted", "interview", "admitted", "waitlisted"].includes(app.status)
    );
    const outboundEmails = communicationMetrics.outbound;
    const supervisorContacts = supervisorMetrics.contacted;
    const totalOutreach = outboundEmails + supervisorContacts;
    const blendedReplyRate = totalOutreach > 0
      ? Math.round(((communicationMetrics.inbound + supervisorMetrics.replied) / totalOutreach) * 100)
      : 0;

    const outreachScore = Math.min(28, totalOutreach * 3);
    const responseScore = Math.min(26, Math.round(blendedReplyRate * 0.26));
    const applicationScore = Math.min(22, activeApplications.length * 3 + submittedApplications.length * 2);

    let profileScore = 8;
    if (activeProfile) {
      if (activeProfile.degreeLevel === "PhD") profileScore += 4;
      if (activeProfile.degreeLevel === "Masters") profileScore += 2;
      if ((activeProfile.gpa ?? 0) >= 3.7) profileScore += 6;
      else if ((activeProfile.gpa ?? 0) >= 3.4) profileScore += 4;
      else if ((activeProfile.gpa ?? 0) >= 3.0) profileScore += 2;
      if ((activeProfile.ieltsScore ?? 0) >= 7.5 || (activeProfile.toeflScore ?? 0) >= 100) profileScore += 3;
      if ((activeProfile.greScore ?? 0) >= 315) profileScore += 3;
    }
    profileScore = Math.min(24, profileScore);

    const score = Math.max(0, Math.min(100, outreachScore + responseScore + applicationScore + profileScore));
    const label = score >= 75 ? "High FAFO upside" : score >= 55 ? "Promising, push harder" : score >= 35 ? "Needs more signal" : "Too quiet";
    const tone = score >= 75 ? "text-emerald-300" : score >= 55 ? "text-[#AAD8D8]" : score >= 35 ? "text-amber-300" : "text-red-300";
    const fill = score >= 75 ? "bg-emerald-500" : score >= 55 ? "bg-[#AAD8D8]" : score >= 35 ? "bg-amber-500" : "bg-red-500";

    const drivers = [
      {
        label: "Outreach volume",
        value: totalOutreach,
        detail: `${outboundEmails} admissions emails + ${supervisorContacts} professor contacts`,
      },
      {
        label: "Response ratio",
        value: `${blendedReplyRate}%`,
        detail: `${communicationMetrics.inbound + supervisorMetrics.replied} responses from ${totalOutreach || 0} outreach touches`,
      },
      {
        label: "Application spread",
        value: activeApplications.length,
        detail: `${submittedApplications.length} submitted or further`,
      },
      {
        label: "Profile signal",
        value: activeProfile ? activeProfile.degreeLevel : "Missing",
        detail: activeProfile
          ? `GPA ${activeProfile.gpa ?? "N/A"} · IELTS ${activeProfile.ieltsScore ?? "N/A"} · TOEFL ${activeProfile.toeflScore ?? "N/A"}`
          : "Create a profile to improve prediction quality",
      },
    ];

    const advice: string[] = [];
    if (supervisorMetrics.replyRate < 25 && supervisorMetrics.contacted < 8) {
      advice.push("Send more targeted professor emails before judging funding odds.");
    }
    if (activeApplications.length < 6) {
      advice.push("Add more funded MS/PhD options to reduce single-program risk.");
    }
    if (submittedApplications.length < 3) {
      advice.push("Move shortlisted applications from researching/preparing into submitted.");
    }
    if (!activeProfile?.gpa || (!activeProfile.ieltsScore && !activeProfile.toeflScore)) {
      advice.push("Complete GPA and language scores in your profile for a sharper estimate.");
    }
    if (advice.length === 0) {
      advice.push("Keep follow-ups warm and prioritize programs with assistantships or supervisor funding.");
    }

    return {
      score,
      label,
      tone,
      fill,
      drivers,
      advice,
      parts: { outreachScore, responseScore, applicationScore, profileScore },
    };
  }, [applications, communicationMetrics, profiles, supervisorMetrics]);

  const riskWarnings = useMemo(() => {
    const warnings: string[] = [];
    const now = new Date();
    const uniLastInbound: Record<string, Date> = {};

    for (const email of emails) {
      if (email.direction === "inbound") {
        const d = new Date(email.sentAt);
        if (!uniLastInbound[email.universityName] || d > uniLastInbound[email.universityName]) {
          uniLastInbound[email.universityName] = d;
        }
      }
    }

    const staleThreshold = 21;
    const staleUnis = Object.entries(uniLastInbound).filter(([, date]) => {
      const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      return diff >= staleThreshold;
    });
    if (staleUnis.length > 0) {
      warnings.push(
        `${staleUnis.length} ${staleUnis.length === 1 ? "university hasn't" : "universities haven't"} acknowledged in ${staleThreshold}+ days: ${staleUnis.map(([u]) => u).join(", ")}`
      );
    }

    const noEmailApps = applications.filter(
      (a) => !emails.some((e) => e.applicationId === a.id) && a.status === "submitted"
    );
    if (noEmailApps.length > 0) {
      warnings.push(
        `${noEmailApps.length} submitted ${noEmailApps.length === 1 ? "application has" : "applications have"} no email correspondence`
      );
    }

    const overdueApps = applications.filter(
      (a) =>
        a.status === "submitted" &&
        a.decisionExpectedDate &&
        new Date(a.decisionExpectedDate) < now
    );
    if (overdueApps.length > 0) {
      warnings.push(
        `${overdueApps.length} ${overdueApps.length === 1 ? "application is" : "applications are"} past the expected decision date`
      );
    }

    if (supervisorMetrics.pendingFollowUp > 0) {
      warnings.push(`${supervisorMetrics.pendingFollowUp} professor follow-up${supervisorMetrics.pendingFollowUp === 1 ? "" : "s"} should be sent soon`);
    }

    if (warnings.length === 0) {
      warnings.push("No risks detected — everything looks on track!");
    }

    return warnings;
  }, [applications, emails, supervisorMetrics.pendingFollowUp]);

  const filteredDecisions = useMemo(() => {
    if (!searchQuery.trim()) return decisions;
    const q = searchQuery.toLowerCase();
    return decisions.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.reasoning.toLowerCase().includes(q) ||
        (d.universityName || "").toLowerCase().includes(q) ||
        (d.programName || "").toLowerCase().includes(q) ||
        d.entryType.toLowerCase().includes(q)
    );
  }, [decisions, searchQuery]);

  async function handleAddEntry() {
    if (!newEntry.title.trim() || !newEntry.reasoning.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/decision-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryType: newEntry.entryType,
          title: newEntry.title,
          reasoning: newEntry.reasoning,
          relatedApplicationId: newEntry.relatedApplicationId
            ? parseInt(newEntry.relatedApplicationId)
            : null,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setDecisions((prev) => [created, ...prev]);
      toast.success("Decision entry added");
      setShowAddDialog(false);
      setNewEntry({ entryType: "strategy_note", title: "", reasoning: "", relatedApplicationId: "" });
    } catch {
      toast.error("Failed to add entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <p className="text-muted-foreground">Analytics, risk signals & decision tracking</p>
        </div>
      </div>

      {/* Weekly AI Summary */}
      <Card className="rounded-2xl border-0 card-shadow border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/30 dark:to-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-semibold">Weekly AI Summary</h2>
          </div>
          {summaryLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Generating summary...</span>
            </div>
          ) : (
            <ul className="space-y-2">
              {summary.map((bullet, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* FAFO Funding Meter */}
      <Card className="rounded-2xl border-0 card-shadow bg-[#022226] text-[#F4F2DC]">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-[#F7E28B]" />
                <h2 className="text-base font-semibold">FAFO Funding Meter</h2>
              </div>
              <p className="max-w-2xl text-sm leading-relaxed text-[#AAD8D8]">
                A rough funding-readiness estimate for MS/PhD based on outreach volume, reply ratio, application spread, and profile strength.
              </p>
              <div className="mt-5 h-4 overflow-hidden rounded-full bg-[#1A4040]">
                <div
                  className={cn("h-full rounded-full transition-all", fafoMeter.fill)}
                  style={{ width: `${fafoMeter.score}%` }}
                />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {fafoMeter.drivers.map((driver) => (
                  <div key={driver.label} className="rounded-xl border border-[#AAD8D8]/10 bg-[#1A4040] p-3">
                    <div className="text-lg font-bold text-[#F7E28B]">{driver.value}</div>
                    <div className="text-xs font-medium text-[#F4F2DC]">{driver.label}</div>
                    <div className="mt-1 text-[11px] leading-snug text-[#AAD8D8]/80">{driver.detail}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="shrink-0 rounded-2xl border border-[#AAD8D8]/10 bg-[#1A4040] p-5 text-center lg:w-64">
              <div className="text-5xl font-bold text-[#F7E28B]">{fafoMeter.score}%</div>
              <div className={cn("mt-1 text-sm font-semibold", fafoMeter.tone)}>{fafoMeter.label}</div>
              <div className="mt-4 space-y-2 text-left">
                {fafoMeter.advice.slice(0, 3).map((item) => (
                  <div key={item} className="rounded-lg bg-[#022226]/70 px-3 py-2 text-xs leading-snug text-[#F4F2DC]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-0 card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                  <BarChart3 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Applications</p>
                  <p className="text-2xl font-bold">{applications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                  <MailCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Professor Reply Rate</p>
                  <p className="text-2xl font-bold">{supervisorMetrics.replyRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
                  <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Strategy Notes</p>
                  <p className="text-2xl font-bold">{decisions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-0 card-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                  <Users2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Follow-ups Due</p>
                  <p className="text-2xl font-bold">{supervisorMetrics.pendingFollowUp}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Applications by Status */}
        <Card className="rounded-2xl border-0 card-shadow">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-4">Applications by Status</h3>
            {statusData.length > 0 ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={220}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {statusData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {statusData.map((item, index) => (
                    <div key={item.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="flex-1 capitalize">{item.name}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">No application data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Deadline Pressure */}
        <Card className="rounded-2xl border-0 card-shadow">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-4">Deadline Pressure</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Active applications grouped by time left before submission
            </p>
            {deadlinePressureData.buckets.length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={170}>
                  <BarChart data={deadlinePressureData.buckets}>
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="Applications" fill="#AAD8D8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {deadlinePressureData.upcoming.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                      <span className="min-w-0 truncate">{item.label}</span>
                      <span className={cn("shrink-0 font-medium", item.daysRemaining <= 14 ? "text-amber-700" : "text-muted-foreground")}>
                        {item.daysRemaining < 0 ? `${Math.abs(item.daysRemaining)}d overdue` : `${item.daysRemaining}d left`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Add active applications with deadlines to see pressure points
              </p>
            )}
          </CardContent>
        </Card>

        {/* Admissions Communication */}
        <Card className="rounded-2xl border-0 card-shadow">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-4">Admissions Communication</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Inbound and outbound admissions emails by university
            </p>
            {communicationMetrics.universityData.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xl font-bold">{communicationMetrics.outbound}</div>
                    <div className="text-[11px] text-muted-foreground">Sent</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xl font-bold">{communicationMetrics.inbound}</div>
                    <div className="text-[11px] text-muted-foreground">Received</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xl font-bold">{communicationMetrics.awaitingReply.length}</div>
                    <div className="text-[11px] text-muted-foreground">Awaiting</div>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={communicationMetrics.universityData}>
                    <XAxis dataKey="shortName" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="outbound" name="Sent" fill="#F7E28B" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="inbound" name="Received" fill="#AAD8D8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {communicationMetrics.awaitingReply.length > 0 && (
                  <div className="space-y-2">
                    {communicationMetrics.awaitingReply.slice(0, 3).map((row) => (
                      <div key={row.university} className="flex items-center justify-between gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm">
                        <span className="min-w-0 truncate">{row.university}</span>
                        <span className="shrink-0 text-amber-700">awaiting reply</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Track admissions emails to see communication gaps</p>
            )}
          </CardContent>
        </Card>

        {/* Professor Outreach */}
        <Card className="rounded-2xl border-0 card-shadow">
          <CardContent className="pt-6">
            <h3 className="text-base font-semibold mb-4">Professor Outreach</h3>
            <p className="text-xs text-muted-foreground mb-2">
              Reply and positive-response rates from your tracked supervisors
            </p>
            {supervisorMetrics.contacted > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xl font-bold">{supervisorMetrics.replyRate}%</div>
                    <div className="text-[11px] text-muted-foreground">Reply rate</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xl font-bold">{supervisorMetrics.positiveRate}%</div>
                    <div className="text-[11px] text-muted-foreground">Positive</div>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <div className="text-xl font-bold">{supervisorMetrics.avgResponseDays ?? "-"}</div>
                    <div className="text-[11px] text-muted-foreground">Avg days</div>
                  </div>
                </div>
                {supervisorMetrics.universityData.length > 0 && (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={supervisorMetrics.universityData}>
                      <XAxis dataKey="shortName" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="replyRate" name="Reply %" fill="#AAD8D8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="positiveRate" name="Positive %" fill="#F7E28B" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Log supervisor outreach to see reply rates</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Risk Panel */}
      <Card className="rounded-2xl border-0 card-shadow border-amber-200 dark:border-amber-800">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <h2 className="text-base font-semibold">Risk Signals</h2>
          </div>
          <div className="space-y-2">
            {riskWarnings.map((warning, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2 rounded-xl px-4 py-3 text-sm",
                  warning.includes("No risks")
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"
                )}
              >
                <span className="mt-0.5">
                  {warning.includes("No risks") ? "✓" : "!"}
                </span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Decision Log */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Decision Log</h2>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger
              render={
                <Button className="gap-2 rounded-xl">
                  <Plus className="h-4 w-4" />
                  Add Entry
                </Button>
              }
            />
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New Decision Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label>Entry Type</Label>
                  <Select value={newEntry.entryType} onValueChange={(v: string | null) => v && setNewEntry({ ...newEntry, entryType: v })}>
                    <SelectTrigger className="rounded-xl w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ENTRY_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g. Dropped TU Munich due to low fit score"
                    value={newEntry.title}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Reasoning</Label>
                  <Textarea
                    placeholder="Why did you make this decision?"
                    value={newEntry.reasoning}
                    onChange={(e) => setNewEntry({ ...newEntry, reasoning: e.target.value })}
                    className="rounded-xl min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Related Application (optional)</Label>
                  <Select
                    value={newEntry.relatedApplicationId}
                    onValueChange={(v: string | null) => v && setNewEntry({ ...newEntry, relatedApplicationId: v })}
                  >
                    <SelectTrigger className="rounded-xl w-full">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={String(app.id)}>
                          {app.universityName} — {app.programName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter showCloseButton={false}>
                <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button
                  onClick={handleAddEntry}
                  disabled={!newEntry.title.trim() || !newEntry.reasoning.trim() || saving}
                  className="rounded-xl"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                  Add Entry
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search decision log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>

        {filteredDecisions.length > 0 ? (
          <div className="space-y-3">
            {filteredDecisions.map((entry) => (
              <Card key={entry.id} className="rounded-xl">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={cn("text-[11px]", ENTRY_TYPE_COLORS[entry.entryType] || ENTRY_TYPE_COLORS.strategy_note)}>
                          {entry.entryType.replace(/_/g, " ")}
                        </Badge>
                        {(entry.universityName || entry.programName) && (
                          <span className="text-xs text-muted-foreground truncate">
                            {entry.universityName}
                            {entry.universityName && entry.programName ? " · " : ""}
                            {entry.programName}
                          </span>
                        )}
                      </div>
                      <h4 className="font-medium text-sm">{entry.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.reasoning}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(entry.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="rounded-2xl border-0 card-shadow">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No decision entries yet</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Track your strategy changes and reasoning here
              </p>
              <Button className="rounded-xl gap-2" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" /> Add First Entry
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
