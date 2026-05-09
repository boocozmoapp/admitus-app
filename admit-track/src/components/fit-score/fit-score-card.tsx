"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { type FitDimension, type PrerequisiteGate } from "@/lib/utils";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";

type FitScoreCardProps = {
  score: number;
  dimensions: FitDimension[];
  prerequisites: PrerequisiteGate[];
  noProfile?: boolean;
  animated?: boolean;
  isDemo?: boolean;
  whatIfGpa?: number;
  whatIfSkillMatch?: number;
  onWhatIfChange?: (dim: "gpa" | "skillMatch", val: number) => void;
};

function ScoreRing({ score, animated }: { score: number; animated?: boolean }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const [offset, setOffset] = useState(animated ? circumference : circumference - (score / 100) * circumference);

  useEffect(() => {
    if (!animated) return;
    const raf = requestAnimationFrame(() => {
      setOffset(circumference - (score / 100) * circumference);
    });
    return () => cancelAnimationFrame(raf);
  }, [score, animated, circumference]);

  const color = score > 70 ? "stroke-emerald-500" : score > 50 ? "stroke-amber-500" : "stroke-red-500";
  const textColor = score > 70 ? "text-emerald-600 dark:text-emerald-400" : score > 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={76} height={76} className="-rotate-90">
        <circle cx={38} cy={38} r={radius} fill="none" strokeWidth={4} className="stroke-muted/30" />
        <circle
          cx={38} cy={38} r={radius}
          fill="none" strokeWidth={4}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("transition-all duration-600 ease-out", color)}
        />
      </svg>
      <span className={cn("absolute text-base font-bold", textColor)}>{score}</span>
    </div>
  );
}

export function FitScoreCard({
  score,
  dimensions,
  prerequisites,
  noProfile,
  animated,
  isDemo,
  whatIfGpa,
  whatIfSkillMatch,
  onWhatIfChange,
}: FitScoreCardProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (noProfile) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">Set up a profile to see your fit score</p>
      </div>
    );
  }

  const dims = isDemo
    ? [
        { label: "Degree level", earned: 20, max: 20, note: "MSc matches your target", met: true } as FitDimension,
        { label: "GPA", earned: 12, max: 25, note: "Your GPA 3.2 < competitive 3.5", met: false, tip: "Improving your GPA would significantly boost this score" },
        { label: "Skill match", earned: 20, max: 25, note: "Strong AI skills overlap", met: true },
        { label: "Budget", earned: 15, max: 15, note: "Tuition fits your budget", met: true },
        { label: "Scholarship", earned: 15, max: 15, note: "Scholarships available", met: true },
      ]
    : dimensions;

  const demoScore = Math.round(
    dims.reduce((s, d) => s + d.earned, 0) / dims.reduce((s, d) => s + d.max, 0) * 100
  );

  const displayScore = isDemo ? demoScore : score;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      {/* Score ring + total */}
      <div className="flex items-center gap-4">
        <ScoreRing score={displayScore} animated={animated} />
        <div>
          <p className="text-sm font-semibold">Fit Score</p>
          <p className="text-xs text-muted-foreground">{displayScore}% match with your profile</p>
        </div>
      </div>

      {/* Prerequisite gates */}
      {prerequisites.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {prerequisites.map((g) => (
            <div
              key={g.label}
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border",
                g.met === true
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300"
                  : g.met === false
                  ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300"
                  : "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300"
              )}
              title={g.note}
            >
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                g.met === true ? "bg-emerald-500" : g.met === false ? "bg-red-500" : "bg-amber-400"
              )} />
              {g.label}
            </div>
          ))}
        </div>
      )}

      {/* Dimension breakdown */}
      <div className="space-y-1">
        {dims.map((d) => {
          const isExpanded = expandedRow === d.label;
          const pct = d.max > 0 ? Math.round((d.earned / d.max) * 100) : 0;
          const dotColor = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";

          return (
            <div key={d.label}>
              <button
                className="w-full flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50 transition-colors text-left"
                onClick={() => setExpandedRow(isExpanded ? null : d.label)}
              >
                <span className={cn("h-2 w-2 rounded-full shrink-0", dotColor)} />
                <span className="flex-1 text-xs font-medium">{d.label}</span>
                <span className={cn(
                  "text-xs font-mono tabular-nums",
                  pct >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                  pct >= 50 ? "text-amber-600 dark:text-amber-400" :
                  "text-red-600 dark:text-red-400"
                )}>
                  {d.earned}/{d.max}
                </span>
                {isExpanded ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-2 space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">{d.note}</p>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className={cn(
                      "h-full rounded-full transition-all",
                      dotColor
                    )} style={{ width: `${pct}%` }} />
                  </div>
                  {d.tip && pct < 80 && (
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Sparkles className="h-3 w-3 shrink-0" />
                      {d.tip}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* What-if sliders (only in non-demo mode) */}
      {!isDemo && onWhatIfChange && (
        <div className="border-t border-border pt-3 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What If</p>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>GPA</span>
              <span className="font-mono text-muted-foreground">{whatIfGpa ?? "—"}</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              step="0.1"
              value={whatIfGpa ?? 0}
              onChange={(e) => onWhatIfChange("gpa", parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-indigo-500"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Skill match</span>
              <span className="font-mono text-muted-foreground">{whatIfSkillMatch != null ? `${whatIfSkillMatch}%` : "—"}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={whatIfSkillMatch ?? 50}
              onChange={(e) => onWhatIfChange("skillMatch", parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-muted cursor-pointer accent-indigo-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}
