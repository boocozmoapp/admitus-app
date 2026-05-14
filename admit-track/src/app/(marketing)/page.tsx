"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookmarkCheck,
  Bookmark,
  Calendar,
  DollarSign,
  Eye,
  Gauge,
  Globe,
  GraduationCap,
  MapPin,
  Medal,
  MessageSquareText,
  Plus,
  Search,
  Sparkles,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const features = [
  {
    label: "Programs",
    title: "Find current programs faster.",
    description:
      "Search across universities with updated requirements, deadlines, funding notes, and fit signals surfaced through AdmitUs specialized LLMs.",
    icon: Search,
    accent: "#11C997",
    preview: "search",
  },
  {
    label: "Professors",
    title: "Find professors who fit your research.",
    description:
      "Match your interests to faculty profiles, then shape a cold-email and follow-up strategy around research fit instead of generic outreach.",
    icon: Users2,
    accent: "#0F766E",
    preview: "professors",
  },
  {
    label: "Pipeline",
    title: "Keep every application moving.",
    description:
      "Turn a shortlist into a clean application pipeline with statuses, documents, deadlines, and next actions in one place.",
    icon: BarChart3,
    accent: "#1A4040",
    preview: "dashboard",
  },
  {
    label: "Funding",
    title: "See how your funding strategy is trending.",
    description:
      "Estimate scholarship and funding chances from profile strength, applications, outreach volume, and professor response ratio.",
    icon: Gauge,
    accent: "#5B6CFF",
    preview: "funding",
  },
  {
    label: "Chat",
    title: "Ask questions with context.",
    description:
      "Use LLM guidance that understands the program, your profile, and admissions context instead of giving generic advice.",
    icon: MessageSquareText,
    accent: "#6A9A9A",
    preview: "chat",
  },
];

const stats = [
  { value: "Live", label: "LLM-updated program intelligence" },
  { value: "12k+", label: "Programs discoverable" },
  { value: "40+", label: "Countries covered" },
];

const workflow = [
  {
    title: "Discover",
    desc: "Search programs, compare requirements, and understand fit before you commit.",
    icon: Search,
  },
  {
    title: "Organize",
    desc: "Save programs, build a pipeline, and keep deadlines and documents visible.",
    icon: BookmarkCheck,
  },
  {
    title: "Improve",
    desc: "Use outreach, funding signals, and contextual AI feedback to choose your next move.",
    icon: Sparkles,
  },
];

const programs = [
  { school: "University of Toronto", program: "MSc Computer Science", detail: "Fall 2026 - Scholarship available", score: "72" },
  { school: "TU Munich", program: "MSc Informatics", detail: "Fall 2026 - EUR 0 tuition", score: "87" },
  { school: "McGill University", program: "MEng Electrical & Computer Engineering", detail: "Fall 2026 - Funding route tracked", score: "62" },
];

type PreviewKind = (typeof features)[number]["preview"];

