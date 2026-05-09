"use client";

import { useEffect, useState, useMemo } from "react";
import { cn, daysUntil, urgencyColor, urgencyBg } from "@/lib/utils";
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
  Plus, Calendar, Clock, ChevronLeft, ChevronRight, CheckCircle2, Circle, Filter, X, Loader2,
} from "lucide-react";

type Deadline = {
  id: number;
  applicationId: number | null;
  title: string;
  type: string;
  dueDate: string;
  completed: boolean;
  notes: string | null;
  universityName: string | null;
  programName: string | null;
  createdAt: string;
};

const DEADLINE_TYPES = ["application", "document", "fee", "visa", "scholarship", "interview", "other"] as const;

const TYPE_COLORS: Record<string, string> = {
  application: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  document: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  fee: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  visa: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  scholarship: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  interview: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  other: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DeadlinesPage() {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [filterTypes, setFilterTypes] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [newDeadline, setNewDeadline] = useState({
    title: "",
    type: "application",
    dueDate: "",
    applicationId: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/deadlines")
      .then((r) => r.json())
      .then((data) => {
        setDeadlines(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    if (filterTypes.length === 0) return deadlines;
    return deadlines.filter((d) => filterTypes.includes(d.type));
  }, [deadlines, filterTypes]);

  const calendarDeadlines = useMemo(() => {
    return filtered.filter((d) => {
      const date = new Date(d.dueDate);
      return date.getMonth() === calendarMonth && date.getFullYear() === calendarYear;
    });
  }, [filtered, calendarMonth, calendarYear]);

  const grouped = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const groups: Record<string, Deadline[]> = {
      Overdue: [],
      "This Week": [],
      "This Month": [],
      Later: [],
    };

    const sorted = [...filtered].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    for (const d of sorted) {
      const due = new Date(d.dueDate);
      due.setHours(0, 0, 0, 0);
      if (d.completed) {
        continue;
      }
      if (due < now) {
        groups["Overdue"].push(d);
      } else if (due <= endOfWeek) {
        groups["This Week"].push(d);
      } else if (due.getMonth() === now.getMonth() && due.getFullYear() === now.getFullYear()) {
        groups["This Month"].push(d);
      } else {
        groups["Later"].push(d);
      }
    }

    const completed = sorted.filter((d) => d.completed);
    if (completed.length > 0) {
      groups["Completed"] = completed;
    }

    return groups;
  }, [filtered]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(calendarYear, calendarMonth, 0).getDate();
    const days: Array<{ date: number; month: "prev" | "current" | "next"; fullDate: string }> = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = calendarMonth === 0 ? 11 : calendarMonth - 1;
      const y = calendarMonth === 0 ? calendarYear - 1 : calendarYear;
      days.push({ date: d, month: "prev", fullDate: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        month: "current",
        fullDate: `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      });
    }

    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = calendarMonth === 11 ? 0 : calendarMonth + 1;
      const y = calendarMonth === 11 ? calendarYear + 1 : calendarYear;
      days.push({ date: d, month: "next", fullDate: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}` });
    }

    return days;
  }, [calendarMonth, calendarYear]);

  const deadlineMapByDate = useMemo(() => {
    const map: Record<string, Deadline[]> = {};
    for (const d of calendarDeadlines) {
      const dateKey = d.dueDate.split("T")[0];
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(d);
    }
    return map;
  }, [calendarDeadlines]);

  function prevMonth() {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  }

  function nextMonth() {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  }

  async function handleToggle(deadline: Deadline) {
    const newCompleted = !deadline.completed;
    setTogglingId(deadline.id);
    try {
      const res = await fetch("/api/deadlines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deadline.id, completed: newCompleted }),
      });
      if (!res.ok) throw new Error();
      setDeadlines((prev) =>
        prev.map((d) => (d.id === deadline.id ? { ...d, completed: newCompleted } : d))
      );
      toast.success(newCompleted ? "Deadline completed" : "Deadline reopened");
    } catch {
      toast.error("Failed to update deadline");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleAddDeadline() {
    if (!newDeadline.title.trim() || !newDeadline.dueDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/deadlines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newDeadline.title,
          type: newDeadline.type,
          dueDate: newDeadline.dueDate,
          applicationId: newDeadline.applicationId ? parseInt(newDeadline.applicationId) : null,
          notes: newDeadline.notes || null,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setDeadlines((prev) => [...prev, created]);
      toast.success("Deadline added");
      setShowAddDialog(false);
      setNewDeadline({ title: "", type: "application", dueDate: "", applicationId: "", notes: "" });
    } catch {
      toast.error("Failed to add deadline");
    } finally {
      setSaving(false);
    }
  }

  function toggleFilter(type: string) {
    setFilterTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading deadlines...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Deadlines</h1>
          <p className="text-muted-foreground">
            {deadlines.filter((d) => !d.completed).length} upcoming · {deadlines.filter((d) => d.completed).length} completed
          </p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger
            render={
              <Button className="gap-2 rounded-xl">
                <Plus className="h-4 w-4" />
                Add Deadline
              </Button>
            }
          />
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New Deadline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Submit transcript"
                  value={newDeadline.title}
                  onChange={(e) => setNewDeadline({ ...newDeadline, title: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={newDeadline.type} onValueChange={(v: string | null) => v && setNewDeadline({ ...newDeadline, type: v })}>
                    <SelectTrigger className="rounded-xl w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEADLINE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newDeadline.dueDate}
                    onChange={(e) => setNewDeadline({ ...newDeadline, dueDate: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Optional notes..."
                  value={newDeadline.notes}
                  onChange={(e) => setNewDeadline({ ...newDeadline, notes: e.target.value })}
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter showCloseButton={false}>
              <Button variant="outline" onClick={() => setShowAddDialog(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleAddDeadline} disabled={!newDeadline.title.trim() || !newDeadline.dueDate || saving} className="rounded-xl">
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                Add Deadline
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {DEADLINE_TYPES.map((type) => (
          <button
            key={type}
            onClick={() => toggleFilter(type)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors border",
              filterTypes.includes(type)
                ? TYPE_COLORS[type]
                : "bg-background text-muted-foreground border-border hover:bg-muted"
            )}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
        {filterTypes.length > 0 && (
          <Button variant="ghost" size="sm" className="gap-1 rounded-xl" onClick={() => setFilterTypes([])}>
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
      </div>

      <Card className="rounded-xl overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon-sm" onClick={prevMonth} className="rounded-lg">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-semibold">
              {MONTHS[calendarMonth]} {calendarYear}
            </h2>
            <Button variant="ghost" size="icon-sm" onClick={nextMonth} className="rounded-lg">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-px">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                {d}
              </div>
            ))}
            {calendarDays.map((day, i) => {
              const dayDeadlines = deadlineMapByDate[day.fullDate] || [];
              const isToday = day.fullDate === todayStr;
              const isCurrent = day.month === "current";
              return (
                <div
                  key={i}
                  className={cn(
                    "relative min-h-[72px] border-t border-border p-1.5 transition-colors",
                    !isCurrent && "bg-muted/30",
                    isCurrent && "hover:bg-muted/50"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-medium inline-flex items-center justify-center size-6 rounded-full",
                      isToday && "bg-primary text-primary-foreground",
                      !isToday && isCurrent && "text-foreground",
                      !isToday && !isCurrent && "text-muted-foreground/50"
                    )}
                  >
                    {day.date}
                  </span>
                  {dayDeadlines.length > 0 && (
                    <div className="mt-1 flex flex-col gap-0.5">
                      {dayDeadlines.slice(0, 2).map((d) => {
                        const days = daysUntil(d.dueDate);
                        return (
                          <div
                            key={d.id}
                            className={cn(
                              "truncate text-[10px] leading-tight px-1 py-0.5 rounded",
                              d.completed
                                ? "line-through bg-muted text-muted-foreground"
                                : cn(urgencyBg(days), "text-foreground")
                            )}
                          >
                            {d.title}
                          </div>
                        );
                      })}
                      {dayDeadlines.length > 2 && (
                        <span className="text-[10px] text-muted-foreground pl-1">+{dayDeadlines.length - 2} more</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {Object.entries(grouped).map(([label, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={label}>
              <div className="flex items-center gap-2 mb-3">
                <h3
                  className={cn(
                    "text-sm font-semibold",
                    label === "Overdue" && "text-red-600 dark:text-red-400",
                    label === "This Week" && "text-amber-600 dark:text-amber-400",
                    label === "This Month" && "text-emerald-600 dark:text-emerald-400",
                    label === "Later" && "text-muted-foreground",
                    label === "Completed" && "text-muted-foreground"
                  )}
                >
                  {label === "Overdue" && <Clock className="inline h-4 w-4 mr-1" />}
                  {label === "This Week" && <Calendar className="inline h-4 w-4 mr-1" />}
                  {label}
                </h3>
                <Badge variant="outline" className="text-xs">{items.length}</Badge>
              </div>
              <div className="space-y-2">
                {items.map((d) => {
                  const days = daysUntil(d.dueDate);
                  const isToggling = togglingId === d.id;
                  return (
                    <Card
                      key={d.id}
                      className={cn(
                        "rounded-xl transition-all",
                        d.completed && "opacity-60",
                        !d.completed && cn("border", urgencyBg(days))
                      )}
                    >
                      <CardContent className="flex items-center gap-3 py-3">
                        <button
                          onClick={() => handleToggle(d)}
                          disabled={isToggling}
                          className="shrink-0 mt-0.5"
                        >
                          {isToggling ? (
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          ) : d.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className={cn("h-5 w-5", urgencyColor(days))} />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className={cn("text-sm font-medium", d.completed && "line-through")}>
                            {d.title}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {(d.universityName || d.programName) && (
                              <span className="text-xs text-muted-foreground truncate">
                                {d.universityName}{d.universityName && d.programName ? " · " : ""}{d.programName}
                              </span>
                            )}
                            {d.notes && (
                              <span className="text-xs text-muted-foreground/70 truncate max-w-[200px]">{d.notes}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge className={cn("text-[11px]", TYPE_COLORS[d.type] || TYPE_COLORS.other)}>
                            {d.type}
                          </Badge>
                          {!d.completed && (
                            <span className={cn("text-xs font-medium whitespace-nowrap", urgencyColor(days))}>
                              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(d.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <Card className="rounded-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-1">No deadlines found</h3>
              <p className="text-muted-foreground text-sm mb-4">
                {filterTypes.length > 0
                  ? "Try adjusting your filters or add a new deadline"
                  : "Start by adding your first deadline"}
              </p>
              <Button className="rounded-xl gap-2" onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4" /> Add Deadline
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}