import { db } from "@/db";
import { applications, deadlines, tasks, documents, universities } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-3-27b-it:free",
];

export async function GET() {
  const today = new Date().toISOString().split("T")[0];
  const in14Days = new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0];
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const ago21Days = new Date(Date.now() - 21 * 86400000).toISOString().split("T")[0];

  // Fetch everything in parallel
  const [allApps, allDeadlines, allTasks, allDocs] = await Promise.all([
    db
      .select({
        id: applications.id,
        status: applications.status,
        universityName: universities.name,
        programName: applications.programName,
        updatedAt: applications.updatedAt,
      })
      .from(applications)
      .innerJoin(universities, eq(applications.universityId, universities.id)),
    db.select().from(deadlines),
    db.select().from(tasks),
    db.select().from(documents),
  ]);

  // ── Compute summary metrics ──────────────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const a of allApps) statusCounts[a.status] = (statusCounts[a.status] ?? 0) + 1;

  const upcoming14 = allDeadlines.filter(d => !d.completed && d.dueDate >= today && d.dueDate <= in14Days);
  const overdue    = allDeadlines.filter(d => !d.completed && d.dueDate < today);
  const urgent7   = allDeadlines.filter(d => !d.completed && d.dueDate >= today && d.dueDate <= in7Days);

  const pendingTasks    = allTasks.filter(t => !t.completed);
  const tasksDueThisWeek = allTasks.filter(t => !t.completed && t.dueDate && t.dueDate >= today && t.dueDate <= in7Days);

  const docsTotal     = allDocs.length;
  const docsWithFile  = allDocs.filter(d => d.fileUrl).length;
  const docsDraft     = allDocs.filter(d => d.status === "draft").length;

  const submittedApps = allApps.filter(a => a.status === "submitted");
  const longPending   = submittedApps.filter(a => (a.updatedAt ?? "").slice(0, 10) <= ago21Days);

  // ── Build snapshot text for LLM ──────────────────────────────────────────────
  const snapshot = `
TODAY: ${today}

APPLICATIONS (${allApps.length} total):
${Object.entries(statusCounts).map(([s, c]) => `  - ${s}: ${c}`).join("\n") || "  None yet"}

UPCOMING DEADLINES (next 14 days): ${upcoming14.length}
${upcoming14.slice(0, 5).map(d => `  - "${d.title}" on ${d.dueDate}`).join("\n") || "  None"}

URGENT DEADLINES (next 7 days): ${urgent7.length}
${urgent7.slice(0, 3).map(d => `  - "${d.title}" on ${d.dueDate}`).join("\n") || "  None"}

OVERDUE (not completed): ${overdue.length}
${overdue.slice(0, 3).map(d => `  - "${d.title}" was due ${d.dueDate}`).join("\n") || "  None"}

PENDING TASKS: ${pendingTasks.length} total, ${tasksDueThisWeek.length} due this week

DOCUMENTS: ${docsTotal} total | ${docsWithFile} files uploaded | ${docsDraft} still in draft

APPLICATIONS SUBMITTED 3+ WEEKS AGO (no decision yet): ${longPending.length}
${longPending.slice(0, 3).map(a => `  - ${a.universityName}: ${a.programName}`).join("\n") || "  None"}
`.trim();

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    return NextResponse.json({ bullets: [] });
  }

  const systemPrompt = `You are an AI assistant inside admitus, a graduate school application tracker.
Based on the student's REAL data snapshot below, write 4–5 short, specific, actionable weekly-summary bullet points.

Rules:
- MUST reference actual numbers or names from the data — never be vague
- Focus on: what needs urgent attention, progress made, and one concrete next step
- If a field shows "None", skip that topic
- If there are 0 applications, write 2–3 motivational "getting started" bullets instead
- Keep each bullet under 18 words
- Return ONLY a JSON array of strings. No markdown, no extra text.
  Example: ["Bullet one here.", "Bullet two here.", "Bullet three."]`;

  let bullets: string[] = [];

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterKey}`,
          "HTTP-Referer": "https://admitus.app",
          "X-Title": "admitus Weekly Summary",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: snapshot },
          ],
          max_tokens: 350,
          temperature: 0.4,
          stream: false,
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (res.status === 429 || res.status === 402) { await res.text().catch(() => {}); continue; }
      if (!res.ok) continue;

      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content?.trim() ?? "";

      // Parse: JSON array first
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) { bullets = parsed; break; }
      } catch {/* try alternatives */}

      // Extract JSON array embedded in markdown code block
      const match = content.match(/\[[\s\S]*?\]/);
      if (match) {
        try {
          const parsed = JSON.parse(match[0]);
          if (Array.isArray(parsed) && parsed.length > 0) { bullets = parsed; break; }
        } catch {/* ignore */}
      }

      // Fallback: split by lines
      const lines = content
        .split("\n")
        .map(l => l.replace(/^[\s\-•*\d.:"]+/, "").trim())
        .filter(l => l.length > 8 && l.length < 200);
      if (lines.length > 0) { bullets = lines; break; }
    } catch {
      continue;
    }
  }

  return NextResponse.json({ bullets: bullets.slice(0, 5) });
}
