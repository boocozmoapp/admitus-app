import { db } from "@/db";
import { skillMatchCache, programs } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "openai/gpt-oss-20b:free",
];

export async function POST(req: NextRequest) {
  const { applicantId, programId, applicantSkills, applicantCoursework, applicantInterests, programSkills, programPrereqs, programResearch } = await req.json();

  if (!applicantId || !programId) {
    return NextResponse.json({ error: "applicantId and programId required" }, { status: 400 });
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  const cached = await db
    .select()
    .from(skillMatchCache)
    .where(
      and(
        eq(skillMatchCache.applicantId, applicantId),
        eq(skillMatchCache.programId, programId),
        sql`${skillMatchCache.computedAt} >= ${sevenDaysAgo}`
      )
    )
    .limit(1);

  if (cached.length > 0) {
    return NextResponse.json({
      score: cached[0].score,
      matched: JSON.parse(cached[0].matched ?? "[]"),
      missing: JSON.parse(cached[0].missing ?? "[]"),
      tip: cached[0].tip,
    });
  }

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    return NextResponse.json({ score: 50, matched: [], missing: [], tip: "AI matching unavailable" });
  }

  const systemPrompt = `You are evaluating how well a graduate school applicant's background matches a specific program.
Score the match from 0–25 based on overlap between the applicant's skills/coursework/research interests
and the program's required skills, prerequisites, and research areas.
Return JSON only: { score: number, matched: string[], missing: string[], tip: string }`;

  const userPrompt = JSON.stringify({
    applicant: { skills: applicantSkills ?? [], coursework: applicantCoursework ?? [], researchInterests: applicantInterests ?? [] },
    program: { requiredSkills: programSkills ?? [], prerequisites: programPrereqs ?? [], researchAreas: programResearch ?? [] },
  });

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterKey}`,
          "HTTP-Referer": "https://admitus.app",
          "X-Title": "admitus Skill Match",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 500,
          temperature: 0.1,
          stream: false,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.status === 429 || res.status === 402) { await res.text().catch(() => {}); continue; }
      if (!res.ok) continue;

      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";

      let parsed: any = null;
      try { parsed = JSON.parse(text); } catch { /* fall through */ }
      if (!parsed) {
        const match = text.match(/\{[\s\S]*?\}/);
        if (match) { try { parsed = JSON.parse(match[0]); } catch { continue; } }
      }
      if (!parsed || typeof parsed.score !== "number") continue;

      await db.insert(skillMatchCache).values({
        applicantId,
        programId,
        score: parsed.score,
        matched: JSON.stringify(parsed.matched ?? []),
        missing: JSON.stringify(parsed.missing ?? []),
        tip: parsed.tip ?? null,
      });

      return NextResponse.json(parsed);
    } catch { continue; }
  }

  return NextResponse.json({ score: 50, matched: [], missing: [], tip: "AI matching unavailable" });
}
