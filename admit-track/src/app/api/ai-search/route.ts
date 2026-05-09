import { NextRequest } from "next/server";
import { db } from "@/db";
import { universities, programs, programIntakes, programDocumentsRequired } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Compact key schema to minimise token output
const SYSTEM_PROMPT = `You are a university program directory. Output 12 real graduate programs as NDJSON — one compact JSON object per line, no array, no markdown.

Keys: un=universityName, co=country, ci=city, pn=programName, dl=Bachelors|Masters|PhD, fo=fieldOfStudy, ta=tuitionAmount(number|null), tc=tuitionCurrency(null if unknown), tp=per_year|total|null, im=ieltsMin(number|null), it=toeflMin(number|null), gm=gpaMin(number|null), gr=greRequired(bool), sc=scholarshipAvailable(bool), rs=requiredSkills([string] list of skills the applicant should have, e.g. "Python,machine learning,linear algebra"), pr=prerequisites([string] list of prerequisite coursework, e.g. "Calculus,Probability,Programming"), ra=researchAreas([string] list of research fields, e.g. "Natural Language Processing,Computer Vision,Robotics"), in=[{tm:Fall|Winter|Spring|Summer,iy:2025|2026,ad:YYYY-MM-DD|null}](max 2 intakes), no=one sentence naming a specific admission bottleneck that could block or delay the application (e.g. requires prior supervisor agreement, must apply via Campus France with earlier deadline, mandatory research proposal, requires portfolio, entrance exam required) — null if none, lk=[{l:label,u:url}] 2-3 real links: program page/tuition fees/application portal — null if unknown

HONESTY RULES — follow strictly:
- ad (deadline): set to null unless you are highly confident in a specific published date. Never guess or estimate a date.
- ta (tuition): set to null if you are not confident. Approximate figures are better than invented ones, but prefer null.
- im/it/gm: set to null if unsure. Do not invent minimum scores.
- lk: only include URLs you are confident are real and currently active. Set to null if unsure.
- Prefer null over a plausible-sounding fabrication for any field.

Each line must be valid JSON. No extra text.`;

type RawProgram = Record<string, unknown>;

type RawIntake = { tm?: unknown; iy?: unknown; ad?: unknown };

