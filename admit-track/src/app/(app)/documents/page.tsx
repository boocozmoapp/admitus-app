"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { cn, DOCUMENT_TYPES } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Plus, FileText, FileCheck, GraduationCap, ScrollText, Languages, Plane,
  DollarSign, FileQuestion, Loader2, Search, Upload, Download, Trash2,
  CheckCircle2, Clock, Link, X, UserPlus, Mail, Building2, Briefcase,
  RefreshCw, Eye, ChevronDown, ChevronUp, FolderOpen,
} from "lucide-react";

type Document = {
  id: number;
  name: string;
  type: string;
  status: string;
  version: number;
  content: string | null;
  fileUrl: string | null;
  notes: string | null;
  applicationCount: number;
  linkedApplications: { applicationId: number; universityName: string; programName: string }[];
};

type Recommender = {
  id: number;
  name: string;
  email: string;
  designation: string | null;
  institution: string | null;
  notes: string | null;
  lorRequests: { id: number; status: string; universityName: string; programName: string }[];
};

const DOC_TYPE_ICON: Record<string, React.ElementType> = {
  SOP: ScrollText, CV: FileText, Transcript: GraduationCap, LOR: FileCheck,
  IELTS: Languages, TOEFL: Languages, Passport: Plane, FinancialProof: DollarSign, Other: FileQuestion,
};

