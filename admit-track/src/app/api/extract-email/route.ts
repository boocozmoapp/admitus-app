import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "openai/gpt-oss-20b:free",
];

export async function POST(req: NextRequest) {
  const { content } = await req.json();
  if (!content) return NextResponse.json({ error: "content is required" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `Today is ${today}. Extract key information from this university/admissions email.
Return ONLY a valid JSON object — no markdown, no explanation.

{
  "subject": "concise email subject line (max 80 chars)",
  "university": "name of the university/institution, or null",
  "deadline": "YYYY-MM-DD of any deadline mentioned, or null",
  "actionRequired": "one sentence describing the required action, or null if no action needed",
  "sentiment": "positive | neutral | negative",
  "type": "admission | rejection | waitlist | interview | document_request | financial | general"
}

Type guide:
- admission: acceptance, offer, congratulations
- rejection: unfortunately, not selected, decline
- waitlist: waitlisted, pending, reserve list
- interview: interview invitation, schedule a call
- document_request: requesting transcripts, references, additional documents
- financial: scholarship, funding, bursary, financial aid
- general: everything else`;

  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!openrouterKey) {
    return NextResponse.json({
      subject: "Email log",
      university: null,
      deadline: null,
      actionRequired: null,
      sentiment: "neutral" as const,
      type: "general",
    });
  }

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openrouterKey}`,
          "HTTP-Referer": "https://admitus.app",
          "X-Title": "admitus Email Extractor",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            // Trim to avoid token overuse
            { role: "user", content: content.slice(0, 8000) },
          ],
          max_tokens: 300,
          temperature: 0.1,
          stream: false,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.status === 429 || res.status === 402) { await res.text().catch(() => {}); continue; }
      if (!res.ok) continue;

      const data = await res.json();
      const text: string = data.choices?.[0]?.message?.content ?? "";

      try { return NextResponse.json(JSON.parse(text)); } catch { /* fall through */ }

      const match = text.match(/\{[\s\S]*?\}/);
      if (match) {
        try { return NextResponse.json(JSON.parse(match[0])); } catch { /* try next model */ }
      }
    } catch { continue; }
  }

  return NextResponse.json({
    subject: "Email log",
    university: null,
    deadline: null,
    actionRequired: null,
    sentiment: "neutral" as const,
    type: "general",
  });
}
