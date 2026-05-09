import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a faculty directory assistant for graduate school applicants.

Given a university, research field, and the applicant's academic background, output up to 8 REAL faculty members as NDJSON — one compact JSON object per line, no wrapper array, no markdown, no extra text.

Keys:
  nm  = full name (string)
  tt  = title: "Professor" | "Associate Professor" | "Assistant Professor" | "Lecturer" | "Research Scientist"
  dp  = department (string)
  ri  = research interests, comma-separated keywords, max 6 (string)
  ln  = lab or research group name, null if none (string | null)
  wu  = personal or lab website URL — real URL only, null if unknown (string | null)
  gs  = google scholar profile URL — real URL only, null if unknown (string | null)
  em  = institutional email — ONLY if explicitly on a public faculty page, null otherwise (string | null)
  ms  = match score 0–100: how well this faculty's research aligns with the applicant's target field (number)
  mr  = one-sentence reason why this faculty is a good match for the applicant — be specific, mention overlapping topics (string)

Rules:
- Output ONLY real faculty at this institution. If unsure about someone, skip them — never fabricate names.
- NEVER guess emails. Set em=null unless you are certain it appears publicly.
- ms should reflect semantic overlap between faculty research and the applicant's field; 80–100 = strong match, 50–79 = moderate, below 50 = weak.
- Each line must be a single valid JSON object. No extra text, no markdown fences.`;

const MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-3-27b-it:free",
];

const OR_HEADERS = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "HTTP-Referer": "https://admitus.app",
  "X-Title": "admitus Faculty Search",
};

export async function GET(req: NextRequest) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: "OPENROUTER_API_KEY not configured" }) + "\n",
      { status: 500, headers: { "Content-Type": "application/x-ndjson" } }
    );
  }

  const { searchParams } = new URL(req.url);
  const university = searchParams.get("university") ?? "";
  const department = searchParams.get("department") ?? "";
  const field = searchParams.get("field") ?? "";
  const program = searchParams.get("program") ?? "";
  const userField = searchParams.get("userField") ?? "";     // applicant's field of study from profile
  const degreeTarget = searchParams.get("degreeTarget") ?? ""; // Masters / PhD

  const userPrompt = [
    `University: ${university}`,
    department ? `Department: ${department}` : null,
    field ? `Program field: ${field}` : null,
    program ? `Program name: ${program}` : null,
    userField ? `Applicant's background/interest: ${userField}` : null,
    degreeTarget ? `Applicant is targeting: ${degreeTarget}` : null,
    `\nList real faculty members doing research in "${field || program || "this field"}" at ${university}. Score each by how well their research aligns with the applicant's background${userField ? ` in ${userField}` : ""}.`,
  ]
    .filter(Boolean)
    .join("\n");

  function makeBody(model: string) {
    return JSON.stringify({
      model,
      max_tokens: 2000,
      stream: true,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let res: Response | null = null;
        for (const model of MODELS) {
          const attempt = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: OR_HEADERS,
            body: makeBody(model),
            signal: AbortSignal.timeout(90000),
          });
          if (attempt.status !== 429) { res = attempt; break; }
          await attempt.text().catch(() => {});
        }

        if (!res) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: "All models rate-limited — please try again in a moment." }) + "\n"));
          controller.close();
          return;
        }

        if (!res.ok) {
          const err = await res.text().catch(() => "unknown");
          controller.enqueue(encoder.encode(JSON.stringify({ error: `OpenRouter ${res.status}: ${err}` }) + "\n"));
          controller.close();
          return;
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let contentBuffer = "";

        function tryFlushLine(jsonLine: string) {
          if (!jsonLine || jsonLine.startsWith("```")) return;
          try {
            const parsed = JSON.parse(jsonLine);
            if (!parsed.nm || !parsed.tt || !parsed.dp) return;
            const faculty = {
              name: String(parsed.nm),
              title: String(parsed.tt),
              department: String(parsed.dp),
              researchInterests: parsed.ri ? String(parsed.ri) : null,
              labName: parsed.ln ? String(parsed.ln) : null,
              personalWebsiteUrl: parsed.wu ? String(parsed.wu) : null,
              scholarUrl: parsed.gs ? String(parsed.gs) : null,
              email: parsed.em ? String(parsed.em) : null,
              matchScore: parsed.ms != null ? Math.min(100, Math.max(0, Number(parsed.ms))) : null,
              matchReason: parsed.mr ? String(parsed.mr) : null,
            };
            controller.enqueue(encoder.encode(JSON.stringify(faculty) + "\n"));
          } catch { /* skip malformed */ }
        }

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

          let newline: number;
          while ((newline = contentBuffer.indexOf("\n")) !== -1) {
            tryFlushLine(contentBuffer.slice(0, newline).trim());
            contentBuffer = contentBuffer.slice(newline + 1);
          }
        }

        // Flush any trailing line (model didn't end with \n)
        tryFlushLine(contentBuffer.trim());

      } catch (err) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: err instanceof Error ? err.message : "Faculty search failed" }) + "\n")
        );
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
