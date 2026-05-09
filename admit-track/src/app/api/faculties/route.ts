import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const programId = searchParams.get("programId");

  // Simple, safe fallback: fetch program details to tailor results when possible
  let program: any = null;
  if (programId) {
    try {
      const baseUrl = req.nextUrl.origin;
      const r = await fetch(`${baseUrl}/api/applications/${programId}`);
      if (r.ok) program = await r.json();
    } catch {
      program = null;
    }
  }

  const field = program?.fieldOfStudy || (program?.programName ? program.programName : "CS");

  // Static sample faculties, tailored by field of study
  const facultiesByField: Record<string, Array<any>> = {
    CS: [
      { id: 1, name: "Dr. Ada Lovelace", researchInterests: ["AI Systems", "Algorithmic Theory", "Human-Computer Interaction"] },
      { id: 2, name: "Dr. Alan Turing", researchInterests: ["Cryptography", "Computational Complexity", "Theoretical CS"] },
      { id: 3, name: "Dr. Grace Hopper", researchInterests: ["Programming Languages", "Compiler Design"] },
    ],
    "Data Science": [
      { id: 4, name: "Dr. Regina Barzilay", researchInterests: ["NLP", "Healthcare AI"] },
      { id: 5, name: "Dr. Tom Mitchell", researchInterests: ["Machine Learning", "Text Mining"] },
      { id: 6, name: "Dr. Daphne Koller", researchInterests: ["Statistical Learning", "Probabilistic Reasoning"] },
    ],
    Engineering: [
      { id: 7, name: "Dr. Nikola Tesla", researchInterests: ["Electrical Systems", "Power Electronics"] },
      { id: 8, name: "Dr. Marie Curie", researchInterests: ["Materials Science", "Radiation Effects"] },
    ],
  };

  const faculties = facultiesByField[field as string] ?? facultiesByField["CS"];

  return NextResponse.json(faculties);
}
