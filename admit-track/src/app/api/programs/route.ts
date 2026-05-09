import { db } from "@/db";
import { programs, universities, programIntakes, programDocumentsRequired } from "@/db/schema";
import { eq, like, and, lte, gte, inArray, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const country = searchParams.get("country");
  const degreeLevel = searchParams.get("degreeLevel");
  const field = searchParams.get("field");
  const language = searchParams.get("language");
  const maxTuition = searchParams.get("maxTuition");
  const greRequired = searchParams.get("greRequired");
  const scholarship = searchParams.get("scholarship");
  const sortBy = searchParams.get("sortBy") || "ranking";

  const conditions = [];

  if (query) {
    conditions.push(
      sql`(${programs.name} LIKE ${'%' + query + '%'} OR ${universities.name} LIKE ${'%' + query + '%'})`
    );
  }
  if (country) {
    const countries = country.split(",");
    conditions.push(inArray(universities.country, countries));
  }
  if (degreeLevel) {
    conditions.push(eq(programs.degreeLevel, degreeLevel as "Bachelors" | "Masters" | "PhD"));
  }
  if (field) {
    conditions.push(eq(programs.fieldOfStudy, field));
  }
  if (language) {
    conditions.push(eq(programs.languageOfInstruction, language));
  }
  if (maxTuition) {
    conditions.push(lte(programs.tuitionAmount, parseFloat(maxTuition)));
  }
  if (greRequired === "false") {
    conditions.push(eq(programs.greRequired, false));
  } else if (greRequired === "true") {
    conditions.push(eq(programs.greRequired, true));
  }
  if (scholarship === "true") {
    conditions.push(eq(programs.scholarshipAvailable, true));
  }

  let orderBy;
  switch (sortBy) {
    case "tuition_asc":
      orderBy = programs.tuitionAmount;
      break;
    case "ranking":
      orderBy = programs.ranking;
      break;
    default:
      orderBy = programs.ranking;
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select({
      id: programs.id,
      universityId: programs.universityId,
      universityName: universities.name,
      universityCountry: universities.country,
      universityCity: universities.city,
      name: programs.name,
      degreeLevel: programs.degreeLevel,
      fieldOfStudy: programs.fieldOfStudy,
      languageOfInstruction: programs.languageOfInstruction,
      description: programs.description,
      durationMonths: programs.durationMonths,
      tuitionAmount: programs.tuitionAmount,
      tuitionCurrency: programs.tuitionCurrency,
      tuitionPeriod: programs.tuitionPeriod,
      applicationFeeAmount: programs.applicationFeeAmount,
      applicationFeeCurrency: programs.applicationFeeCurrency,
      ieltsMin: programs.ieltsMin,
      toeflMin: programs.toeflMin,
      gpaMin: programs.gpaMin,
      greRequired: programs.greRequired,
      scholarshipAvailable: programs.scholarshipAvailable,
      sourceUrl: programs.sourceUrl,
      ranking: programs.ranking,
      requiredSkills: programs.requiredSkills,
      prerequisites: programs.prerequisites,
      researchAreas: programs.researchAreas,
    })
    .from(programs)
    .innerJoin(universities, eq(programs.universityId, universities.id))
    .where(whereClause)
    .orderBy(orderBy);

  // Get intakes for each program
  const programsWithIntakes = await Promise.all(
    rows.map(async (prog) => {
      const intakes = await db
        .select()
        .from(programIntakes)
        .where(eq(programIntakes.programId, prog.id));

      const docsRequired = await db
        .select()
        .from(programDocumentsRequired)
        .where(eq(programDocumentsRequired.programId, prog.id));

      return { ...prog, intakes, documentsRequired: docsRequired };
    })
  );

  return NextResponse.json(programsWithIntakes);
}
