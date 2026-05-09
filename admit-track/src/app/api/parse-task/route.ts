import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "openai/gpt-oss-20b:free",
];

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: "text is required" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt = `Today is ${today}. Parse the following task description into structured data.
Return ONLY a valid JSON object — no markdown, no explanation.

{
  "title": "short imperative phrase summarising the task (max 80 chars, remove date/priority language)",
  "description": "any extra context worth keeping, or null",
  "dueDate": "YYYY-MM-DD resolved from today, or null if no date mentioned",
  "priority": "high | medium | low"
}

Priority rules:
- high: urgent, ASAP, critical, important, deadline soon
- low: when ready, no rush, someday, low priority
- medium: everything else (default)

Resolve relative dates from today (${today}):
- "tomorrow" → next day
- "next Friday" → next occurrence of Friday
- "in 3 days" → ${today} + 3
- "end of month" → last day of current month`;

  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!openrouterKey) {
    // No API key — basic parse without AI
    return NextResponse.json({
      title: text.slice(0, 80),
      description: null,
      dueDate: null,
      priority: /urgent|asap|critical/i.test(text) ? "high" : "medium",
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
          "X-Title": "admitus Task Parser",
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          max_tokens: 250,
          temperature: 0.1,
          stream: false,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.status === 429 || res.status === 402) { await res.text().catch(() => {}); continue; }
      if (!res.ok) continue;

      const data = await res.json();
      const content: string = data.choices?.[0]?.message?.content ?? "";

      // Try direct JSON parse first
      try { return NextResponse.json(JSON.parse(content)); } catch { /* fall through */ }

      // Extract JSON object from markdown fences or surrounding text
      const match = content.match(/\{[\s\S]*?\}/);
      if (match) {
        try { return NextResponse.json(JSON.parse(match[0])); } catch { /* try next model */ }
      }
    } catch { continue; }
  }

  // Final fallback
  return NextResponse.json({
    title: text.slice(0, 80),
    description: null,
    dueDate: null,
    priority: "medium",
  });
}
