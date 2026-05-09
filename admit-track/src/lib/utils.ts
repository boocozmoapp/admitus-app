import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function daysUntil(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function urgencyColor(days: number): string {
  if (days < 0) return "text-red-500";
  if (days < 7) return "text-red-400";
  if (days < 30) return "text-orange-400";
  return "text-emerald-500";
}

export function urgencyBg(days: number): string {
  if (days < 0) return "bg-red-100 text-red-700 border-red-200";
  if (days < 7) return "bg-red-50 text-red-600 border-red-200";
  if (days < 30) return "bg-orange-50 text-orange-600 border-orange-200";
  return "bg-emerald-50 text-emerald-600 border-emerald-200";
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    researching: "bg-gray-100 text-gray-700",
    preparing: "bg-orange-100 text-orange-700",
    submitted: "bg-blue-100 text-blue-700",
    interview: "bg-purple-100 text-purple-700",
    admitted: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    waitlisted: "bg-amber-100 text-amber-700",
    withdrawn: "bg-gray-100 text-gray-500",
  };
  return colors[status] || colors.researching;
}

export function priorityColor(priority: string): string {
  const colors: Record<string, string> = {
    high: "text-[#F5365C]",
    medium: "text-[#FB6340]",
    low: "text-[#A0AEC0]",
  };
  return colors[priority] || colors.medium;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export const STATUS_OPTIONS = [
  "researching", "preparing", "submitted", "interview",
  "admitted", "rejected", "waitlisted", "withdrawn",
] as const;

export const PRIORITY_OPTIONS = ["high", "medium", "low"] as const;

export const DEGREE_LEVELS = ["Bachelors", "Masters", "PhD"] as const;

export const INTAKE_TERMS = ["Winter", "Spring", "Summer", "Fall"] as const;

export const DOCUMENT_TYPES = [
  "SOP", "CV", "Transcript", "LOR", "IELTS", "TOEFL",
  "Passport", "FinancialProof", "Other",
] as const;

// ── Profile-based program fit scoring ────────────────────────────────────────

export type FitDimension = {
  label: string;
  earned: number;
  max: number;
  note: string;
  met: boolean | null; // true=pass, false=fail, null=unknown/neutral
  tip?: string; // shown when score < 80%
};

export type PrerequisiteGate = {
  label: string;
  met: boolean | null;
  note: string;
};

type ProgramForFit = {
  universityCountry: string;
  degreeLevel: string;
  ieltsMin: number | null;
  toeflMin: number | null;
  gpaMin: number | null;
  greRequired: boolean | null;
  tuitionAmount: number | null;
  tuitionCurrency: string | null;
  scholarshipAvailable: boolean | null;
  requiredSkills?: string[] | null;
  prerequisites?: string[] | null;
  researchAreas?: string[] | null;
};

type ProfileForFit = {
  targetCountries: string;
  degreeLevel: string;
  ieltsScore: number | null;
  toeflScore?: number | null;
  gpa: number | null;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  skills?: string[] | null;
  coursework?: string[] | null;
  researchInterests?: string[] | null;
};

export function calculateProfileFitScore(
  program: ProgramForFit,
  profile: ProfileForFit | null,
  skillOverride?: number | null, // optional skill match score from AI
  whatIfGpa?: number,
  whatIfSkillMatch?: number,
): { score: number; dimensions: FitDimension[]; prerequisites: PrerequisiteGate[] } {
  if (!profile) return { score: 50, dimensions: [], prerequisites: [] };

  const dims: FitDimension[] = [];
  const prereqs: PrerequisiteGate[] = [];

  // ── PREREQUISITE GATES (pass/fail, shown above score) ──────────────────
  if (program.ieltsMin != null) {
    const has = profile.ieltsScore != null;
    const meet = has && profile.ieltsScore! >= program.ieltsMin!;
    prereqs.push({
      label: `IELTS ${profile.ieltsScore ?? "—"}`,
      met: has ? meet : null,
      note: has
        ? meet
          ? `✓ ${profile.ieltsScore} ≥ ${program.ieltsMin}`
          : `✗ ${profile.ieltsScore} < required ${program.ieltsMin}`
        : `Required ${program.ieltsMin}. Add score to profile.`,
    });
  }
  if (program.toeflMin != null) {
    const has = profile.toeflScore != null;
    const meet = has && profile.toeflScore! >= program.toeflMin!;
    prereqs.push({
      label: `TOEFL ${profile.toeflScore ?? "—"}`,
      met: has ? meet : null,
      note: has
        ? meet
          ? `✓ ${profile.toeflScore} ≥ ${program.toeflMin}`
          : `✗ ${profile.toeflScore} < required ${program.toeflMin}`
        : `Required ${program.toeflMin}. Add score to profile.`,
    });
  }
  if (program.gpaMin != null && profile.gpa != null) {
    const meet = profile.gpa >= program.gpaMin;
    prereqs.push({
      label: `GPA ${profile.gpa}`,
      met: meet,
      note: meet
        ? `✓ ${profile.gpa} ≥ ${program.gpaMin}`
        : `✗ ${profile.gpa} < min ${program.gpaMin}`,
    });
  }

  // ── 1. Degree level (20 pts) ────────────────────────────────────────
  const degMatch = profile.degreeLevel === program.degreeLevel;
  dims.push({
    label: "Degree level",
    earned: degMatch ? 20 : 0,
    max: 20,
    note: degMatch
      ? `${program.degreeLevel} matches your target`
      : `You target ${profile.degreeLevel}, this offers ${program.degreeLevel}`,
    met: degMatch,
    tip: degMatch ? undefined : "Consider programs at your target degree level",
  });

  // ── 2. GPA (25 pts) ─────────────────────────────────────────────────
  const gpaVal = whatIfGpa != null && whatIfGpa > 0 ? whatIfGpa : profile.gpa;
  if (program.gpaMin != null && gpaVal != null) {
    const gap = gpaVal - program.gpaMin;
    const pts = gap >= 0 ? 25 : gap >= -0.2 ? 12 : 0;
    dims.push({
      label: "GPA",
      earned: pts,
      max: 25,
      note: gap >= 0
        ? `Your GPA ${gpaVal} ≥ required ${program.gpaMin}`
        : `Your GPA ${gpaVal} < required ${program.gpaMin}`,
      met: gap >= 0,
      tip: pts < 20 ? "Improving your GPA would significantly boost this score" : undefined,
    });
  } else if (gpaVal != null) {
    dims.push({ label: "GPA", earned: 25, max: 25, note: `GPA ${gpaVal} on record`, met: true });
  } else {
    dims.push({ label: "GPA", earned: 12, max: 25, note: "Add your GPA to your profile for accurate scoring", met: null });
  }

  // ── 3. Skill match (25 pts) ─────────────────────────────────────────
  const skillScore = whatIfSkillMatch != null && whatIfSkillMatch > 0 ? whatIfSkillMatch : skillOverride;
  if (skillScore != null) {
    dims.push({
      label: "Skill match",
      earned: Math.round((skillScore / 100) * 25),
      max: 25,
      note: `AI-matched skills: ${skillScore}%`,
      met: skillScore >= 60,
      tip: skillScore < 60 ? "Try adding relevant coursework or research experience to your profile" : undefined,
    });
  } else {
    dims.push({ label: "Skill match", earned: 12, max: 25, note: "Enable AI skill matching for personalized scoring", met: null });
  }

  // ── 4. Budget / tuition (15 pts) ────────────────────────────────────
  if (program.tuitionAmount != null && profile.budgetAmount != null) {
    const t = program.tuitionAmount;
    const b = profile.budgetAmount;
    const pts = t <= b ? 15 : t <= b * 1.25 ? 8 : 0;
    const currency = program.tuitionCurrency || "USD";
    dims.push({
      label: "Budget",
      earned: pts,
      max: 15,
      note: t <= b
        ? `Tuition ${t.toLocaleString()} ${currency} fits your budget`
        : `Tuition ${t.toLocaleString()} ${currency} exceeds your budget of ${b.toLocaleString()}`,
      met: t <= b,
      tip: pts < 12 ? "Consider programs with lower tuition or increase your budget" : undefined,
    });
  } else if (program.tuitionAmount != null) {
    dims.push({
      label: "Budget", earned: 8, max: 15,
      note: `Tuition ${program.tuitionAmount.toLocaleString()} ${program.tuitionCurrency || "USD"}. Add budget to profile.`,
      met: null,
    });
  } else {
    dims.push({ label: "Budget", earned: 15, max: 15, note: "No tuition data", met: true });
  }

  // ── 5. Scholarship (15 pts) ─────────────────────────────────────────
  if (program.scholarshipAvailable) {
    dims.push({ label: "Scholarship", earned: 15, max: 15, note: "Scholarships available — you may qualify", met: true });
  } else {
    dims.push({ label: "Scholarship", earned: 5, max: 15, note: "No scholarships reported for this program", met: null });
  }

  const totalEarned = dims.reduce((s, d) => s + d.earned, 0);
  const totalMax = dims.reduce((s, d) => s + d.max, 0);
  if (totalMax === 0) return { score: 50, dimensions: dims, prerequisites: prereqs };
  const score = Math.round((totalEarned / totalMax) * 100);
  return { score: Math.max(0, Math.min(100, score)), dimensions: dims, prerequisites: prereqs };
}

// ── Supervisor research-interest match ───────────────────────────────────────

const RESEARCH_KEYWORDS: Record<string, string[]> = {
  cs: ["machine learning", "ai", "artificial intelligence", "deep learning", "nlp", "natural language", "computer vision", "algorithms", "distributed systems", "cybersecurity", "networks", "compilers", "operating systems", "data structures", "robotics"],
  "computer science": ["machine learning", "ai", "deep learning", "nlp", "computer vision", "algorithms", "distributed", "security", "networks"],
  engineering: ["control systems", "robotics", "signal processing", "embedded", "mechatronics", "automation", "hardware", "electronics", "circuits", "power systems"],
  "data science": ["machine learning", "data", "statistics", "analytics", "visualization", "data mining", "big data", "prediction", "forecasting"],
  business: ["management", "finance", "economics", "marketing", "strategy", "entrepreneurship", "operations", "accounting", "supply chain"],
  "public policy": ["policy", "governance", "public administration", "regulation", "welfare", "politics", "democracy", "public health"],
  "life sciences": ["biology", "genetics", "medicine", "health", "biomedical", "molecular biology", "cell", "genomics", "bioinformatics"],
  "arts & humanities": ["history", "literature", "philosophy", "culture", "linguistics", "art", "media studies", "anthropology"],
};

export function supervisorResearchMatch(
  researchInterests: string | null,
  profileFieldOfStudy: string | null
): number {
  if (!researchInterests || !profileFieldOfStudy) return 0;

  const interests = researchInterests.toLowerCase();
  const field = profileFieldOfStudy.toLowerCase();

  // Direct field name present
  if (interests.includes(field)) return 88;

  const keywords =
    RESEARCH_KEYWORDS[field] ??
    field.split(/[\s,]+/).filter((t) => t.length > 3);

  if (keywords.length === 0) return 0;

  const hits = keywords.filter((kw) => interests.includes(kw));
  if (hits.length === 0) return 15; // base score: no overlap detected
  const ratio = hits.length / keywords.length;
  // Scale: 1 hit out of many → ~35, half → ~60, most → ~85
  return Math.min(88, Math.round(15 + ratio * 100));
}
