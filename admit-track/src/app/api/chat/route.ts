import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-3-27b-it:free",
];

function stripHtml(html: string, maxChars = 18000): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

async function fetchPageText(url: string, maxChars = 18000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const text = stripHtml(await res.text(), maxChars);
    return text.length >= 200 ? text : null;
  } catch {
    return null;
  }
}

async function fetchWikipediaRankings(universityName: string): Promise<string | null> {
  try {
    const title = universityName.replace(/ /g, "_");
    const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`;
    const res = await fetch(url, {
      headers: { "User-Agent": "admitus/1.0 (graduate admissions helper)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const raw = await res.text();

    const rankSection = raw.match(
      /==+\s*(?:Academic\s+)?[Rr]ankings?\s*==+[\s\S]{50,3000}/
    );
    if (rankSection) {
      return rankSection[0]
        .replace(/\{\{[^}]*\}\}/g, "")
        .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
        .replace(/<ref[^/]*\/>/gi, "")
        .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
        .replace(/\|/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 2000);
    }

    const patterns = [
      /QS World University Rankings?[^\n.]{0,300}/gi,
      /Times Higher Education[^\n.]{0,300}/gi,
      /Academic Ranking of World Universities[^\n.]{0,300}/gi,
      /ARWU[^\n.]{0,300}/gi,
    ];
    const hits: string[] = [];
    for (const pattern of patterns) {
      const matches = raw.match(pattern);
      if (matches) hits.push(...matches.slice(0, 2));
    }

    return hits.length > 0
      ? hits.join(" | ")
          .replace(/\{\{[^}]*\}\}/g, "")
          .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
          .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 1500)
      : null;
  } catch {
    return null;
  }
}

type IntakeInput = {
  intakeTerm: string;
  intakeYear: number;
  applicationDeadline: string | null;
};

type DocumentInput = {
  documentType: string;
};

type LinkInput = {
  l?: string;
  u?: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const message = String(body.message ?? "").trim();
  if (!message) return new Response("No message", { status: 400 });

  const programName = body.programName ?? null;
  const universityName = body.universityName ?? null;
  const universityCountry = body.universityCountry ?? null;
  const degreeLevel = body.degreeLevel ?? null;
  const fieldOfStudy = body.fieldOfStudy ?? null;
  const description = body.description ?? null;
  const requiredSkills = body.requiredSkills ?? null;
  const prerequisites = body.prerequisites ?? null;
  const researchAreas = body.researchAreas ?? null;
  const tuitionAmount = body.tuitionAmount ?? null;
  const tuitionCurrency = body.tuitionCurrency ?? "USD";
  const tuitionPeriod = body.tuitionPeriod ?? null;
  const dbRanking = body.ranking ?? null;
  const sourceUrl: string | null = body.sourceUrl ?? null;

  const intakes: IntakeInput[] = Array.isArray(body.intakes) ? body.intakes : [];
  const documentsRequired: DocumentInput[] = Array.isArray(body.documentsRequired)
    ? body.documentsRequired
    : [];
  const links: LinkInput[] = Array.isArray(body.links) ? body.links : [];

  const [pageText, wikiRankings] = await Promise.all([
    sourceUrl ? fetchPageText(sourceUrl) : Promise.resolve(null),
    universityName ? fetchWikipediaRankings(universityName) : Promise.resolve(null),
  ]);

  const rankingBlock = wikiRankings
    ? `\n=== UNIVERSITY RANKINGS (from Wikipedia) ===\n${wikiRankings}\n============================================`
    : dbRanking != null
      ? `\n=== UNIVERSITY RANKING ===\nGlobal ranking on record: #${dbRanking} (source: AI-estimated; verify source)\n==========================`
      : "";

  const tuitionLine = tuitionAmount != null
    ? `${tuitionAmount} ${tuitionCurrency}${tuitionPeriod === "per_year" ? " per year" : tuitionPeriod === "total" ? " total" : ""}`
    : "not on record";

  const intakeLines = intakes.length > 0
    ? intakes
        .map((intake) =>
          `  - ${intake.intakeTerm} ${intake.intakeYear}${intake.applicationDeadline ? ` - deadline ${intake.applicationDeadline}` : " - no deadline on record"}`
        )
        .join("\n")
    : "  (no intake/deadline data on record)";

  const docLines = documentsRequired.length > 0
    ? documentsRequired.map((doc) => `  - ${doc.documentType}`).join("\n")
    : "  (no document list on record)";

  const linkLines = links.length > 0
    ? links
        .filter((link) => link.u)
        .map((link) => `  - ${link.l ?? "Program link"}: ${link.u}`)
        .join("\n")
    : "  (no additional links on record)";

  const programSnapshot = `=== PROGRAM SNAPSHOT ===
Program    : ${programName ?? "unknown"}
University : ${universityName ?? "unknown"}
Country    : ${universityCountry ?? "unknown"}
Degree     : ${degreeLevel ?? "unknown"}
Field      : ${fieldOfStudy ?? "unknown"}
Description: ${description ?? "not on record"}
Research areas : ${researchAreas ?? "not on record"}
Required skills: ${requiredSkills ?? "not on record"}
Prerequisites  : ${prerequisites ?? "not on record"}
Tuition    : ${tuitionLine}
Official page : ${sourceUrl ?? "not on record"}

Application intakes / deadlines:
${intakeLines}

Documents required:
${docLines}

Additional links:
${linkLines}
========================`;

  const pageContext = pageText
    ? `\n=== LIVE WEBPAGE CONTENT (scraped from ${sourceUrl}) ===\n${pageText}\n=== END OF WEBPAGE CONTENT ===`
    : sourceUrl
      ? `\nThe official program page (${sourceUrl}) could not be fetched right now.`
      : "\nNo official program URL is on record.";

  const systemPrompt = `You are a helpful LLM advisor inside admitus, a graduate school application tracker.

Use the program snapshot, any live webpage content, ranking context, and your general academic/admissions knowledge to answer the student's question.

Rules:
1. Do not behave like a database-only bot. If the database lacks a qualitative field, still answer using clearly labelled likely/general guidance when possible.
2. Do not invent exact deadlines, scholarship amounts, admissions requirements, URLs, or faculty names.
3. For research-focus, curriculum, fit, and application-positioning questions, infer likely themes from the program name, field, university, country, description, research areas, skills, links, and common academic structure.
4. Distinguish verified facts from likely guidance. Use phrases like "Based on the program snapshot..." and "Likely areas to check..." when appropriate.
5. If the official page was fetched, prioritize it. If it was not fetched, suggest what the student should verify on the official page, but do not stop at "not in the database."
6. Keep replies concise: 2-4 short paragraphs or bullets.
7. When relevant, mention ranking context from the ranking block, but do not force it into unrelated answers.

${programSnapshot}
${rankingBlock}
${pageContext}`;

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (!openrouterKey) {
    return new Response("OPENROUTER_API_KEY not configured", { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let response: Response | null = null;
        for (const model of FREE_MODELS) {
          const attempt = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openrouterKey}`,
              "HTTP-Referer": req.nextUrl.origin,
              "X-Title": "admitus Program Chat",
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message },
              ],
              max_tokens: 800,
              temperature: 0.35,
              stream: true,
            }),
            signal: AbortSignal.timeout(30000),
          });

          if (attempt.status !== 429 && attempt.status !== 402) {
            response = attempt;
            break;
          }
          await attempt.text().catch(() => {});
        }

        if (!response) {
          controller.enqueue(encoder.encode("All AI models are currently rate-limited. Please try again in a moment."));
          controller.close();
          return;
        }

        if (!response.ok) {
          controller.enqueue(encoder.encode(`Service error (${response.status}) - please try again.`));
          controller.close();
          return;
        }

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
              const content = JSON.parse(data).choices?.[0]?.delta?.content;
              if (content) controller.enqueue(encoder.encode(content));
            } catch {
              continue;
            }
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error";
        controller.enqueue(encoder.encode(`Something went wrong: ${msg}`));
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
