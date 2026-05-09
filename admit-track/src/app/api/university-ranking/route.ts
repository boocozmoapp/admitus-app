import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export type RankingEntry = {
  source: string;
  rank: number;
  year: number | null;
};

// ── Fetch raw Wikipedia wikitext ──────────────────────────────────────────────
async function fetchWikiRaw(universityName: string): Promise<string | null> {
  const title = universityName.replace(/ /g, "_");
  const url = `https://en.wikipedia.org/w/index.php?title=${encodeURIComponent(title)}&action=raw`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "admitus/1.0 (graduate school helper)" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

// ── Multi-strategy ranking extractor ─────────────────────────────────────────
function extractRankings(raw: string): RankingEntry[] {
  const results: RankingEntry[] = [];
  const seen = new Set<string>();

  function add(source: string, rank: number, year: number | null = null) {
    if (seen.has(source)) return;
    if (rank <= 0 || rank >= 5000) return;
    seen.add(source);
    results.push({ source, rank, year });
  }

  // ── Strategy 1: {{Infobox university rankings}} template keys ─────────────
  // e.g. | QS_W = 111  or  | QS_W_2025 = 111
  const infoboxKeys: Array<[RegExp, string]> = [
    [/\|\s*QS_W(?:orld)?(?:_\d{4})?\s*=\s*(\d+)/i,      "QS World University Rankings"],
    [/\|\s*THE_W(?:orld)?(?:_\d{4})?\s*=\s*(\d+)/i,      "Times Higher Education"],
    [/\|\s*ARWU_W(?:orld)?(?:_\d{4})?\s*=\s*(\d+)/i,     "ARWU (Shanghai Rankings)"],
    [/\|\s*CWUR_W(?:orld)?(?:_\d{4})?\s*=\s*(\d+)/i,     "CWUR"],
    [/\|\s*USN(?:WR)?_W(?:orld)?(?:_\d{4})?\s*=\s*(\d+)/i, "U.S. News & World Report"],
    [/\|\s*NTU_W(?:orld)?(?:_\d{4})?\s*=\s*(\d+)/i,      "NTU Rankings"],
  ];

  for (const [re, source] of infoboxKeys) {
    const m = raw.match(re);
    if (m) {
      // Try to find year variant: QS_W_2025 = ...
      const yearM = raw.match(new RegExp(`\\|\\s*QS_W_(\\d{4})\\s*=`, "i"));
      add(source, parseInt(m[1]), yearM ? parseInt(yearM[1]) : null);
    }
  }

  // ── Strategy 2: Wikitable rows (same-line || format) ──────────────────────
  // e.g.  | [[QS World University Rankings|QS]] || 2024 || 111 || 3
  // The world rank column is usually the first numeric column after the year
  const wikirowDefs: Array<[RegExp, string]> = [
    [/(?:\[\[QS[^\]]*\]\]|QS\s+World[^\n|]*)\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "QS World University Rankings"],
    [/(?:\[\[Times Higher[^\]]*\]\]|Times\s+Higher\s+Education[^\n|]*)\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "Times Higher Education"],
    [/(?:\[\[Academic Ranking[^\]]*\]\]|\[\[ARWU[^\]]*\]\]|ARWU[^\n|]*)\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "ARWU (Shanghai Rankings)"],
    [/(?:\[\[U\.?S\.? News[^\]]*\]\]|U\.?S\.?\s*News[^\n|]*)\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "U.S. News & World Report"],
  ];

  for (const [re, source] of wikirowDefs) {
    if (seen.has(source)) continue;
    const m = raw.match(re);
    if (m) add(source, parseInt(m[2]), parseInt(m[1]));
  }

  // ── Strategy 3: Wikitable rows (multi-line | format) ──────────────────────
  // | QS\n| 2024\n| 111
  // Normalise newline-separated cells then apply same patterns
  if (!seen.has("QS World University Rankings") || !seen.has("Times Higher Education")) {
    // Extract the rankings section if present
    const rankSectionMatch = raw.match(/==+\s*(?:Academic\s+)?[Rr]ankings?\s*==+[\s\S]{0,8000}/);
    const section = rankSectionMatch ? rankSectionMatch[0] : raw.slice(0, 30000);

    // Collapse multi-line wikitable rows into single lines
    const collapsed = section
      .replace(/\n\s*\|\s*/g, " || ")
      .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
      .replace(/'{2,3}/g, "");

    const collapsedDefs: Array<[RegExp, string]> = [
      [/QS(?:\s+World)?(?:\s+University\s+Rankings?)?\s*\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "QS World University Rankings"],
      [/Times\s+Higher\s+Education\s*\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "Times Higher Education"],
      [/(?:ARWU|Academic\s+Ranking[^|]*)\s*\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "ARWU (Shanghai Rankings)"],
      [/U\.?S\.?\s*News[^|]*\s*\|\|\s*(\d{4})\s*\|\|\s*(\d+)/i, "U.S. News & World Report"],
    ];

    for (const [re, source] of collapsedDefs) {
      if (seen.has(source)) continue;
      const m = collapsed.match(re);
      if (m) add(source, parseInt(m[2]), parseInt(m[1]));
    }
  }

  // ── Strategy 4: Free-text fallback in rankings section ────────────────────
  const rankSectionMatch = raw.match(/==+\s*(?:Academic\s+)?[Rr]ankings?\s*==+[\s\S]{0,5000}/);
  if (rankSectionMatch) {
    const text = rankSectionMatch[0]
      .replace(/\{\{[^{}]*\}\}/g, "")
      .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, "")
      .replace(/\[\[([^\]|]+\|)?([^\]]+)\]\]/g, "$2")
      .replace(/[|{}'"]/g, " ")
      .replace(/\s+/g, " ");

    const freetextDefs: Array<[RegExp, string]> = [
      [/QS\s+World\s+University\s+Rankings?[^0-9]{0,80}?(\d+)/i, "QS World University Rankings"],
      [/Times\s+Higher\s+Education[^0-9]{0,80}?(\d+)/i, "Times Higher Education"],
      [/(?:ARWU|Academic\s+Ranking\s+of\s+World\s+Universities)[^0-9]{0,80}?(\d+)/i, "ARWU (Shanghai Rankings)"],
    ];

    for (const [re, source] of freetextDefs) {
      if (seen.has(source)) continue;
      const m = text.match(re);
      if (m) {
        const rank = parseInt(m[1]);
        if (rank > 0 && rank < 3000) add(source, rank, null);
      }
    }
  }

  // Sort: QS first, then THE, then others by rank
  return results.sort((a, b) => {
    const order = ["QS World University Rankings", "Times Higher Education", "ARWU (Shanghai Rankings)"];
    const ai = order.indexOf(a.source);
    const bi = order.indexOf(b.source);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.rank - b.rank;
  });
}

// ── GET handler ───────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name");
  if (!name || name.trim().length < 2) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const raw = await fetchWikiRaw(name.trim());
  if (!raw) {
    return NextResponse.json({ rankings: [] });
  }

  const rankings = extractRankings(raw);
  return NextResponse.json({ rankings });
}
