import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are a data extraction assistant. Extract university program information from webpage text and return ONLY a valid JSON object with no explanation or markdown wrapping.

Use null for any field you cannot confidently determine from the text.

Required JSON shape:
{
  "universityName": string,
  "country": string,
  "city": string,
  "programName": string,
  "degreeLevel": "Bachelors" | "Masters" | "PhD",
  "intakeTerm": "Winter" | "Spring" | "Summer" | "Fall",
  "intakeYear": number,
  "applicationDeadline": "YYYY-MM-DD" | null,
  "tuitionAmount": number | null,
  "tuitionCurrency": string | null,
  "tuitionPeriod": "per_year" | "total" | null,
  "applicationFeeAmount": number | null,
  "applicationFeeCurrency": string | null,
  "ieltsRequired": number | null,
  "toeflRequired": number | null,
  "greRequired": boolean,
  "minGpa": number | null,
  "requiredSkills": string[] | null,
  "prerequisites": string[] | null,
  "researchAreas": string[] | null
}`;

function stripHtml(html: string): string {
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
    .slice(0, 15000);
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured. Add it to .env.local." },
      { status: 500 }
    );
  }

  const { url } = await req.json();
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  let pageText: string;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    pageText = stripHtml(await res.text());
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch URL: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 400 }
    );
  }

  if (pageText.length < 200) {
    return NextResponse.json(
      { error: "Page returned too little content — it may require JavaScript rendering." },
      { status: 422 }
    );
  }

  const FREE_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-3-27b-it:free",
    "openai/gpt-oss-20b:free",
  ];

  for (const model of FREE_MODELS) {
    try {
      const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://admitus.app",
          "X-Title": "admitus URL Extractor",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          temperature: 0.1,
          stream: false,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: `Extract program details from this webpage text:\n\n${pageText}` },
          ],
        }),
        signal: AbortSignal.timeout(20000),
      });

      if (llmRes.status === 429 || llmRes.status === 402) { await llmRes.text().catch(() => {}); continue; }
      if (!llmRes.ok) continue;

      const data = await llmRes.json();
      const responseText: string = data.choices?.[0]?.message?.content ?? "";

      // Try direct parse first, then regex extract
      let extracted: Record<string, unknown> | null = null;
      try { extracted = JSON.parse(responseText); } catch { /* fall through */ }
      if (!extracted) {
        const match = responseText.match(/\{[\s\S]*\}/);
        if (match) { try { extracted = JSON.parse(match[0]); } catch { continue; } }
      }
      if (!extracted) continue;

      extracted.sourceUrl = url;
      return NextResponse.json(extracted);
    } catch { continue; }
  }

  return NextResponse.json(
    { error: "All extraction models failed or returned unparseable responses. Please try again." },
    { status: 500 }
  );
}