const DOC_TYPE_COLOR: Record<string, string> = {
  SOP: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
  CV: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Transcript: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  LOR: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  IELTS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  TOEFL: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300",
  Passport: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  FinancialProof: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  Other: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

const LOR_STATUS_COLOR: Record<string, string> = {
  not_requested: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  requested: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  submitted: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  declined: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

function fileLabel(url: string) {
  const seg = url.split("/").pop() ?? url;
  // Strip timestamp suffix: name_1234567890123.ext → name.ext
  return seg.replace(/_(\d{13})(\.[^.]+)$/, "$2").replace(/^(.{0,40}).*(\.[^.]+)$/, "$1$2");
}

function fileExt(url: string) {
  return (url.split(".").pop() ?? "").toLowerCase();
}

function fileSizeLabel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Upload dropzone ──────────────────────────────────────────────────────────
function UploadZone({
  onUploaded,
  replace = false,
  loading,
  setLoading,
}: {
  onUploaded: (url: string, name: string, size: number) => void;
  replace?: boolean;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  async function upload(file: File) {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onUploaded(data.url, data.originalName, data.size);
      toast.success("File uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 cursor-pointer transition-colors",
        dragging
          ? "border-indigo-400 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20"
          : "border-border hover:border-indigo-300 hover:bg-muted/40 dark:hover:border-indigo-700"
      )}
    >
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.xls,.xlsx"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
      ) : (
        <Upload className="h-6 w-6 text-muted-foreground" />
      )}
      <div className="text-center">
        <p className="text-sm font-medium">
          {loading ? "Uploading…" : replace ? "Drop to replace or click to browse" : "Drop file here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">PDF, Word, image — max 10 MB</p>
      </div>
    </div>
  );
}

// ── File info row ────────────────────────────────────────────────────────────
function FileRow({ url, onReplace }: { url: string; onReplace: () => void }) {
  const ext = fileExt(url);
  const isImage = ["jpg", "jpeg", "png", "webp"].includes(ext);
  const isPdf = ext === "pdf";

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2.5">
      <div className="h-8 w-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
        {isImage ? <Eye className="h-4 w-4 text-indigo-600" /> :
         isPdf   ? <FileText className="h-4 w-4 text-indigo-600" /> :
                   <FileCheck className="h-4 w-4 text-indigo-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{fileLabel(url)}</p>
        <p className="text-[10px] text-muted-foreground uppercase">{ext} file</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          download
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          title="Download"
          onClick={(e) => e.stopPropagation()}
        >
          <Download className="h-3.5 w-3.5 text-indigo-600" />
        </a>
        <button
          onClick={(e) => { e.stopPropagation(); onReplace(); }}
          className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
          title="Replace file"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [recommenders, setRecommenders] = useState<Recommender[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showNewRec, setShowNewRec] = useState(false);
  const [linkDocId, setLinkDocId] = useState<number | null>(null);
  const [applications, setApplications] = useState<Array<{ id: number; universityName: string; programName: string }>>([]);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null); // doc id being uploaded
  const [replacingFor, setReplacingFor] = useState<number | null>(null); // doc id showing replace zone

  const [newDoc, setNewDoc] = useState({ name: "", type: "SOP", status: "draft", notes: "", fileUrl: "", fileName: "" });
  const [newDocUploading, setNewDocUploading] = useState(false);

  const [newRec, setNewRec] = useState({ name: "", email: "", designation: "", institution: "", notes: "" });

  async function reload() {
    const docs = await fetch("/api/documents").then(r => r.json());
    setDocuments(docs);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/documents").then(r => r.json()),
      fetch("/api/recommenders").then(r => r.json()),
    ]).then(([docs, recs]) => {
      setDocuments(docs);
      setRecommenders(recs);
      setLoading(false);
    });
  }, []);

  async function patchDoc(id: number, fields: Record<string, unknown>) {
    const res = await fetch("/api/documents", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...fields }),
    });
    if (!res.ok) throw new Error("Update failed");
    const updated = await res.json();
    setDocuments(prev => prev.map(d => d.id === id ? updated : d));
    return updated;
  }

  async function handleUploadForDoc(docId: number, url: string, name: string) {
    const doc = documents.find(d => d.id === docId);
    const newVersion = (doc?.version ?? 1) + (doc?.fileUrl ? 1 : 0);
    await patchDoc(docId, { fileUrl: url, version: newVersion });
    setReplacingFor(null);
    toast.success("File attached to document");
  }

  async function handleToggleStatus(doc: Document) {
    const next = doc.status === "draft" ? "final" : "draft";
    await patchDoc(doc.id, { status: next });
    toast.success(`Marked as ${next}`);
  }

  async function handleDeleteDoc(id: number) {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast.success("Document deleted");
  }

  async function handleCreateDoc() {
    if (!newDoc.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newDoc.name,
          type: newDoc.type,
          status: newDoc.status,
          notes: newDoc.notes || null,
          fileUrl: newDoc.fileUrl || null,
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setDocuments(prev => [...prev, created]);
      toast.success("Document created");
      setShowNewDoc(false);
      setNewDoc({ name: "", type: "SOP", status: "draft", notes: "", fileUrl: "", fileName: "" });
    } catch {
      toast.error("Failed to create document");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateRec() {
    if (!newRec.name.trim() || !newRec.email.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recommenders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRec),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setRecommenders(prev => [...prev, { ...created, lorRequests: [] }]);
      toast.success("Recommender added");
      setShowNewRec(false);
      setNewRec({ name: "", email: "", designation: "", institution: "", notes: "" });
    } catch {
      toast.error("Failed to add recommender");
    } finally {
      setSaving(false);
    }
  }

  async function handleLinkDoc(appId: number, docId: number) {
    await fetch("/api/application-documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId: appId, documentId: docId }),
    });
    toast.success("Linked to application");
    setLinkDocId(null);
    await reload();
  }

  async function handleUnlinkDoc(appId: number, docId: number) {
    await fetch(`/api/application-documents?applicationId=${appId}&documentId=${docId}`, { method: "DELETE" });
    toast.success("Unlinked");
    await reload();
  }

  async function openLinkModal(docId: number) {
    const apps = await fetch("/api/applications").then(r => r.json());
    setApplications(apps);
    setLinkDocId(docId);
  }

  const filteredDocs = documents.filter(d => {
    if (filterType !== "all" && d.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q);
    }
    return true;
  });

  // Group by type
  const grouped = DOCUMENT_TYPES.reduce((acc, t) => {
    acc[t] = filteredDocs.filter(d => d.type === t);
    return acc;
  }, {} as Record<string, Document[]>);
  const otherDocs = filteredDocs.filter(d => !DOCUMENT_TYPES.includes(d.type as typeof DOCUMENT_TYPES[number]));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  function DocCard({ doc }: { doc: Document }) {
    const isExpanded = expandedDoc === doc.id;
    const Icon = DOC_TYPE_ICON[doc.type] || FileQuestion;
    const isReplacing = replacingFor === doc.id;
    const isUploading = uploadingFor === doc.id;

    return (
      <Card
        className={cn(
          "rounded-xl transition-all",
          isExpanded ? "border-indigo-300 dark:border-indigo-700 shadow-sm" : "hover:border-indigo-200 dark:hover:border-indigo-800"
        )}
      >
        <CardContent className="pt-4 pb-3 px-4">
          {/* Header row */}
          <div
            className="flex items-start gap-3 cursor-pointer"
            onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
          >
            <div className={cn("rounded-lg p-2 shrink-0 mt-0.5", DOC_TYPE_COLOR[doc.type] || DOC_TYPE_COLOR.Other)}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-snug truncate">{doc.name}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-[11px] text-muted-foreground">v{doc.version}</span>
                <span className="text-muted-foreground/40">·</span>
                {doc.fileUrl ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-3 w-3" /> File attached
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                    <Clock className="h-3 w-3" /> No file yet
                  </span>
                )}
                <span className="text-muted-foreground/40">·</span>
                <span className="text-[11px] text-muted-foreground">
                  {doc.applicationCount} app{doc.applicationCount !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge
                onClick={(e) => { e.stopPropagation(); handleToggleStatus(doc); }}
                className={cn(
                  "text-[10px] cursor-pointer select-none transition-opacity hover:opacity-80",
                  doc.status === "final"
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                )}
                title="Click to toggle status"
              >
                {doc.status === "final" ? "Final" : "Draft"}
              </Badge>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
          </div>

          {/* Expanded panel */}
          {isExpanded && (
            <div className="mt-4 space-y-3" onClick={e => e.stopPropagation()}>
              <Separator />

              {/* File section */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">File</p>
                {doc.fileUrl && !isReplacing ? (
                  <FileRow url={doc.fileUrl} onReplace={() => setReplacingFor(doc.id)} />
                ) : (
                  <UploadZone
                    replace={!!doc.fileUrl}
                    loading={isUploading}
                    setLoading={(v) => setUploadingFor(v ? doc.id : null)}
                    onUploaded={(url, name, size) => handleUploadForDoc(doc.id, url, name)}
                  />
                )}
                {isReplacing && (
                  <button
                    onClick={() => setReplacingFor(null)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Cancel replace
                  </button>
                )}
              </div>

              {/* Notes */}
              {doc.notes && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                  <p className="text-xs text-muted-foreground">{doc.notes}</p>
                </div>
              )}

              {/* Linked applications */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Linked Applications</p>
                {doc.linkedApplications.length > 0 ? (
                  <div className="space-y-1">
                    {doc.linkedApplications.map(la => (
                      <div key={la.applicationId} className="flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-1.5 text-xs">
                        <span className="truncate text-muted-foreground">
                          <span className="font-medium text-foreground">{la.universityName}</span> · {la.programName}
                        </span>
                        <button
                          onClick={() => handleUnlinkDoc(la.applicationId, doc.id)}
                          className="ml-2 shrink-0 text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Not linked to any application yet</p>
                )}
                <Button
                  size="sm" variant="outline"
                  className="mt-2 rounded-lg text-xs h-7 gap-1"
                  onClick={() => openLinkModal(doc.id)}
                >
                  <Link className="h-3 w-3" /> Link to Application
                </Button>
              </div>

              {/* Delete */}
              <div className="pt-1">
                <Button
                  size="sm" variant="ghost"
                  className="rounded-lg text-xs h-7 gap-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={() => handleDeleteDoc(doc.id)}
                >
                  <Trash2 className="h-3 w-3" /> Delete document
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-muted-foreground text-sm">
            {documents.filter(d => d.fileUrl).length}/{documents.length} files uploaded · {recommenders.length} recommenders
          </p>
        </div>
      </div>

      <Tabs defaultValue="documents">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="recommenders">Recommenders</TabsTrigger>
        </TabsList>

        {/* ── Documents tab ── */}
        <TabsContent value="documents" className="space-y-5 pt-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
            </div>
            <Select value={filterType} onValueChange={v => setFilterType(v || "all")}>
              <SelectTrigger className="w-[150px] rounded-xl"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {DOCUMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Dialog open={showNewDoc} onOpenChange={setShowNewDoc}>
              <DialogTrigger render={
                <Button className="gap-2 rounded-xl ml-auto"><Plus className="h-4 w-4" /> New Document</Button>
              } />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>New Document</DialogTitle>
                  <DialogDescription>Create a document entry and optionally upload a file</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      placeholder="e.g. Statement of Purpose — MIT"
                      value={newDoc.name}
                      onChange={e => setNewDoc(p => ({ ...p, name: e.target.value }))}
                      className="rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select value={newDoc.type} onValueChange={v => setNewDoc(p => ({ ...p, type: v || "SOP" }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DOCUMENT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newDoc.status} onValueChange={v => setNewDoc(p => ({ ...p, status: v || "draft" }))}>
                        <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="final">Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>File <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    {newDoc.fileUrl ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20 px-3 py-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="text-sm text-emerald-700 dark:text-emerald-300 truncate flex-1">{newDoc.fileName}</span>
                        <button onClick={() => setNewDoc(p => ({ ...p, fileUrl: "", fileName: "" }))} className="text-muted-foreground hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <UploadZone
                        loading={newDocUploading}
                        setLoading={setNewDocUploading}
                        onUploaded={(url, name) => setNewDoc(p => ({ ...p, fileUrl: url, fileName: name }))}
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      placeholder="Any notes about this document…"
                      value={newDoc.notes}
                      onChange={e => setNewDoc(p => ({ ...p, notes: e.target.value }))}
                      className="rounded-xl"
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter showCloseButton={false}>
                  <Button variant="outline" onClick={() => setShowNewDoc(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={handleCreateDoc} disabled={!newDoc.name.trim() || saving} className="rounded-xl">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Stats summary */}
          {documents.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total", value: documents.length, color: "text-foreground" },
                { label: "Files Uploaded", value: documents.filter(d => d.fileUrl).length, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Finalized", value: documents.filter(d => d.status === "final").length, color: "text-indigo-600 dark:text-indigo-400" },
              ].map(s => (
                <div key={s.label} className="rounded-xl bg-muted/40 border border-border px-4 py-3 text-center">
                  <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          {documents.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FolderOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No documents yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Create your first document and upload the file</p>
                <Button className="rounded-xl gap-2" onClick={() => setShowNewDoc(true)}>
                  <Plus className="h-4 w-4" /> New Document
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {DOCUMENT_TYPES.map(type => {
                const typeDocs = grouped[type];
                if (!typeDocs || typeDocs.length === 0) return null;
                const Icon = DOC_TYPE_ICON[type] || FileQuestion;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">{type}</h3>
                      <Badge variant="outline" className="text-xs">{typeDocs.length}</Badge>
                      {typeDocs.every(d => d.fileUrl) && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium ml-auto">All uploaded ✓</span>
                      )}
                      {typeDocs.some(d => !d.fileUrl) && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium ml-auto">
                          {typeDocs.filter(d => !d.fileUrl).length} missing
                        </span>
                      )}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {typeDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
                    </div>
                  </div>
                );
              })}
              {otherDocs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileQuestion className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold">Other</h3>
                    <Badge variant="outline" className="text-xs">{otherDocs.length}</Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {otherDocs.map(doc => <DocCard key={doc.id} doc={doc} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── Recommenders tab ── */}
        <TabsContent value="recommenders" className="space-y-5 pt-4">
          <div className="flex justify-end">
            <Dialog open={showNewRec} onOpenChange={setShowNewRec}>
              <DialogTrigger render={
                <Button className="gap-2 rounded-xl"><UserPlus className="h-4 w-4" /> Add Recommender</Button>
              } />
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Recommender</DialogTitle>
                  <DialogDescription>Add a professor or supervisor for letters of recommendation</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input placeholder="Dr. Jane Smith" value={newRec.name} onChange={e => setNewRec(p => ({ ...p, name: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" placeholder="jane.smith@university.edu" value={newRec.email} onChange={e => setNewRec(p => ({ ...p, email: e.target.value }))} className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Designation</Label>
                      <Input placeholder="Professor" value={newRec.designation} onChange={e => setNewRec(p => ({ ...p, designation: e.target.value }))} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Institution</Label>
                      <Input placeholder="MIT" value={newRec.institution} onChange={e => setNewRec(p => ({ ...p, institution: e.target.value }))} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea placeholder="Optional notes…" value={newRec.notes} onChange={e => setNewRec(p => ({ ...p, notes: e.target.value }))} className="rounded-xl" rows={2} />
                  </div>
                </div>
                <DialogFooter showCloseButton={false}>
                  <Button variant="outline" onClick={() => setShowNewRec(false)} className="rounded-xl">Cancel</Button>
                  <Button onClick={handleCreateRec} disabled={!newRec.name.trim() || !newRec.email.trim() || saving} className="rounded-xl">
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
                    Add
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {recommenders.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <UserPlus className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-1">No recommenders yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Add professors who will write your letters of recommendation</p>
                <Button className="rounded-xl gap-2" onClick={() => setShowNewRec(true)}><UserPlus className="h-4 w-4" /> Add Recommender</Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Institution</TableHead>
                    <TableHead>LOR Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recommenders.map(rec => (
                    <TableRow key={rec.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center justify-center shrink-0">
                            {rec.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          {rec.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-muted-foreground text-sm">
                          <Mail className="h-3.5 w-3.5" /> {rec.email}
                        </span>
                      </TableCell>
                      <TableCell>
                        {rec.designation
                          ? <span className="flex items-center gap-1 text-sm"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" />{rec.designation}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {rec.institution
                          ? <span className="flex items-center gap-1 text-sm"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{rec.institution}</span>
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {rec.lorRequests.length > 0 ? (
                          <div className="space-y-1">
                            {rec.lorRequests.map(lor => (
                              <div key={lor.id} className="flex items-center gap-1.5">
                                <Badge className={cn("text-[10px]", LOR_STATUS_COLOR[lor.status] || LOR_STATUS_COLOR.not_requested)}>
                                  {lor.status.replace("_", " ")}
                                </Badge>
                                <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                                  {lor.universityName} · {lor.programName}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No requests</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Link to application modal */}
      <Dialog open={linkDocId !== null} onOpenChange={o => { if (!o) setLinkDocId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Link to Application</DialogTitle>
            <DialogDescription>Select an application to attach this document to</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 max-h-72 overflow-y-auto py-2">
            {applications
              .filter(a => {
                const doc = documents.find(d => d.id === linkDocId);
                return doc ? !doc.linkedApplications.some(la => la.applicationId === a.id) : true;
              })
              .map(app => (
                <button
                  key={app.id}
                  onClick={() => handleLinkDoc(app.id, linkDocId!)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium">{app.universityName}</p>
                  <p className="text-xs text-muted-foreground">{app.programName}</p>
                </button>
              ))}
            {applications.filter(a => {
              const doc = documents.find(d => d.id === linkDocId);
              return doc ? !doc.linkedApplications.some(la => la.applicationId === a.id) : true;
            }).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">All applications already linked</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
