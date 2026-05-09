"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  User, Mail, Key, Bell, Trophy, Download, Palette,
  Monitor, Moon, Sun, Shield, Database, RotateCcw,
} from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [name, setName] = useState("Student");
  const [email, setEmail] = useState("student@example.com");
  const [apiKey, setApiKey] = useState("");
  const [gmailConnected, setGmailConnected] = useState(false);
  const [calendarSync, setCalendarSync] = useState(false);
  const [deadlineReminders, setDeadlineReminders] = useState(true);
  const [emailDigest, setEmailDigest] = useState(true);

  async function handleExport() {
    try {
      const [apps, docs, deadlines, emails, tasks, recs, log] = await Promise.all([
        fetch("/api/applications").then((r) => r.json()),
        fetch("/api/documents").then((r) => r.json()),
        fetch("/api/deadlines").then((r) => r.json()),
        fetch("/api/emails").then((r) => r.json()),
        fetch("/api/tasks").then((r) => r.json()),
        fetch("/api/recommenders").then((r) => r.json()),
        fetch("/api/decision-log").then((r) => r.json()),
      ]);
      const data = { applications: apps, documents: docs, deadlines, emails, tasks, recommenders: recs, decisionLog: log, exportedAt: new Date().toISOString() };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `admitus-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch {
      toast.error("Failed to export data");
    }
  }

  async function handleReset() {
    if (!confirm("This will delete all your data and re-seed the database. Are you sure?")) return;
    try {
      const res = await fetch("/api/applications");
      const apps = await res.json();
      for (const app of apps) {
        await fetch(`/api/applications/${app.id}`, { method: "DELETE" });
      }
      toast.success("Database reset. Please refresh the page.");
    } catch {
      toast.error("Failed to reset data");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences and integrations</p>
      </div>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <User className="h-4 w-4" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-xl" />
          </div>
          <Button size="sm" className="rounded-xl" onClick={() => toast.success("Profile saved")}>Save Profile</Button>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Integrations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Gmail Connection</div>
                <div className="text-xs text-muted-foreground">Auto-import admission emails</div>
              </div>
            </div>
            <Switch checked={gmailConnected} onCheckedChange={(v) => { setGmailConnected(v); toast.success(v ? "Gmail connected" : "Gmail disconnected"); }} />
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Key className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">LLM API Key</div>
                <div className="text-xs text-muted-foreground">For AI-powered features</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="rounded-xl" />
              <Button size="sm" className="rounded-xl" onClick={() => toast.success("API key saved")}>Save</Button>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-sm font-medium">Calendar Sync</div>
                <div className="text-xs text-muted-foreground">Sync deadlines to your calendar</div>
              </div>
            </div>
            <Switch checked={calendarSync} onCheckedChange={(v) => { setCalendarSync(v); toast.success(v ? "Calendar sync enabled" : "Calendar sync disabled"); }} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Deadline Reminders</div>
              <div className="text-xs text-muted-foreground">Get notified before deadlines</div>
            </div>
            <Switch checked={deadlineReminders} onCheckedChange={setDeadlineReminders} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Email Digest</div>
              <div className="text-xs text-muted-foreground">Weekly summary of activity</div>
            </div>
            <Switch checked={emailDigest} onCheckedChange={setEmailDigest} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-4 w-4" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setTheme("light")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${theme === "light" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              <Sun className="h-5 w-5" />
              <span className="text-xs font-medium">Light</span>
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${theme === "dark" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs font-medium">Dark</span>
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${theme === "system" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            >
              <Monitor className="h-5 w-5" />
              <span className="text-xs font-medium">System</span>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4" /> Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="rounded-xl gap-2 w-full" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export All Data (JSON)
          </Button>
          <Button variant="outline" className="rounded-xl gap-2 w-full text-destructive hover:text-destructive" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" /> Reset & Re-seed Database
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