async function persistAndEnrich(p: RawProgram) {
  // Find or create university
  const existingUnis = await db
    .select()
    .from(universities)
    .where(sql`lower(${universities.name}) = lower(${String(p.un)})`)
    .limit(1);

  let uniRow: typeof universities.$inferSelect;
  if (existingUnis.length > 0) {
    uniRow = existingUnis[0];
  } else {
    const [r] = await db.insert(universities).values({
      name: String(p.un),
      country: String(p.co ?? "Unknown"),
      city: String(p.ci ?? "Unknown"),
    }).returning();
    uniRow = r;
  }

  // Find or create program
  const existingProgs = await db
    .select()
    .from(programs)
    .where(and(
      sql`lower(${programs.name}) = lower(${String(p.pn)})`,
      eq(programs.universityId, uniRow.id)
    ))
    .limit(1);

  const validDegree = ["Bachelors", "Masters", "PhD"].includes(String(p.dl))
    ? (p.dl as "Bachelors" | "Masters" | "PhD") : "Masters";
  const validTp = ["per_year", "total"].includes(String(p.tp))
    ? (p.tp as "per_year" | "total") : null;
  const notes = p.no ? String(p.no) : null;
  type RawLink = { l?: unknown; u?: unknown };
  const links: Array<{ l: string; u: string }> = Array.isArray(p.lk)
    ? (p.lk as RawLink[]).filter((x) => x.l && x.u).map((x) => ({ l: String(x.l), u: String(x.u) }))
    : [];
  const primaryUrl = links.find((lk) => /program|page|overview/i.test(lk.l))?.u ?? links[0]?.u ?? null;

  let progRow: typeof programs.$inferSelect;
  if (existingProgs.length > 0) {
    progRow = existingProgs[0];
    // Backfill description/notes if missing
    if (!progRow.description && notes) {
      const [updated] = await db.update(programs)
        .set({ description: notes })
        .where(eq(programs.id, progRow.id))
        .returning();
      progRow = updated;
    }
  } else {
    const [r] = await db.insert(programs).values({
      universityId: uniRow.id,
      name: String(p.pn),
      degreeLevel: validDegree,
      fieldOfStudy: String(p.fo ?? "General"),
      languageOfInstruction: p.la ? String(p.la) : "English",
      tuitionAmount: p.ta != null ? Number(p.ta) : null,
      tuitionCurrency: p.tc ? String(p.tc) : null,
      tuitionPeriod: validTp,
      ieltsMin: p.im != null ? Number(p.im) : null,
      toeflMin: p.it != null ? Number(p.it) : null,
      gpaMin: p.gm != null ? Number(p.gm) : null,
      greRequired: Boolean(p.gr),
      scholarshipAvailable: Boolean(p.sc),
      ranking: p.rk != null ? Number(p.rk) : null,
      description: notes,
      sourceUrl: primaryUrl,
      requiredSkills: Array.isArray(p.rs) ? JSON.stringify(p.rs) : null,
      prerequisites: Array.isArray(p.pr) ? JSON.stringify(p.pr) : null,
      researchAreas: Array.isArray(p.ra) ? JSON.stringify(p.ra) : null,
    }).returning();
    progRow = r;
  }

  // Upsert all intakes — support new `in` array field with fallback to legacy tm/iy/ad
  const rawIntakes: RawIntake[] = Array.isArray(p.in) && p.in.length > 0
    ? (p.in as RawIntake[])
    : [{ tm: p.tm, iy: p.iy, ad: p.ad }];

  for (const intake of rawIntakes) {
    const validTerm = ["Fall", "Winter", "Spring", "Summer"].includes(String(intake.tm))
      ? (intake.tm as "Fall" | "Winter" | "Spring" | "Summer") : "Fall";
    const intakeYear = intake.iy ? Number(intake.iy) : 2026;

    const existing = await db
      .select()
      .from(programIntakes)
      .where(and(
        eq(programIntakes.programId, progRow.id),
        eq(programIntakes.intakeTerm, validTerm),
        eq(programIntakes.intakeYear, intakeYear)
      ))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(programIntakes).values({
        programId: progRow.id,
        intakeTerm: validTerm,
        intakeYear,
        applicationDeadline: intake.ad ? String(intake.ad) : null,
      });
    }
  }

  // Return all intakes for this program sorted by year then term
  const allIntakes = await db
    .select()
    .from(programIntakes)
    .where(eq(programIntakes.programId, progRow.id));

  const docsRequired = await db
    .select()
    .from(programDocumentsRequired)
    .where(eq(programDocumentsRequired.programId, progRow.id));

  return {
    id: progRow.id,
    universityId: uniRow.id,
    universityName: uniRow.name,
    universityCountry: uniRow.country,
    universityCity: uniRow.city,
    name: progRow.name,
    degreeLevel: progRow.degreeLevel,
    fieldOfStudy: progRow.fieldOfStudy,
    languageOfInstruction: progRow.languageOfInstruction,
    description: progRow.description,
    durationMonths: progRow.durationMonths,
    tuitionAmount: progRow.tuitionAmount,
    tuitionCurrency: progRow.tuitionCurrency,
    tuitionPeriod: progRow.tuitionPeriod,
    applicationFeeAmount: progRow.applicationFeeAmount,
    applicationFeeCurrency: progRow.applicationFeeCurrency,
    ieltsMin: progRow.ieltsMin,
    toeflMin: progRow.toeflMin,
    gpaMin: progRow.gpaMin,
    greRequired: progRow.greRequired,
    scholarshipAvailable: progRow.scholarshipAvailable,
    sourceUrl: progRow.sourceUrl,
    ranking: progRow.ranking,
    requiredSkills: progRow.requiredSkills,
    prerequisites: progRow.prerequisites,
    researchAreas: progRow.researchAreas,
    intakes: allIntakes,
    documentsRequired: docsRequired,
    links,
  };
}