export default function LandingPage() {
  const [active, setActive] = useState(0);
  const feature = features[active];
  const Icon = feature.icon;

  return (
    <div className="min-h-screen bg-[#F8F5E6] text-[#022226]">
      <header className="sticky top-0 z-50 border-b border-[#022226]/8 bg-[#F8F5E6]/88 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" aria-label="AdmitUs home">
            <BrandLogo tone="dark" markClassName="h-10 w-9" textClassName="text-lg" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {[
              ["Programs", "#programs"],
              ["Features", "#features"],
              ["Workflow", "#workflow"],
            ].map(([label, href]) => (
              <a key={label} href={href} className="text-sm font-medium text-[#1A4040]/62 transition-colors hover:text-[#022226]">
                {label}
              </a>
            ))}
          </nav>
          <Link href="/login">
            <Button className="h-10 rounded-full bg-[#022226] px-5 text-sm font-semibold text-[#F7E28B] hover:bg-[#1A4040]">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <section className="px-6 pb-16 pt-16 md:pb-24 md:pt-20">
          <div className="mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl text-center">
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#6A9A9A]">
                Admissions intelligence and management workspace
              </p>
              <h1 className="font-heading text-5xl font-extrabold leading-[0.98] tracking-tight text-[#022226] md:text-7xl">
                Find the right program before you apply.
              </h1>
              <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-[#1A4040]/70 md:text-lg">
                AdmitUs helps you discover updated program information through specialized LLMs, then organize applications,
                documents, professor outreach, and funding signals in one focused workspace.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="h-12 rounded-full bg-[#022226] px-7 text-base font-semibold text-[#F7E28B] hover:bg-[#1A4040]">
                    Start for free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a
                  href="#features"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#022226]/14 px-7 text-base font-semibold text-[#022226] transition-colors hover:border-[#022226]/30"
                >
                  View product
                </a>
              </div>
            </div>

            <div id="features" className="mt-14 rounded-[2rem] border border-[#022226]/10 bg-[#FFFDF0] p-3 shadow-[0_24px_80px_rgba(2,34,38,0.10)]">
              <div className="grid gap-3 lg:grid-cols-[300px_1fr]">
                <aside className="rounded-[1.4rem] bg-[#F3EFD8] p-4">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[#022226] text-[#F7E28B]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A9A9A]">Product view</p>
                      <p className="font-heading text-lg font-extrabold">{feature.label}</p>
                    </div>
                  </div>
                  <h2 className="font-heading text-3xl font-extrabold leading-tight tracking-tight text-[#022226]">{feature.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-[#1A4040]/68">{feature.description}</p>
                  <div className="mt-7 grid gap-2">
                    {features.map((item, index) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => setActive(index)}
                          className={cn(
                            "flex items-center gap-3 rounded-full px-3 py-2 text-left text-sm font-semibold text-[#1A4040]/60 transition-colors hover:bg-[#FFFDF0] hover:text-[#022226]",
                            index === active && "bg-[#022226] text-[#F7E28B] hover:bg-[#022226] hover:text-[#F7E28B]"
                          )}
                        >
                          <ItemIcon className="h-4 w-4" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </aside>
                <div className="overflow-hidden rounded-[1.4rem] border border-[#022226]/8 bg-[#022226]">
                  <div className="flex h-10 items-center gap-2 border-b border-[#AAD8D8]/10 px-4">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F76363]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#F7E28B]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#40E0B2]" />
                    <span className="ml-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#AAD8D8]/60">admitus workspace</span>
                  </div>
                  <div className="min-h-[430px] p-5 md:p-7">
                    <ProductPreview kind={feature.preview as PreviewKind} accent={feature.accent} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#022226]/8 bg-[#022226] px-6 py-7 text-[#F8F5E6]">
          <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-heading text-3xl font-extrabold text-[#F7E28B]">{stat.value}</p>
                <p className="mt-1 text-sm text-[#AAD8D8]/72">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="workflow" className="px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A9A9A]">Workflow</p>
              <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-[#022226] md:text-5xl">
                A simpler way to manage applications.
              </h2>
            </div>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {workflow.map((item) => {
                const StepIcon = item.icon;
                return (
                  <article key={item.title} className="rounded-3xl border border-[#022226]/10 bg-[#FFFDF0] p-7">
                    <StepIcon className="h-5 w-5 text-[#1A4040]" />
                    <h3 className="mt-8 font-heading text-2xl font-extrabold tracking-tight">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-[#1A4040]/65">{item.desc}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="programs" className="bg-[#F1ECD4] px-6 py-24">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6A9A9A]">Programs first</p>
                <h2 className="mt-4 font-heading text-4xl font-extrabold tracking-tight text-[#022226] md:text-5xl">
                  Start with better information.
                </h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-[#1A4040]/65">
                The shortlist starts with current admissions details, not stale rows in a spreadsheet.
              </p>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {programs.map((program) => (
                <article key={program.program} className="rounded-3xl border border-[#022226]/10 bg-[#FFFDF0] p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-[#6A9A9A]">{program.school}</p>
                      <h3 className="mt-2 font-heading text-xl font-extrabold leading-tight tracking-tight">{program.program}</h3>
                    </div>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#022226] text-sm font-extrabold text-[#F7E28B]">
                      {program.score}
                    </span>
                  </div>
                  <p className="mt-6 text-sm text-[#1A4040]/65">{program.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-4xl font-extrabold tracking-tight md:text-5xl">Ready to get organized?</h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#1A4040]/65">
              Build a focused admissions workspace before deadlines, documents, and outreach get scattered.
            </p>
            <Link href="/login" className="mt-8 inline-flex">
              <Button size="lg" className="h-12 rounded-full bg-[#022226] px-8 text-base font-semibold text-[#F7E28B] hover:bg-[#1A4040]">
                Start for free <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#022226]/8 px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-[#1A4040]/60 sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo tone="dark" markClassName="h-8 w-7" textClassName="text-base" />
          <p>Copyright 2026 AdmitUs. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function ProductPreview({ kind, accent }: { kind: PreviewKind; accent: string }) {
  if (kind === "dashboard") return <DashboardPreview accent={accent} />;
  if (kind === "funding") return <FundingPreview accent={accent} />;
  if (kind === "professors") return <ProfessorsPreview accent={accent} />;
  if (kind === "chat") return <ChatPreview accent={accent} />;
  return <SearchPreview accent={accent} />;
}

function SearchPreview({ accent }: { accent: string }) {
  const searchPrograms = [
    {
      title: "MSc Informatics",
      school: "TU Munich - Munich, Germany",
      score: "87",
      rank: "#29 QS",
      tuition: "EUR 0/yr",
      intake: "Fall 2026",
      deadline: "Due Aug 29",
      ielts: "IELTS >=6.5",
      toefl: "TOEFL >88",
      gpa: "GPA >=3",
    },
    {
      title: "MSc Computer Science",
      school: "University of Toronto - Toronto, Canada",
      score: "72",
      rank: "#21 QS",
      tuition: "CA$58,680/yr",
      intake: "Fall 2026",
      deadline: "Due Sep 11",
      ielts: "IELTS >=7",
      toefl: "TOEFL >=100",
      gpa: "GPA >=3.5",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A9A9A]">University Search</p>
          <h3 className="mt-2 font-heading text-3xl font-extrabold text-[#F8F5E6]">37 programs across 20 universities</h3>
        </div>
        <div className="flex w-fit rounded-full bg-[#F8F5E6] p-1 text-xs font-bold text-[#022226]">
          <span className="rounded-full bg-[#F7E28B] px-4 py-2">All programs</span>
          <span className="px-4 py-2 text-[#6A9A9A]">Saved</span>
        </div>
      </div>
      <div className="grid gap-3 text-sm text-[#AAD8D8] md:grid-cols-[1fr_120px_140px]">
        <div className="rounded-2xl border border-[#AAD8D8]/12 bg-[#041C20] px-4 py-3">Computer science, Germany, funding</div>
        <div className="rounded-2xl border border-[#AAD8D8]/12 bg-[#041C20] px-4 py-3">Masters</div>
        <div className="rounded-2xl border border-[#AAD8D8]/12 bg-[#041C20] px-4 py-3">Scholarship</div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {searchPrograms.map((program) => (
          <article key={program.title} className="rounded-[1.4rem] border border-[#AAD8D8]/10 bg-[#1A4040] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h4 className="font-heading text-xl font-extrabold leading-tight text-[#F8F5E6]">{program.title}</h4>
                <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#AAD8D8]/72">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  {program.school}
                </p>
              </div>
              <LandingFitScoreRing score={Number(program.score)} accent={accent} />
              <Bookmark className="h-5 w-5 shrink-0 text-[#AAD8D8]/72" />
            </div>

            <div className="mt-5 grid gap-2 text-sm text-[#F8F5E6]">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-[#F8F5E6]" />
                <span className="font-semibold">Masters</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-[#F8F5E6]" />
                <span className="font-semibold">English</span>
              </div>
              <div className="flex items-center gap-2 text-[#49F2B3]">
                <Sparkles className="h-4 w-4" />
                <span className="font-semibold">Scholarship</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#2E4A72] px-3 py-1.5 text-[#AFC4FF]">
                <Medal className="h-3.5 w-3.5" /> {program.rank}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#AAD8D8]/12 px-3 py-1.5 text-[#AAD8D8]">
                <DollarSign className="h-3.5 w-3.5" /> {program.tuition}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[#AAD8D8]/12 px-3 py-1.5 text-[#AAD8D8]">
                <Calendar className="h-3.5 w-3.5" /> {program.intake}
              </span>
              <span className="rounded-full bg-[#AAD8D8]/12 px-3 py-1.5 text-[#AAD8D8]">{program.deadline}</span>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-[#F8F5E6]">
              {[program.ielts, program.toefl, program.gpa].map((tag) => (
                <span key={tag} className="rounded-full border border-[#AAD8D8]/18 px-3 py-1.5">{tag}</span>
              ))}
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#AAD8D8]/18 px-4 py-2 text-sm font-bold text-[#F8F5E6]">
                <Eye className="h-4 w-4" /> Details
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#F7E28B] px-4 py-2 text-sm font-bold text-[#022226]">
                <Plus className="h-4 w-4" /> Pipeline
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function LandingFitScoreRing({ score, accent }: { score: number; accent: string }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(170,216,216,0.16)" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          stroke={accent}
          strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-sm font-extrabold" style={{ color: accent }}>
        {score}
      </span>
    </div>
  );
}

function DashboardPreview({ accent }: { accent: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[150px_1fr]">
      <aside className="hidden rounded-3xl bg-[#041C20] p-4 lg:block">
        <p className="font-heading text-lg font-extrabold text-[#F7E28B]">AdmitUs</p>
        <div className="mt-8 space-y-2 text-sm text-[#AAD8D8]/60">
          {["Dashboard", "Search", "Applications", "Supervisors", "Insights"].map((item, index) => (
            <div key={item} className={cn("rounded-full px-3 py-2", index === 0 && "bg-[#1A4040] text-[#F8F5E6]")}>
              {item}
            </div>
          ))}
        </div>
      </aside>
      <div className="space-y-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A9A9A]">Dashboard</p>
            <h3 className="mt-2 font-heading text-3xl font-extrabold text-[#F8F5E6]">Hey there</h3>
          </div>
          <span className="rounded-full bg-[#F7E28B] px-4 py-2 text-sm font-bold text-[#022226]">62% ready</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Active", "14"],
            ["Due soon", "5"],
            ["Emails", "38"],
            ["Funding", "72"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl bg-[#1A4040] p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-[#6A9A9A]">{label}</p>
              <p className="mt-3 font-heading text-3xl font-extrabold text-[#F8F5E6]">{value}</p>
            </div>
          ))}
        </div>
        <div className="space-y-3">
          {[
            ["McGill - MSc CS", "submitted", "100%"],
            ["TU Munich - Informatics", "preparing", "74%"],
            ["Sciences Po - Public Affairs", "documents", "48%"],
          ].map(([name, status, progress]) => (
            <div key={name} className="rounded-2xl bg-[#092B2F] p-4">
              <div className="mb-3 flex justify-between text-sm">
                <span className="font-semibold text-[#F8F5E6]">{name}</span>
                <span className="text-[#AAD8D8]">{status}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#AAD8D8]/10">
                <div className="h-full rounded-full" style={{ width: progress, backgroundColor: accent }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FundingPreview({ accent }: { accent: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <div className="rounded-3xl bg-[#1A4040] p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A9A9A]">Funding meter</p>
        <div className="mx-auto mt-8 grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(${accent} 0 72%, rgba(170,216,216,.12) 72% 100%)` }}>
          <div className="grid h-28 w-28 place-items-center rounded-full bg-[#022226] text-center">
            <div>
              <p className="font-heading text-4xl font-extrabold text-[#F8F5E6]">72</p>
              <p className="text-xs text-[#AAD8D8]">odds score</p>
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Emails sent", "38"],
          ["Reply ratio", "24%"],
          ["Applications", "9"],
          ["Profile fit", "84"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-3xl bg-[#092B2F] p-6">
            <p className="text-xs uppercase tracking-[0.14em] text-[#6A9A9A]">{label}</p>
            <p className="mt-4 font-heading text-4xl font-extrabold text-[#F8F5E6]">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfessorsPreview({ accent }: { accent: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_230px]">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A9A9A]">Research-fit shortlist</p>
          <h3 className="mt-2 font-heading text-3xl font-extrabold text-[#F8F5E6]">Faculty matched to your topic</h3>
        </div>
        {[
          ["Prof. Amina Shah", "NLP for education", "Lead with your thesis dataset", "92%"],
          ["Dr. Lukas Weber", "Human-computer interaction", "Ask about current lab openings", "76%"],
          ["Prof. Sarah Chen", "Applied machine learning", "Rewrite subject around project fit", "64%"],
        ].map(([name, research, action, score]) => (
          <div key={name} className="rounded-3xl bg-[#092B2F] p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-heading text-xl font-extrabold text-[#F8F5E6]">{name}</p>
                <p className="mt-1 text-sm text-[#AAD8D8]/70">{research} - {action}</p>
              </div>
              <span className="text-sm font-bold" style={{ color: accent }}>{score}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl bg-[#1A4040] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A9A9A]">Cold email strategy</p>
        <div className="mt-6 space-y-4 text-sm text-[#AAD8D8]/75">
          <p><span className="font-bold text-[#F8F5E6]">1.</span> Open with research overlap.</p>
          <p><span className="font-bold text-[#F8F5E6]">2.</span> Mention one specific paper or lab project.</p>
          <p><span className="font-bold text-[#F8F5E6]">3.</span> Follow up after 5-7 days with a shorter note.</p>
        </div>
        <div className="mt-8 rounded-2xl bg-[#022226] p-4">
          <p className="text-xs text-[#6A9A9A]">Reply ratio target</p>
          <p className="mt-2 font-heading text-3xl font-extrabold text-[#F8F5E6]">30%+</p>
        </div>
      </div>
    </div>
  );
}

function ChatPreview({ accent }: { accent: string }) {
  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <div className="rounded-3xl bg-[#1A4040] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6A9A9A]">Context</p>
        <h3 className="mt-4 font-heading text-2xl font-extrabold text-[#F8F5E6]">McGill MSc Computer Science</h3>
        <div className="mt-6 space-y-3 text-sm text-[#AAD8D8]/70">
          <p>Profile: MS applicant</p>
          <p>Research: NLP, HCI</p>
          <p>Budget: funding needed</p>
        </div>
      </div>
      <div className="space-y-4">
        <div className="ml-auto max-w-[80%] rounded-3xl bg-[#041C20] p-5 text-sm text-[#F8F5E6]">
          What should I ask before applying?
        </div>
        <div className="max-w-[88%] rounded-3xl bg-[#092B2F] p-5 text-sm leading-7 text-[#F8F5E6]/86">
          Lead with research fit. Ask whether your NLP work connects to an active project, then discuss funding once the match is clear.
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          {["Draft email", "Check fit", "Find faculty"].map((action) => (
            <span key={action} className="rounded-full bg-[#1A4040] px-4 py-2 text-[#F8F5E6]">
              <span style={{ color: accent }}>+</span> {action}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
