"use client";

import Link from "next/link";
import { ArrowRight, BookmarkCheck, CalendarClock, FileText, Search, Sparkles, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";

const stats = [
  { value: "12,000+", label: "Programs indexed" },
  { value: "4,800+", label: "Students admitted" },
  { value: "98%", label: "Deadline hit rate" },
  { value: "40+", label: "Countries covered" },
];

const steps = [
  {
    title: "Search and discover",
    desc: "Browse programs with tuition, deadlines, requirements, and rankings in one focused search.",
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

const programs = [
  { school: "University of Oxford", program: "MSc Computer Science", tuition: "GBP 32,000 / yr", deadline: "Jan 24, 2026", status: "In pipeline" },
  { school: "London Business School", program: "Master of Business Administration", tuition: "GBP 92,000 total", deadline: "Mar 15, 2026", status: "In pipeline" },
  { school: "Sciences Po Paris", program: "Master of Public Affairs", tuition: "EUR 14,000 / yr", deadline: "Feb 01, 2026", status: "Saved" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F2DC] text-[#022226]">
      <header className="sticky top-0 z-50 border-b border-[#AAD8D8]/10 bg-[#022226]">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-6">
          <Link href="/" aria-label="admitus home">
            <BrandLogo markClassName="h-11 w-10" />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {["Programs", "Pipeline", "Documents", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm text-[#AAD8D8]/70 transition-colors hover:text-[#AAD8D8]">
                {item}
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
        <section className="bg-[#022226] px-6 py-20 md:py-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_390px]">
            <div>
              <p className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#6A9A9A]">The application platform</p>
              <h1 className="font-heading text-5xl font-extrabold leading-none tracking-tight text-[#F4F2DC] sm:text-6xl lg:text-[66px]">
                Your way in
                <span className="block text-[#F7E28B]">to every <span className="text-[#AAD8D8]">program.</span></span>
              </h1>
              <p className="mt-7 max-w-md text-[15px] leading-7 text-[#6A9A9A]">
                Search programs, track deadlines, manage your documents, and get admitted - all in one place.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/login">
                  <Button size="lg" className="rounded-none bg-[#F7E28B] px-7 font-heading text-[#022226] hover:bg-[#AAD8D8]">
                    Get started - it is free <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works" className="inline-flex h-9 items-center justify-center border border-[#AAD8D8]/25 px-7 text-sm text-[#F4F2DC] transition-colors hover:border-[#AAD8D8]/60">
                  See how it works
                </a>
              </div>
            </div>

            <div className="border border-[#AAD8D8]/10 bg-[#1A4040] p-7">
              <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-[#F7E28B]">My pipeline</p>
              {[
                ["MSc Computer Science - Oxford", "Submitted", "#F7E28B"],
                ["MBA - London Business School", "In progress", "#AAD8D8"],
                ["MPA - Sciences Po Paris", "Not started", "rgba(170,216,216,.25)"],
                ["MA Economics - LSE", "Not started", "rgba(170,216,216,.25)"],
              ].map(([name, status, color]) => (
                <div key={name} className="flex items-center gap-3 border-b border-[#AAD8D8]/10 py-3 last:border-b-0">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="flex-1 text-xs text-[#F4F2DC]/85">{name}</span>
                  <span className="text-[11px]" style={{ color }}>{status}</span>
                </div>
              ))}
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-[11px] text-[#6A9A9A]">
                  <span>Overall progress</span>
                  <span>62%</span>
                </div>
                <div className="h-[3px] bg-[#AAD8D8]/10">
                  <div className="h-full w-[62%] bg-[#F7E28B]" />
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
                const Icon = step.icon;
                return (
                  <div key={step.title} className="bg-[#F4F2DC] p-7">
                    <div className="mb-5 flex items-center justify-between">
                      <p className="font-heading text-3xl font-extrabold tracking-tight text-[#022226]/10">{String(index + 1).padStart(2, "0")}</p>
                      <Icon className="h-5 w-5 text-[#1A4040]" />
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
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-[#6A9A9A]">Programs</p>
            <h2 className="font-heading text-4xl font-extrabold leading-tight tracking-tight text-[#F4F2DC]">
              Find your program.
              <span className="block text-[#F7E28B]">Save it. Apply.</span>
            </h2>
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

        <section className="bg-[#022226] px-6 py-20 text-center">
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
