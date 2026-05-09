"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, MapPin, DollarSign, Languages, Star, Plus, Trash2, Edit3, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { cn, DEGREE_LEVELS } from "@/lib/utils";

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
  accentColor: string;
  isActive: boolean;
  notes: string | null;
};

const PRESET_COLORS = [
  { hex: "#1A4040", label: "Daintree" },
  { hex: "#11CDEF", label: "Cyan" },
  { hex: "#2DCE89", label: "Green" },
  { hex: "#FB6340", label: "Orange" },
  { hex: "#F5365C", label: "Red" },
  { hex: "#8965E0", label: "Purple" },
];

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const { fetchProfiles } = useAppStore();

  const defaultForm = {
    name: "",
    degreeLevel: "Masters",
    fieldOfStudy: "",
    targetCountries: "",
    hasIelts: false,
    ieltsScore: "",
    hasToefl: false,
    toeflScore: "",
    gpa: "",
    hasGre: false,
    greScore: "",
    budgetAmount: "",
    budgetCurrency: "CAD",
    accentColor: "#1A4040",
  };

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetch("/api/profiles").then(r => r.json()).then(data => { setProfiles(data); setLoading(false); });
  }, []);

  async function handleCreate() {
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name || "New Profile",
        degreeLevel: form.degreeLevel,
        fieldOfStudy: form.fieldOfStudy,
        targetCountries: form.targetCountries || "Canada",
        ieltsScore: form.hasIelts && form.ieltsScore ? parseFloat(form.ieltsScore) : null,
        toeflScore: form.hasToefl && form.toeflScore ? parseInt(form.toeflScore) : null,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        greScore: form.hasGre && form.greScore ? parseInt(form.greScore) : null,
        budgetAmount: form.budgetAmount ? parseFloat(form.budgetAmount) : null,
        budgetCurrency: form.budgetCurrency,
        accentColor: form.accentColor,
      }),
    });
    if (res.ok) {
      const profile = await res.json();
      if (cvFile) {
        const cvContent = await cvFile.text();
        await fetch("/api/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: `CV - ${form.name}`, type: "CV", content: cvContent, fileUrl: cvFile.name }),
        });
      }
      toast.success("Profile created");
      setShowNew(false);
      setCvFile(null);
      const fresh = await fetch("/api/profiles").then(r => r.json());
      setProfiles(fresh);
      fetchProfiles();
    }
  }

  async function handleDelete(id: number) {
    await fetch(`/api/profiles/${id}`, { method: "DELETE" });
    toast.success("Profile removed");
    setProfiles(p => p.filter(x => x.id !== id));
    fetchProfiles();
  }

  async function handleSetActive(id: number) {
    await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: true }),
    });
    setProfiles(p => p.map(x => ({ ...x, isActive: x.id === id })));
    fetchProfiles();
    toast.success("Active profile changed");
  }

  async function handleUpdate(id: number) {
    await fetch(`/api/profiles/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        degreeLevel: form.degreeLevel,
        fieldOfStudy: form.fieldOfStudy,
        targetCountries: form.targetCountries,
        ieltsScore: form.hasIelts && form.ieltsScore ? parseFloat(form.ieltsScore) : null,
        toeflScore: form.hasToefl && form.toeflScore ? parseInt(form.toeflScore) : null,
        gpa: form.gpa ? parseFloat(form.gpa) : null,
        greScore: form.hasGre && form.greScore ? parseInt(form.greScore) : null,
        budgetAmount: form.budgetAmount ? parseFloat(form.budgetAmount) : null,
        budgetCurrency: form.budgetCurrency,
        accentColor: form.accentColor,
      }),
    });
    setEditingId(null);
    const fresh = await fetch("/api/profiles").then(r => r.json());
    setProfiles(fresh);
    fetchProfiles();
    toast.success("Profile updated");
  }

  function startEdit(p: Profile) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      degreeLevel: p.degreeLevel,
      fieldOfStudy: p.fieldOfStudy,
      targetCountries: p.targetCountries,
      hasIelts: p.ieltsScore !== null,
      ieltsScore: p.ieltsScore?.toString() ?? "",
      hasToefl: p.toeflScore !== null,
      toeflScore: p.toeflScore?.toString() ?? "",
      gpa: p.gpa?.toString() ?? "",
      hasGre: p.greScore !== null,
      greScore: p.greScore?.toString() ?? "",
      budgetAmount: p.budgetAmount?.toString() ?? "",
      budgetCurrency: p.budgetCurrency ?? "CAD",
      accentColor: p.accentColor ?? "#1A4040",
    });
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading profiles...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profiles</h1>
          <p className="text-muted-foreground text-sm">Manage your application identities</p>
        </div>
        <Button onClick={() => { setShowNew(true); setEditingId(null); setForm(defaultForm); }} className="rounded-xl gap-2">
          <Plus className="h-4 w-4" /> New Profile
        </Button>
      </div>

      {/* New Profile Form */}
      {showNew && (
        <Card className="rounded-2xl border-2 border-primary/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">New Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm form={form} setForm={setForm} cvFile={cvFile} setCvFile={setCvFile} />
            <div className="flex gap-2 mt-4">
              <Button onClick={handleCreate} className="rounded-xl">Create Profile</Button>
              <Button variant="ghost" onClick={() => setShowNew(false)} className="rounded-xl">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {profiles.map((p) => (
          editingId === p.id ? (
            <Card key={p.id} className="rounded-2xl border-2 border-primary/40">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <ProfileForm form={form} setForm={setForm} cvFile={cvFile} setCvFile={setCvFile} />
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => handleUpdate(p.id)} className="rounded-xl gap-1"><Check className="h-4 w-4" /> Save</Button>
                  <Button variant="ghost" onClick={() => setEditingId(null)} className="rounded-xl gap-1"><X className="h-4 w-4" /> Cancel</Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={p.id} className={cn("rounded-2xl transition-all duration-200", p.isActive && "ring-2 ring-primary")}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">{p.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge className="text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium">{p.degreeLevel}</Badge>
                      <Badge className="text-xs rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-medium">{p.fieldOfStudy}</Badge>
                      {p.isActive && <Badge className="text-xs rounded-full font-medium">Active</Badge>}
                    </div>
                  </div>
                  <div className="h-12 w-12 flex items-center justify-center rounded-2xl shrink-0" style={{ backgroundColor: p.accentColor + "22" }}>
                    <GraduationCap className="h-6 w-6" style={{ color: p.accentColor }} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{p.targetCountries || "—"}</span></div>
                  <div className="flex items-center gap-2"><Languages className="h-4 w-4 shrink-0" /> <span>IELTS {p.ieltsScore ?? "—"}</span></div>
                  <div className="flex items-center gap-2"><Star className="h-4 w-4 shrink-0" /> <span>GPA {p.gpa ?? "—"}</span></div>
                  <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 shrink-0" /> <span>{p.budgetCurrency} {p.budgetAmount?.toLocaleString() ?? "—"}</span></div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1" onClick={() => startEdit(p)}><Edit3 className="h-3 w-3" /> Edit</Button>
                  {!p.isActive && <Button size="sm" variant="outline" className="rounded-xl text-xs gap-1" onClick={() => handleSetActive(p.id)}><Check className="h-3 w-3" /> Set Active</Button>}
                  <Button size="sm" variant="ghost" className="rounded-xl text-xs gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /> Delete</Button>
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>

      {profiles.length === 0 && !showNew && (
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-1">No profiles yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create a profile to track your application preferences</p>
            <Button className="rounded-xl gap-2" onClick={() => setShowNew(true)}><Plus className="h-4 w-4" /> New Profile</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type FormState = {
  name: string; degreeLevel: string; fieldOfStudy: string; targetCountries: string;
  hasIelts: boolean; ieltsScore: string;
  hasToefl: boolean; toeflScore: string;
  gpa: string;
  hasGre: boolean; greScore: string;
  budgetAmount: string; budgetCurrency: string; accentColor: string;
};

function ProfileForm({
  form,
  setForm,
  cvFile,
  setCvFile,
}: {
  form: FormState;
  setForm: (f: FormState) => void;
  cvFile: File | null;
  setCvFile: (f: File | null) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Profile Name */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Profile Name</Label>
        <Input
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. MS CS — Canada"
          className="rounded-xl"
        />
      </div>

      {/* Field of Study */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Field of Study</Label>
        <Input
          value={form.fieldOfStudy}
          onChange={e => setForm({ ...form, fieldOfStudy: e.target.value })}
          placeholder="e.g. Computer Science"
          className="rounded-xl"
        />
      </div>

      {/* Degree Level */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Degree Level</Label>
        <Select value={form.degreeLevel} onValueChange={v => setForm({ ...form, degreeLevel: v ?? form.degreeLevel })}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>{DEGREE_LEVELS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Target Countries */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Target Countries</Label>
        <Input
          value={form.targetCountries}
          onChange={e => setForm({ ...form, targetCountries: e.target.value })}
          placeholder="e.g. Canada, USA"
          className="rounded-xl"
        />
      </div>

      {/* IELTS */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">IELTS Score</Label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.hasIelts}
              onChange={e => setForm({ ...form, hasIelts: e.target.checked, ieltsScore: e.target.checked ? form.ieltsScore : "" })}
              className="h-3.5 w-3.5 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground">I have IELTS</span>
          </label>
        </div>
        <Input
          value={form.ieltsScore}
          onChange={e => setForm({ ...form, ieltsScore: e.target.value })}
          type="number"
          step="0.5"
          min="0"
          max="9"
          placeholder={form.hasIelts ? "e.g. 7.5" : "N/A"}
          disabled={!form.hasIelts}
          className="rounded-xl disabled:opacity-50"
        />
      </div>

      {/* TOEFL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">TOEFL Score</Label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.hasToefl}
              onChange={e => setForm({ ...form, hasToefl: e.target.checked, toeflScore: e.target.checked ? form.toeflScore : "" })}
              className="h-3.5 w-3.5 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground">I have TOEFL</span>
          </label>
        </div>
        <Input
          value={form.toeflScore}
          onChange={e => setForm({ ...form, toeflScore: e.target.value })}
          type="number"
          min="0"
          max="120"
          placeholder={form.hasToefl ? "e.g. 100" : "N/A"}
          disabled={!form.hasToefl}
          className="rounded-xl disabled:opacity-50"
        />
      </div>

      {/* GPA */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          GPA <span className="text-muted-foreground/60 font-normal">(optional)</span>
        </Label>
        <Input
          value={form.gpa}
          onChange={e => setForm({ ...form, gpa: e.target.value })}
          type="number"
          step="0.01"
          min="0"
          max="4"
          placeholder="e.g. 3.6"
          className="rounded-xl"
        />
      </div>

      {/* GRE */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label className="text-xs text-muted-foreground">GRE Score</Label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.hasGre}
              onChange={e => setForm({ ...form, hasGre: e.target.checked, greScore: e.target.checked ? form.greScore : "" })}
              className="h-3.5 w-3.5 rounded accent-primary"
            />
            <span className="text-xs text-muted-foreground">I have GRE</span>
          </label>
        </div>
        <Input
          value={form.greScore}
          onChange={e => setForm({ ...form, greScore: e.target.value })}
          type="number"
          min="260"
          max="340"
          placeholder={form.hasGre ? "e.g. 320" : "N/A"}
          disabled={!form.hasGre}
          className="rounded-xl disabled:opacity-50"
        />
      </div>

      {/* Budget */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          Budget <span className="text-muted-foreground/60 font-normal">(optional)</span>
        </Label>
        <Input
          value={form.budgetAmount}
          onChange={e => setForm({ ...form, budgetAmount: e.target.value })}
          type="number"
          placeholder="e.g. 40000"
          className="rounded-xl"
        />
      </div>

      {/* Currency */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Currency</Label>
        <Select value={form.budgetCurrency} onValueChange={v => setForm({ ...form, budgetCurrency: v ?? form.budgetCurrency })}>
          <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="CAD">CAD</SelectItem>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="EUR">EUR</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
            <SelectItem value="AUD">AUD</SelectItem>
            <SelectItem value="PKR">PKR</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Profile Color — color swatches instead of hex input */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs text-muted-foreground">Profile Color <span className="text-muted-foreground/60 font-normal">— used to visually distinguish profiles</span></Label>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c.hex}
              type="button"
              title={c.label}
              onClick={() => setForm({ ...form, accentColor: c.hex })}
              className={cn(
                "h-8 w-8 rounded-full border-2 transition-all",
                form.accentColor === c.hex
                  ? "border-foreground scale-110 shadow-md"
                  : "border-transparent hover:scale-105"
              )}
              style={{ backgroundColor: c.hex }}
            />
          ))}
          {/* Show current if it's a custom color not in presets */}
          {!PRESET_COLORS.some(c => c.hex === form.accentColor) && (
            <div
              className="h-8 w-8 rounded-full border-2 border-foreground scale-110 shadow-md shrink-0"
              style={{ backgroundColor: form.accentColor }}
              title="Current color"
            />
          )}
        </div>
      </div>

      {/* CV Upload */}
      <div className="space-y-1.5 sm:col-span-2">
        <Label className="text-xs text-muted-foreground">
          Upload CV <span className="text-muted-foreground/60 font-normal">(optional — PDF, Word, or text)</span>
        </Label>
        <input
          type="file"
          accept=".pdf,.txt,.doc,.docx"
          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-colors"
        />
        {cvFile && (
          <p className="text-xs text-muted-foreground">{cvFile.name}</p>
        )}
      </div>
    </div>
  );
}
