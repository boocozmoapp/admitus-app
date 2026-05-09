"use client";

import { useEffect, useState, useMemo } from "react";
import { cn, daysUntil, urgencyColor, urgencyBg } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target, ArrowRight, GraduationCap, CalendarClock, ListTodo,
  ChevronLeft, ChevronRight, Sparkles, FileText, Loader2, AlertCircle,
} from "lucide-react";
import Link from "next/link";

type Application = {
  id: number; universityName: string; programName: string;
  degreeLevel: string; intakeTerm: string; intakeYear: number;
  applicationDeadline: string | null; status: string; priority: string;
  profileId: number | null;
};

type Deadline = {
  id: number; title: string; type: string; dueDate: string;
  completed: boolean; universityName: string | null; programName: string | null;
};

type Task = {
  id: number; title: string; dueDate: string | null;
  completed: boolean; priority: string;
};

const KANBAN_COLUMNS = [
  { key: "researching", label: "Researching" },
  { key: "preparing",   label: "Preparing"   },
  { key: "submitted",   label: "Submitted"   },
  { key: "interview",   label: "Interview"   },
  { key: "decided",     label: "Decided"     },
];

const STATUS_GROUPS: Record<string, string[]> = {
  researching: ["researching"],
  preparing:   ["preparing"],
  submitted:   ["submitted"],
  interview:   ["interview"],
  decided:     ["admitted", "rejected", "waitlisted", "withdrawn"],
};