export async function GET(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('{"error":"OPENROUTER_API_KEY not configured"}\n', { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const criteria: string[] = [];
  const q = searchParams.get("q");
  const country = searchParams.get("country");
  const degreeLevel = searchParams.get("degreeLevel");
  const field = searchParams.get("field");
  const language = searchParams.get("language");
  const maxTuition = searchParams.get("maxTuition");
  const greRequired = searchParams.get("greRequired");
  const scholarship = searchParams.get("scholarship");

  if (q) criteria.push(`name contains "${q}"`);
  if (country) criteria.push(`country: ${country}`);
  if (degreeLevel) criteria.push(`degree: ${degreeLevel}`);
  if (field) criteria.push(`field: ${field}`);
  if (language) criteria.push(`language: ${language}`);
  if (maxTuition) criteria.push(`tuition ≤ ${maxTuition}/yr`);
  if (greRequired === "false") criteria.push("no GRE");
  if (greRequired === "true") criteria.push("GRE required");
  if (scholarship === "true") criteria.push("scholarship available");

  const exclude = searchParams.get("exclude");

  let userPrompt = criteria.length > 0
    ? `Programs matching: ${criteria.join(", ")}`
    : "Popular graduate programs from diverse countries and fields";

  if (exclude) {
    userPrompt += `\n\nDo NOT include programs from these universities (already shown): ${exclude}`;
  }

  const encoder = new TextEncoder();

  const MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "openai/gpt-oss-120b:free",
    "openai/gpt-oss-20b:free",
    "google/gemma-3-27b-it:free",
  ];

  function makeBody(model: string) {
    return JSON.stringify({
      model,
      max_tokens: 2048,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
  }

  const OR_HEADERS = { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Try each model in order; skip to next on 429
        let res: Response | null = null;
        for (const model of MODELS) {
          const attempt = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: OR_HEADERS,
            body: makeBody(model),
            signal: AbortSignal.timeout(90000),
          });
          if (attempt.status !== 429) { res = attempt; break; }
          // consume body so connection is released
          await attempt.text().catch(() => {});
        }

        if (!res) {
          controller.enqueue(encoder.encode(`{"error":"All models rate-limited. Please try again in a moment."}\n`));
          controller.close();
          return;
        }

        if (!res.ok) {
          const err = await res.text();
          controller.enqueue(encoder.encode(`{"error":"OpenRouter ${res.status}: ${err}"}\n`));
          controller.close();
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let contentBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          for (const line of decoder.decode(value, { stream: true }).split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? "";
              contentBuffer += delta;
            } catch { continue; }
          }

          // Extract and emit complete NDJSON lines
          let newline: number;
          while ((newline = contentBuffer.indexOf("\n")) !== -1) {
            const jsonLine = contentBuffer.slice(0, newline).trim();
            contentBuffer = contentBuffer.slice(newline + 1);
            if (!jsonLine) continue;
            try {
              const p = JSON.parse(jsonLine);
              if (!p.un || !p.pn) continue;
              const enriched = await persistAndEnrich(p);
              controller.enqueue(encoder.encode(JSON.stringify(enriched) + "\n"));
            } catch { /* malformed line */ }
          }
        }

        // Flush remaining buffer (last line with no trailing newline)
        const remaining = contentBuffer.trim();
        if (remaining) {
          try {
            const p = JSON.parse(remaining);
            if (p.un && p.pn) {
              const enriched = await persistAndEnrich(p);
              controller.enqueue(encoder.encode(JSON.stringify(enriched) + "\n"));
            }
          } catch { /* ignore */ }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        console.error("[ai-search]", msg);
        controller.enqueue(encoder.encode(`{"error":"${msg}"}\n`));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
