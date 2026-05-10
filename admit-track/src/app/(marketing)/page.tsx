"use client";

import Link from "next/link";
import { type CSSProperties, type MouseEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookmarkCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FileText,
  Gauge,
  Mail,
  MessageSquareText,
  Search,
  Sparkles,
  Users2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { cn } from "@/lib/utils";

const stats = [
  { value: "Live", label: "LLM-updated program intel" },
  { value: "12,000+", label: "Programs discoverable" },
  { value: "4,800+", label: "Students admitted" },
  { value: "40+", label: "Countries covered" },
];

const steps = [
  {
    title: "Search and discover",
    desc: "Find programs with updated requirements, deadlines, scholarships, rankings, and fit signals surfaced by specialized LLMs.",
    icon: Search,
  },
  {
    title: "Build your pipeline",
    desc: "Save programs, track application status, and keep every deadline visible.",
    icon: BookmarkCheck,
  },
  {
    title: "Manage documents",
    desc: "Keep CVs, SOPs, transcripts, and recommendations organized and ready.",
    icon: FileText,
  },
  {
    title: "Track your progress",
    desc: "Know exactly where you stand across every application without spreadsheets.",
    icon: CalendarClock,
  },
  {
    title: "Find supervisors",
    desc: "Match research interests to faculty and keep outreach history in one place.",
    icon: Users2,
  },
  {
    title: "Get feedback",
    desc: "Use grounded AI suggestions to understand what should happen next.",
    icon: Sparkles,
  },
];

const showcaseSlides = [
  {
    eyebrow: "Program discovery",
    title: "Find the right program first.",
    desc: "AdmitUs uses specialized LLMs to surface the latest, updated program information, requirements, deadlines, scholarships, and fit signals.",
    icon: Search,
    accent: "#F7E28B",
    preview: "search",
  },
  {
    eyebrow: "Command center",
    title: "Everything moving, nothing lost.",
    desc: "Applications, deadlines, documents, and funding signals stay visible in one focused dashboard.",
    icon: BarChart3,
    accent: "#AAD8D8",
    preview: "dashboard",
  },
  {
    eyebrow: "FAFO Funding Meter",
    title: "Know if your outreach is working.",
    desc: "Estimate funding odds from profile strength, emails sent, response ratio, and application volume.",
    icon: Gauge,
    accent: "#5B6CFF",
    preview: "fafo",
  },
  {
    eyebrow: "Professor outreach",
    title: "Turn cold emails into a system.",
    desc: "Track sent mail, replies, meeting momentum, and who deserves the next follow-up.",
    icon: Mail,
    accent: "#40E0B2",
    preview: "outreach",
  },
  {
    eyebrow: "Program chat",
    title: "Ask smarter questions before you apply.",
    desc: "Use specialized AdmitUs LLMs that reason over current program context, your profile, and official admissions details.",
    icon: MessageSquareText,
    accent: "#AAD8D8",
    preview: "chat",
  },
];

const programs = [
  { school: "University of Oxford", program: "MSc Computer Science", tuition: "GBP 32,000 / yr", deadline: "Jan 24, 2026", status: "In pipeline" },
  { school: "London Business School", program: "Master of Business Administration", tuition: "GBP 92,000 total", deadline: "Mar 15, 2026", status: "In pipeline" },
  { school: "Sciences Po Paris", program: "Master of Public Affairs", tuition: "EUR 14,000 / yr", deadline: "Feb 01, 2026", status: "Saved" },
];

const navItems = [
  { label: "Programs", href: "#programs" },
  { label: "Showcase", href: "#showcase" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Results", href: "#results" },
];

type PreviewKind = (typeof showcaseSlides)[number]["preview"];

const generalAdmitusDescription =
  "AdmitUs searches, compares, and updates program information with specialized LLMs, then helps you track deadlines, outreach, documents, and funding odds from one real workspace.";

export default function LandingPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [cursor, setCursor] = useState({ x: 50, y: 45 });
  const slide = showcaseSlides[activeSlide];
  const Icon = slide.icon;

  const heroStyle = useMemo(
    () =>
      ({
        "--mx": `${cursor.x}%`,
        "--my": `${cursor.y}%`,
        "--shift-x": `${(cursor.x - 50) * 0.28}px`,
        "--shift-y": `${(cursor.y - 50) * 0.2}px`,
        "--active-accent": slide.accent,
      }) as CSSProperties,
    [cursor.x, cursor.y, slide.accent]
  );

  function handleHeroMove(event: MouseEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    setCursor({
      x: Math.round(((event.clientX - rect.left) / rect.width) * 100),
      y: Math.round(((event.clientY - rect.top) / rect.height) * 100),
    });
  }

  function goToSlide(direction: -1 | 1) {
    setActiveSlide((current) => (current + direction + showcaseSlides.length) % showcaseSlides.length);
  }

  return (
    <div className="min-h-screen bg-[#F4F2DC] text-[#022226]">
      <header className="sticky top-0 z-50 border-b border-[#AAD8D8]/10 bg-[#022226]/95 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="admitus home">
            <BrandLogo markClassName="h-11 w-10" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a key={item.label} href={item.href} className="text-sm text-[#AAD8D8]/70 transition-colors hover:text-[#AAD8D8]">
                {item.label}
              </a>
            ))}
          </nav>
          <Link href="/login">
            <Button className="rounded-none bg-[#F7E28B] px-5 font-heading text-[#022226] hover:bg-[#AAD8D8]">
              Get started
            </Button>
          </Link>
        </div>
      </header>

      <main>
        <section
          id="showcase"
          onMouseMove={handleHeroMove}
          style={heroStyle}
          className="relative overflow-hidden bg-[#022226] px-6 py-10 text-[#F4F2DC] md:py-12"
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-80 transition-[background-position] duration-150"
            style={{
              backgroundImage:
                "linear-gradient(90deg, rgba(170,216,216,.08) 1px, transparent 1px), linear-gradient(0deg, rgba(170,216,216,.08) 1px, transparent 1px), linear-gradient(125deg, rgba(247,226,139,.16), transparent 38%, rgba(170,216,216,.12))",
              backgroundPosition: "var(--shift-x) var(--shift-y), calc(var(--shift-x) * -1) calc(var(--shift-y) * -1), center",
              backgroundSize: "54px 54px, 54px 54px, cover",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background:
                "linear-gradient(115deg, transparent 0%, rgba(247,226,139,.08) 28%, transparent 52%), linear-gradient(245deg, rgba(170,216,216,.11), transparent 44%)",
              transform: "translate3d(calc(var(--shift-x) * .45), calc(var(--shift-y) * .45), 0)",
            }}
          />
          <div className="relative mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.74fr_1.26fr]">
            <div className="max-w-xl">
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#6A9A9A]">Latest admissions intel through specialized LLMs</p>
              <h1 className="font-heading text-5xl font-extrabold leading-none tracking-tight text-[#F4F2DC] sm:text-6xl lg:text-[56px]">
                Find programs
                <span className="block text-[#F7E28B]">before you <span className="text-[#AAD8D8]">apply.</span></span>
              </h1>
              <div className="mt-8 border border-[#AAD8D8]/12 bg-[#041C20]/72 p-5 backdrop-blur">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: slide.accent }}>
                  {activeSlide === 0 ? "What AdmitUs does" : slide.eyebrow}
                </p>
                <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-[#F4F2DC]">
                  {activeSlide === 0 ? "A smarter way to start." : slide.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-[#AAD8D8]/76">
                  {activeSlide === 0
                    ? generalAdmitusDescription
                    : slide.desc}
                </p>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="rounded-none bg-[#F7E28B] px-7 font-heading text-[#022226] hover:bg-[#AAD8D8]">
                    Get started - it is free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="inline-flex h-11 items-center justify-center border border-[#AAD8D8]/25 px-7 text-sm text-[#F4F2DC] transition-colors hover:border-[#AAD8D8]/60">
                  Explore features
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="border border-[#AAD8D8]/16 bg-[#071F22]/88 p-2 shadow-[0_28px_90px_rgba(0,0,0,.34)] backdrop-blur">
                <div className="flex h-8 items-center gap-2 border-b border-[#AAD8D8]/10 px-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F76363]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#F7E28B]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#40E0B2]" />
                  <span className="ml-3 truncate text-[10px] uppercase tracking-[0.15em] text-[#6A9A9A]">admitus workspace</span>
                  <span className="ml-auto hidden items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-[#AAD8D8]/58 sm:flex">
                    <Icon className="h-3.5 w-3.5" style={{ color: slide.accent }} />
                    {slide.eyebrow}
                  </span>
                </div>
                <div className="min-h-[350px] bg-[#022226] p-4 sm:p-6">
                  <ProductPreview kind={slide.preview as PreviewKind} accent={slide.accent} />
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid flex-1 grid-cols-5 gap-2">
                  {showcaseSlides.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <button
                        key={item.eyebrow}
                        type="button"
                        aria-label={`Show ${item.eyebrow}`}
                        onClick={() => setActiveSlide(index)}
                        className={cn(
                          "group h-10 border border-[#AAD8D8]/12 bg-[#1A4040]/54 text-[#6A9A9A] transition-all hover:border-[#AAD8D8]/35 hover:text-[#F4F2DC]",
                          index === activeSlide && "border-[#F7E28B]/70 bg-[#F7E28B] text-[#022226]"
                        )}
                      >
                        <ItemIcon className="mx-auto h-4 w-4" />
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    aria-label="Previous showcase slide"
                    onClick={() => goToSlide(-1)}
                    className="flex h-10 w-10 items-center justify-center border border-[#AAD8D8]/18 bg-[#022226]/70 text-[#AAD8D8] transition-colors hover:border-[#AAD8D8]/45 hover:text-[#F7E28B]"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Next showcase slide"
                    onClick={() => goToSlide(1)}
                    className="flex h-10 w-10 items-center justify-center border border-[#AAD8D8]/18 bg-[#022226]/70 text-[#AAD8D8] transition-colors hover:border-[#AAD8D8]/45 hover:text-[#F7E28B]"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#AAD8D8] px-6 py-5">
          <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="border-[#022226]/15 lg:border-r lg:last:border-r-0">
                <strong className="block font-heading text-2xl font-extrabold tracking-tight text-[#022226]">{stat.value}</strong>
                <span className="text-[11px] uppercase tracking-[0.08em] text-[#1A4040]/70">{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#022226]/45">How it works</p>
            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-[#022226]">
              Everything you need.
              <span className="block text-[#6A9A9A]">One platform.</span>
            </h2>
            <div className="mt-12 grid gap-px bg-[#022226]/10 md:grid-cols-2 lg:grid-cols-3">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.title} className="bg-[#F4F2DC] p-7">
                    <div className="mb-5 flex items-center justify-between">
                      <p className="font-heading text-3xl font-extrabold tracking-tight text-[#022226]/10">{String(index + 1).padStart(2, "0")}</p>
                      <StepIcon className="h-5 w-5 text-[#1A4040]" />
                    </div>
                    <h3 className="font-heading text-sm font-bold tracking-tight text-[#022226]">{step.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-[#6A9A9A]">{step.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="programs" className="bg-[#1A4040] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6A9A9A]">Programs first</p>
            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-[#F4F2DC]">
              Start with current information.
              <span className="block text-[#F7E28B]">Then build the application.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#AAD8D8]/72">
              AdmitUs uses specialized LLMs to keep program discovery useful: latest admissions details, scholarship context, eligibility signals, and practical next steps instead of stale database-only cards.
            </p>
            <div className="mt-10 grid gap-3 lg:grid-cols-3">
              {programs.map((program) => (
                <article key={program.program} className="border border-[#AAD8D8]/10 bg-[#022226] p-6">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#F7E28B]/70">{program.school}</p>
                  <h3 className="mb-5 font-heading text-base font-bold leading-snug tracking-tight text-[#F4F2DC]">{program.program}</h3>
                  <dl className="space-y-2 text-[11px]">
                    <div className="flex justify-between gap-4"><dt className="text-[#6A9A9A]">Tuition</dt><dd className="text-[#F4F2DC]">{program.tuition}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-[#6A9A9A]">Deadline</dt><dd className="text-[#F4F2DC]">{program.deadline}</dd></div>
                    <div className="flex justify-between gap-4"><dt className="text-[#6A9A9A]">Duration</dt><dd className="text-[#F4F2DC]">1-2 years</dd></div>
                  </dl>
                  <span className="mt-5 inline-flex bg-[#F7E28B] px-3 py-1 font-heading text-[10px] font-bold text-[#022226]">
                    {program.status}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="results" className="bg-[#022226] px-6 py-20 text-center">
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6A9A9A]/70">From our students</p>
          <blockquote className="mx-auto max-w-2xl font-heading text-3xl font-bold leading-snug tracking-normal text-[#F4F2DC]">
            &quot;admitus changed how I approached every single application.&quot;
          </blockquote>
          <p className="mt-5 text-xs uppercase tracking-[0.12em] text-[#6A9A9A]">Aisha R. - admitted to LSE and Sciences Po</p>
        </section>

        <section className="bg-[#F7E28B] px-6 py-12">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-normal text-[#022226]">Ready to get in?</h2>
              <p className="mt-2 text-sm text-[#1A4040]/70">Join 4,800+ students already on their way.</p>
            </div>
            <Link href="/login">
              <Button size="lg" className="rounded-none bg-[#022226] px-9 font-heading text-[#F7E28B] hover:bg-[#1A4040]">
                Start for free
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#AAD8D8]/10 bg-[#022226] px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <BrandLogo markClassName="h-8 w-7" textClassName="text-base" />
          <p className="text-xs text-[#6A9A9A]/70">Copyright 2026 admitus. All rights reserved.</p>
          <span className="font-heading text-sm font-bold tracking-tight text-[#F7E28B]/70">your way in.</span>
        </div>
      </footer>
    </div>
  );
}

function ProductPreview({ kind, accent }: { kind: PreviewKind; accent: string }) {
  if (kind === "fafo") return <FafoPreview accent={accent} />;
  if (kind === "outreach") return <OutreachPreview accent={accent} />;
  if (kind === "search") return <SearchPreview accent={accent} />;
  if (kind === "chat") return <ChatPreview accent={accent} />;
  return <DashboardPreview accent={accent} />;
}

function DashboardPreview({ accent }: { accent: string }) {
  return (
    <div className="grid min-h-[320px] gap-3 lg:grid-cols-[120px_1fr]">
      <aside className="hidden border border-[#AAD8D8]/10 bg-[#041C20] p-3 lg:block">
        <p className="font-heading text-sm font-extrabold text-[#F7E28B]">AdmitUs</p>
        <div className="mt-5 space-y-2 text-[11px] text-[#AAD8D8]/70">
          {["Dashboard", "Search", "Applications", "Supervisors", "Insights"].map((item, index) => (
            <div key={item} className={cn("px-2 py-2", index === 0 && "bg-[#1A4040] text-[#F4F2DC]")}>{item}</div>
          ))}
        </div>
      </aside>
      <div>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6A9A9A]">Dashboard</p>
            <h3 className="font-heading text-2xl font-extrabold text-[#F4F2DC]">Hey there</h3>
          </div>
          <span className="bg-[#F7E28B] px-3 py-1 text-xs font-bold text-[#022226]">Level 4</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {[
            ["Active", "14"],
            ["Due soon", "5"],
            ["Emails", "38"],
            ["FAFO", "72"],
          ].map(([label, value]) => (
            <div key={label} className="border border-[#AAD8D8]/10 bg-[#1A4040] p-3">
              <p className="text-[10px] uppercase tracking-[0.13em] text-[#6A9A9A]">{label}</p>
              <p className="mt-1 font-heading text-2xl font-extrabold text-[#F4F2DC]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_190px]">
          <div className="space-y-2">
            {[
              ["McGill - MSc CS", "submitted", "100%"],
              ["TU Munich - Informatics", "preparing", "74%"],
              ["Sciences Po - Public Affairs", "documents", "48%"],
            ].map(([name, status, progress]) => (
              <div key={name} className="border border-[#AAD8D8]/10 bg-[#092B2F] p-3">
                <div className="mb-2 flex justify-between gap-4 text-xs">
                  <span className="font-semibold text-[#F4F2DC]">{name}</span>
                  <span className="text-[#AAD8D8]">{status}</span>
                </div>
                <div className="h-1.5 bg-[#AAD8D8]/10">
                  <div className="h-full" style={{ width: progress, backgroundColor: accent }} />
                </div>
              </div>
            ))}
          </div>
          <div className="border border-[#AAD8D8]/10 bg-[#1A4040] p-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#6A9A9A]">Next move</p>
            <div className="mt-3 space-y-3">
              {["Email Prof. Chen", "Upload transcript", "Check funding page"].map((item, index) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center bg-[#022226] text-[10px] font-bold" style={{ color: index === 0 ? accent : "#AAD8D8" }}>
                    {index + 1}
                  </span>
                  <span className="text-xs text-[#F4F2DC]/85">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FafoPreview({ accent }: { accent: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
      <div className="border border-[#AAD8D8]/10 bg-[#1A4040] p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#6A9A9A]">FAFO meter</p>
        <div
          className="mx-auto mt-6 flex h-40 w-40 items-center justify-center rounded-full"
          style={{ background: `conic-gradient(${accent} 0 72%, rgba(170,216,216,.12) 72% 100%)` }}
        >
          <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-[#022226]">
            <span className="font-heading text-4xl font-extrabold text-[#F4F2DC]">72</span>
            <span className="text-xs text-[#AAD8D8]">funding odds</span>
          </div>
        </div>
        <p className="mt-5 text-center text-sm leading-6 text-[#AAD8D8]/78">Strong profile, but response ratio can still lift the score.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {[
          ["Emails sent", "38", "More reach helps"],
          ["Reply ratio", "24%", "Target is 30%+"],
          ["Applications", "9", "Good spread"],
          ["Profile fit", "84", "Research aligned"],
        ].map(([label, value, note]) => (
          <div key={label} className="border border-[#AAD8D8]/10 bg-[#092B2F] p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-[#6A9A9A]">{label}</p>
            <p className="mt-3 font-heading text-3xl font-extrabold text-[#F4F2DC]">{value}</p>
            <p className="mt-1 text-xs text-[#AAD8D8]/70">{note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function OutreachPreview({ accent }: { accent: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_230px]">
      <div className="space-y-3">
        {[
          ["Prof. Amina Shah", "Positive reply", "Meeting scheduled", "92%"],
          ["Dr. Lukas Weber", "Opened twice", "Follow up in 2 days", "64%"],
          ["Prof. Sarah Chen", "No reply", "Rewrite subject line", "31%"],
          ["Dr. Elena Rossi", "Neutral reply", "Send proposal abstract", "58%"],
        ].map(([name, status, action, score]) => (
          <div key={name} className="grid gap-3 border border-[#AAD8D8]/10 bg-[#092B2F] p-4 sm:grid-cols-[1fr_120px] sm:items-center">
            <div>
              <p className="font-heading text-base font-bold text-[#F4F2DC]">{name}</p>
              <p className="mt-1 text-xs text-[#AAD8D8]/72">{status} - {action}</p>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-[10px] text-[#6A9A9A]">
                <span>fit</span>
                <span>{score}</span>
              </div>
              <div className="h-1.5 bg-[#AAD8D8]/10">
                <div className="h-full" style={{ width: score, backgroundColor: accent }} />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-[#AAD8D8]/10 bg-[#1A4040] p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#6A9A9A]">Professor response</p>
        <p className="mt-5 font-heading text-5xl font-extrabold text-[#F4F2DC]">24%</p>
        <p className="mt-2 text-sm leading-6 text-[#AAD8D8]/72">Reply ratio is up 8% after switching to research-first emails.</p>
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs">
          {["38 sent", "9 replies", "3 calls"].map((item) => (
            <span key={item} className="bg-[#022226] px-2 py-3 text-[#F4F2DC]/85">{item}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchPreview({ accent }: { accent: string }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-2xl font-extrabold text-[#F4F2DC]">University Search</h3>
          <p className="text-sm text-[#6A9A9A]">Found 37 programs across 20 universities</p>
        </div>
        <div className="flex overflow-hidden rounded-full border border-[#AAD8D8]/20 bg-[#F4F2DC] p-1 text-xs font-bold text-[#022226]">
          <span className="rounded-full bg-[#F7E28B] px-4 py-2">All Programs</span>
          <span className="px-4 py-2 text-[#6A9A9A]">Saved (0)</span>
        </div>
      </div>
      <div className="mb-3 grid gap-2 text-xs text-[#AAD8D8] sm:grid-cols-[1fr_110px_110px]">
        <div className="border border-[#AAD8D8]/12 bg-[#041C20] px-3 py-2">Search: Computer Science, Germany, funding...</div>
        <div className="border border-[#AAD8D8]/12 bg-[#041C20] px-3 py-2">Masters</div>
        <div className="border border-[#AAD8D8]/12 bg-[#041C20] px-3 py-2">Scholarship</div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["MSc Computer Science", "University of Toronto - Toronto, Canada", "72", "CA$58,680/yr", "Due Sep 11"],
          ["MSc Informatics", "TU Munich - Munich, Germany", "87", "EUR 0/yr", "Due Aug 29"],
          ["MEng Electrical & Computer Engineering", "University of Toronto - Toronto, Canada", "62", "CA$58,680/yr", "Due Aug 11", "hidden xl:block"],
        ].map(([title, school, score, fee, due, extraClass]) => (
          <article key={title} className={cn("min-h-[220px] border border-[#AAD8D8]/10 bg-[#1A4040] p-5", extraClass)}>
            <div className="flex justify-between gap-3">
              <h4 className="font-heading text-base font-bold leading-tight text-[#F4F2DC]">{title}</h4>
              <div
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full border-[5px] bg-[#1A4040] text-xs font-extrabold"
                style={{ borderColor: accent, color: accent }}
              >
                {score}
              </div>
            </div>
            <p className="mt-2 text-sm leading-snug text-[#6A9A9A]">{school}</p>
            <div className="mt-3 space-y-2 text-xs text-[#F4F2DC]/86">
              <p>Masters - English - Scholarship</p>
              <p>{fee}</p>
              <p>Fall 2026 - {due}</p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-[#022226]">
              <span className="bg-[#F7E28B] px-2 py-1">IELTS 7+</span>
              <span className="bg-[#AAD8D8] px-2 py-1">GPA 3.3+</span>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="border border-[#AAD8D8]/20 px-3 py-1 text-xs font-bold text-[#F4F2DC]">Details</span>
              <span className="bg-[#F7E28B] px-3 py-1 text-xs font-bold text-[#022226]">+ Pipeline</span>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-3 text-xs text-[#6A9A9A]">LLM-fetched and refreshed with source-aware admissions context.</p>
    </div>
  );
}

function ChatPreview({ accent }: { accent: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
      <div className="border border-[#AAD8D8]/10 bg-[#1A4040] p-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#6A9A9A]">Context</p>
        <h3 className="mt-3 font-heading text-xl font-extrabold text-[#F4F2DC]">McGill MSc Computer Science</h3>
        <div className="mt-5 space-y-2 text-xs text-[#AAD8D8]/72">
          <p>Profile: MS applicant</p>
          <p>GPA: 3.55</p>
          <p>Research: NLP, HCI</p>
          <p>Budget: funding needed</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="ml-auto max-w-[72%] bg-[#022226] p-4 text-sm text-[#F4F2DC]">What should I ask the professor before applying?</div>
        <div className="max-w-[86%] border border-[#AAD8D8]/10 bg-[#092B2F] p-4 text-sm leading-6 text-[#F4F2DC]/90">
          Lead with fit, not funding. Ask whether your NLP work connects to an active project, then mention funding after the research match is clear.
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {["Draft email", "Check fit", "Find faculty"].map((action) => (
            <button key={action} type="button" className="border border-[#AAD8D8]/12 bg-[#1A4040] px-3 py-3 text-xs font-semibold text-[#F4F2DC]">
              <span style={{ color: accent }}>+</span> {action}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