const PRIORITY_ICON: Record<string, string> = {
  high: "🔴", medium: "🟡", low: "🟢",
};

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [deadlines,    setDeadlines]    = useState<Deadline[]>([]);
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [docCount,     setDocCount]     = useState(0);
  const [draggedId,    setDraggedId]    = useState<number | null>(null);
  const [weekOffset,   setWeekOffset]   = useState(0);
  const [summaryBullets,  setSummaryBullets]  = useState<string[]>([]);
  const [summaryLoading,  setSummaryLoading]  = useState(true);

  useEffect(() => {
    // Fast data (parallel)
    Promise.all([
      fetch("/api/applications").then(r => r.json()),
      fetch("/api/deadlines").then(r => r.json()),
      fetch("/api/tasks").then(r => r.json()),
      fetch("/api/documents").then(r => r.json()),
    ]).then(([apps, dls, tks, docs]) => {
      setApplications(apps);
      setDeadlines(dls);
      setTasks(tks);
      setDocCount(Array.isArray(docs) ? docs.length : 0);
    });

    // AI summary (slower — runs independently)
    setSummaryLoading(true);
    fetch("/api/weekly-summary")
      .then(r => r.json())
      .then(data => setSummaryBullets(data.bullets ?? []))
      .catch(() => setSummaryBullets([]))
      .finally(() => setSummaryLoading(false));
  }, []);

  async function handleStatusChange(appId: number, newStatus: string) {
    await fetch(`/api/applications/${appId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
  }

  // ── Calendar week ────────────────────────────────────────────────────────────
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + weekOffset * 7 - ((now.getDay() + 6) % 7));
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return d;
  });

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalApps      = applications.length;
  const submittedCount = applications.filter(a => a.status === "submitted").length;
  const pendingTasks   = tasks.filter(t => !t.completed).length;

  const upcomingDeadlines = deadlines.filter(d => {
    const days = daysUntil(d.dueDate);
    return days >= -7 && days <= 14 && !d.completed;
  });
  const upcomingTasks = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const days = daysUntil(t.dueDate);
    return days >= -7 && days <= 14;
  });
  const urgentDeadlines  = deadlines.filter(d => !d.completed && daysUntil(d.dueDate) >= 0 && daysUntil(d.dueDate) <= 7);
  const overdueDeadlines = deadlines.filter(d => !d.completed && daysUntil(d.dueDate) < 0);

  // ── Today's Quest — computed from real data ──────────────────────────────────
  const todayQuest = useMemo<{ text: string; link: string }>(() => {
    if (overdueDeadlines.length > 0) {
      const d = overdueDeadlines[0];
      return { text: `"${d.title}" is overdue — tackle it now.`, link: "/deadlines" };
    }
    const veryUrgent = urgentDeadlines.filter(d => daysUntil(d.dueDate) <= 2);
    if (veryUrgent.length > 0) {
      const d = veryUrgent[0];
      const days = daysUntil(d.dueDate);
      return {
        text: `"${d.title}" is due ${days === 0 ? "today" : `in ${days} day${days > 1 ? "s" : ""}`} — don't wait.`,
        link: "/deadlines",
      };
    }
    if (urgentDeadlines.length > 0) {
      const d = urgentDeadlines[0];
      const days = daysUntil(d.dueDate);
      return { text: `"${d.title}" is due in ${days} days — prepare early.`, link: "/deadlines" };
    }
    const highTask = tasks.find(
      t => !t.completed && t.priority === "high" && t.dueDate && daysUntil(t.dueDate) >= 0 && daysUntil(t.dueDate) <= 7
    );
    if (highTask) {
      return { text: `High-priority task: "${highTask.title}"`, link: "/applications" };
    }
    if (pendingTasks > 0) {
      return { text: `You have ${pendingTasks} pending task${pendingTasks > 1 ? "s" : ""}. Clear some off your list.`, link: "/applications" };
    }
    if (totalApps === 0) {
      return { text: "Start by adding your first application to track.", link: "/applications" };
    }
    return { text: "Review your application pipeline and update any statuses.", link: "/applications" };
  }, [overdueDeadlines, urgentDeadlines, tasks, pendingTasks, totalApps]);

  return (
    <div className="space-y-6 max-w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Your application pipeline at a glance</p>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Applications", value: totalApps,
            sub: `${submittedCount} submitted`, subColor: "text-emerald-600 dark:text-emerald-400",
            icon: GraduationCap, iconColor: "text-indigo-500", iconBg: "bg-indigo-50 dark:bg-indigo-900/30",
          },
          {
            label: "Urgent Deadlines", value: urgentDeadlines.length,
            sub: "next 7 days", subColor: "text-orange-500",
            icon: CalendarClock, iconColor: "text-orange-500", iconBg: "bg-orange-50 dark:bg-orange-900/30",
          },
          {
            label: "Pending Tasks", value: pendingTasks,
            sub: "to complete", subColor: "text-muted-foreground",
            icon: ListTodo, iconColor: "text-emerald-500", iconBg: "bg-emerald-50 dark:bg-emerald-900/30",
          },
          {
            label: "Documents", value: docCount,
            sub: "in library", subColor: "text-cyan-500",
            icon: FileText, iconColor: "text-cyan-500", iconBg: "bg-cyan-50 dark:bg-cyan-900/30",
          },
        ].map(s => (
          <Card key={s.label} className="rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{s.label}</div>
                  <div className="mt-1 text-3xl font-bold">{s.value}</div>
                  <div className={cn("mt-1 text-xs font-medium", s.subColor)}>{s.sub}</div>
                </div>
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-2xl shrink-0", s.iconBg)}>
                  <s.icon className={cn("h-5 w-5", s.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6 min-w-0">

          {/* ── Weekly Calendar ── */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold">This Week</CardTitle>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setWeekOffset(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[90px] text-center">
                  {weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                  {weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setWeekOffset(p => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {weekDays.map(day => {
                  const dayStr = day.toISOString().split("T")[0];
                  const dayDeadlines = upcomingDeadlines.filter(d => d.dueDate === dayStr);
                  const dayTasks     = upcomingTasks.filter(t => t.dueDate === dayStr);
                  const isToday      = day.toDateString() === now.toDateString();
                  const hasItems     = dayDeadlines.length + dayTasks.length > 0;
                  return (
                    <div
                      key={dayStr}
                      className={cn(
                        "flex-shrink-0 w-[120px] rounded-2xl border p-3",
                        isToday
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border bg-card hover:border-primary/30"
                      )}
                    >
                      <div className={cn("text-xs font-semibold", isToday ? "text-primary" : "text-muted-foreground")}>
                        {day.toLocaleDateString("en-US", { weekday: "short" })}
                      </div>
                      <div className={cn("text-xl font-bold", isToday ? "text-primary" : "text-foreground")}>
                        {day.getDate()}
                      </div>
                      {hasItems ? (
                        <div className="mt-1 space-y-1">
                          {dayDeadlines.map(d => (
                            <div key={d.id} className={cn("text-[10px] rounded-md px-1.5 py-0.5 truncate font-medium", urgencyBg(daysUntil(d.dueDate)))}>
                              {d.title}
                            </div>
                          ))}
                          {dayTasks.map(t => (
                            <div key={t.id} className="text-[10px] rounded-md bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-1.5 py-0.5 truncate font-medium">
                              {t.title}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="mt-2 text-[10px] text-muted-foreground/50">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── Kanban Pipeline ── */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold">Application Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {KANBAN_COLUMNS.map(col => {
                  const colApps = applications.filter(a => STATUS_GROUPS[col.key]?.includes(a.status));
                  return (
                    <div
                      key={col.key}
                      className="flex-shrink-0 w-48"
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => {
                        if (draggedId !== null) {
                          handleStatusChange(draggedId, col.key === "decided" ? "admitted" : col.key);
                          setDraggedId(null);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{col.label}</span>
                        <Badge variant="secondary" className="text-xs rounded-full px-2 py-0.5">{colApps.length}</Badge>
                      </div>
                      <div className="space-y-2 min-h-[80px]">
                        {colApps.length === 0 && (
                          <div className="rounded-xl border-2 border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                            Drop here
                          </div>
                        )}
                        {colApps.map(app => {
                          const days = app.applicationDeadline ? daysUntil(app.applicationDeadline) : null;
                          return (
                            <Link
                              key={app.id}
                              href={`/applications/${app.id}`}
                              draggable
                              onDragStart={() => setDraggedId(app.id)}
                              className="block rounded-xl border border-border bg-card p-3 hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-start justify-between gap-1">
                                <div className="font-semibold text-sm text-foreground truncate">{app.universityName}</div>
                                <span className="text-xs shrink-0">{PRIORITY_ICON[app.priority] ?? "🟡"}</span>
                              </div>
                              <div className="text-xs text-muted-foreground truncate mt-0.5">{app.programName}</div>
                              <div className="mt-2 flex items-center justify-between">
                                <div className="text-xs text-muted-foreground">{app.intakeTerm} {app.intakeYear}</div>
                                {days !== null && (
                                  <span className={cn("text-xs font-semibold", urgencyColor(days))}>
                                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                                  </span>
                                )}
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-4">

          {/* Urgent / Overdue Deadlines */}
          {(urgentDeadlines.length > 0 || overdueDeadlines.length > 0) && (
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/30">
                    <CalendarClock className="h-4 w-4 text-orange-500" />
                  </div>
                  {overdueDeadlines.length > 0 ? "Deadlines Needing Attention" : "Urgent Deadlines"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {overdueDeadlines.slice(0, 3).map(d => (
                  <div key={d.id} className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                    <span className="text-foreground truncate flex-1">{d.title}</span>
                    <span className="text-xs text-red-500 font-medium shrink-0">Overdue</span>
                  </div>
                ))}
                {urgentDeadlines.slice(0, 5 - overdueDeadlines.slice(0, 3).length).map(d => (
                  <div key={d.id} className="flex items-center gap-2 text-sm">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", daysUntil(d.dueDate) <= 2 ? "bg-red-500" : "bg-orange-400")} />
                    <span className="text-foreground truncate flex-1">{d.title}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{daysUntil(d.dueDate)}d</span>
                  </div>
                ))}
                <Link href="/deadlines" className="block mt-2">
                  <Button variant="ghost" size="sm" className="w-full rounded-xl text-xs h-7 text-muted-foreground">
                    View all deadlines <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Weekly Summary — AI powered */}
          <Card className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                Weekly Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating your summary…
                </div>
              ) : summaryBullets.length > 0 ? (
                <ul className="space-y-2">
                  {summaryBullets.map((b, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex gap-2 leading-relaxed">
                      <span className="text-primary font-bold shrink-0">•</span>
                      {b}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Add applications and deadlines to get your AI summary.</p>
              )}
            </CardContent>
          </Card>

          {/* Today's Quest — data-driven */}
          <Card className="rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40 border-orange-200/60 dark:border-orange-800/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-900/40">
                  <Target className="h-4 w-4 text-orange-500" />
                </div>
                Today&apos;s Quest
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed">{todayQuest.text}</p>
              <Link href={todayQuest.link}>
                <Button className="mt-4 rounded-xl px-5 text-sm font-medium transition-all duration-200 active:scale-95">
                  Go →
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
