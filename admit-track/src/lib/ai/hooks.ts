// Mock AI hooks — returns hardcoded sample data after a delay
// TODO: Wire up real LLM integration

export async function tailorSOPForProgram(documentId: number, programId: number, profileId: number) {
  await new Promise(r => setTimeout(r, 800));
  return {
    suggestions: [
      { id: 1, type: "add_paragraph", text: "Add a paragraph about distributed systems research at this university, linking to your undergrad project on microservices." },
      { id: 2, type: "rewrite", text: "Rewrite the opening paragraph to reference the program's specific AI research group and Professor Chen's recent paper." },
      { id: 3, type: "add_paragraph", text: "Add a section connecting your internship at a data analytics startup to this program's industry collaboration initiatives." },
    ],
    tip: "📝 Tailored 3 suggestions for program #" + programId + " using profile #" + profileId,
  };
}

export async function analyzeRequirementGaps(applicationId: number, profileId: number) {
  await new Promise(r => setTimeout(r, 600));
  return {
    gaps: [
      { requirement: "GRE Score", status: "fail", detail: "GRE required by program but not in profile" },
      { requirement: "IELTS Writing", status: "partial", detail: "Profile IELTS 7.5 overall meets requirement but Writing 6.0 is below required 6.5" },
      { requirement: "Work Experience", status: "pass", detail: "2 years of relevant experience meets program requirement" },
      { requirement: "LOR Count", status: "pass", detail: "3 recommenders available, meets requirement of 2-3" },
    ],
  };
}

export async function generateProfileRecommendations(profileId: number) {
  await new Promise(r => setTimeout(r, 1000));
  return {
    recommendations: [
      { programId: 1, programName: "MSc Computer Science", universityName: "University of Toronto", reason: "Top-ranked CS program perfectly matches your research interests in AI/ML. IELTS 7.5 exceeds 7.0 requirement.", fitScore: 92 },
      { programId: 37, programName: "MSc Artificial Intelligence", universityName: "TU Delft", reason: "World-class AI program with affordable tuition. Your profile is competitive with strong GPA and language scores.", fitScore: 88 },
      { programId: 11, programName: "MSc Artificial Intelligence", universityName: "Université PSL", reason: "Elite French program combining academic rigor with strong theory focus. Matches your ML research background.", fitScore: 85 },
    ],
  };
}