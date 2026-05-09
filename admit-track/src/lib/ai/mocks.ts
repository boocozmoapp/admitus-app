export async function extractFromURL(url: string) {
  const res = await fetch("/api/extract-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || "Extraction failed");
  }
  return res.json();
}

export async function extractFromEmail(_content: string) {
  await new Promise((r) => setTimeout(r, 800));
  return {
    deadline: "2027-03-15",
    actionRequested: "Submit official transcripts by March 15",
    sentiment: "neutral" as const,
    university: "University of Toronto",
  };
}

export async function generateWeeklySummary() {
  await new Promise((r) => setTimeout(r, 1000));
  return [
    "You submitted 2 applications this week — University of Toronto and McGill University.",
    "3 deadlines are coming up in the next 14 days. TU Munich application is due soonest (5 days).",
    "Still waiting on responses from 2 universities submitted 3+ weeks ago. Consider following up.",
    "Your SOP draft is linked to 4 applications but still marked as 'draft'. Time to finalize?",
    "Great streak! 12 days in a row. Keep the momentum going.",
  ];
}

export async function generateFollowUpDraft(_applicationId: number) {
  await new Promise((r) => setTimeout(r, 1000));
  return `Dear Admissions Office,

I hope this message finds you well. I am writing to follow up on my application to the Master's program submitted on [date]. I wanted to confirm that all my application materials have been received and to inquire about the expected timeline for admissions decisions.

I remain very enthusiastic about the opportunity to join your program and would be happy to provide any additional information if needed.

Thank you for your time and consideration.

Best regards,
[Your Name]`;
}

export async function checkApplicationCompleteness(_applicationId: number) {
  await new Promise((r) => setTimeout(r, 800));
  return {
    complete: ["Application form", "Statement of Purpose", "CV/Resume", "Application fee"],
    missing: ["Official transcripts", "IELTS score report", "Two letters of recommendation"],
    percentage: 57,
  };
}

export async function parseTaskFromNaturalLanguage(_text: string) {
  await new Promise((r) => setTimeout(r, 500));
  return {
    title: "Follow up with University of Toronto admissions",
    description: "Send a follow-up email regarding application status",
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0],
    priority: "medium" as const,
  };
}

export async function searchPrograms(
  _query: string,
  _filters: Record<string, unknown>
) {
  // TODO: AI integration — add natural language search capability
  return null;
}

export function calculateFitScore(program: {
  country?: string;
  ieltsMin?: number | null;
  gpaMin?: number | null;
  tuitionAmount?: number | null;
  scholarshipAvailable?: boolean | null;
}): number {
  // TODO: AI integration — replace with real user profile matching
  let score = 40;
  if (program.country === "Canada") score += 20;
  if (program.country === "Germany") score += 15;
  if (program.ieltsMin && program.ieltsMin <= 7.0) score += 15;
  if (program.gpaMin && program.gpaMin <= 3.5) score += 10;
  if (program.scholarshipAvailable) score += 10;
  if (program.tuitionAmount && program.tuitionAmount < 15000) score += 5;
  return Math.min(score, 100);
}

export async function recommendSimilarPrograms(_programId: number) {
  await new Promise((r) => setTimeout(r, 800));
  return [
    { id: 1, name: "MSc Data Science", university: "McGill University" },
    { id: 2, name: "MSc Artificial Intelligence", university: "University of Alberta" },
    { id: 3, name: "MEng Computer Engineering", university: "University of Waterloo" },
  ];
}

export async function generateStarterTasks(_programId: number) {
  return [
    "Review program requirements",
    "Draft SOP outline",
    "Request transcripts",
    "Identify recommenders",
    "Check application portal",
    "Note application fee deadline",
  ];
}
