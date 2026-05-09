import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "grad-pilot.db");
const sqlite = new Database(dbPath);
sqlite.exec("PRAGMA journal_mode = WAL;");
sqlite.exec("PRAGMA foreign_keys = ON;");
const db = drizzle(sqlite, { schema });

function createTables() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified_at TEXT,
      verification_token_hash TEXT,
      verification_token_expires_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS universities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      website TEXT,
      logo_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_id INTEGER NOT NULL REFERENCES universities(id),
      profile_id INTEGER REFERENCES profiles(id),
      program_name TEXT NOT NULL,
      degree_level TEXT NOT NULL,
      intake_term TEXT NOT NULL,
      intake_year INTEGER NOT NULL,
      application_deadline TEXT,
      decision_expected_date TEXT,
      tuition_amount REAL,
      tuition_currency TEXT,
      tuition_period TEXT,
      application_fee_amount REAL,
      application_fee_currency TEXT,
      status TEXT NOT NULL DEFAULT 'researching',
      priority TEXT NOT NULL DEFAULT 'medium',
      min_gpa REAL,
      ielts_required REAL,
      toefl_required INTEGER,
      gre_required INTEGER,
      source_url TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      file_url TEXT,
      version INTEGER NOT NULL DEFAULT 1,
      content TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS application_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      document_id INTEGER NOT NULL REFERENCES documents(id)
    );
    CREATE TABLE IF NOT EXISTS recommenders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      designation TEXT,
      institution TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS lor_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER NOT NULL REFERENCES applications(id),
      recommender_id INTEGER NOT NULL REFERENCES recommenders(id),
      status TEXT NOT NULL DEFAULT 'not_requested',
      requested_date TEXT,
      submitted_date TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      subject TEXT NOT NULL,
      sender TEXT NOT NULL,
      recipient TEXT NOT NULL,
      body TEXT NOT NULL,
      direction TEXT NOT NULL,
      thread_id TEXT,
      sent_at TEXT NOT NULL,
      extracted_metadata TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS deadlines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      due_date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id INTEGER REFERENCES applications(id),
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      completed INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'medium',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS decision_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_type TEXT NOT NULL,
      title TEXT NOT NULL,
      reasoning TEXT,
      related_application_id INTEGER REFERENCES applications(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      xp INTEGER NOT NULL DEFAULT 0,
      level INTEGER NOT NULL DEFAULT 1,
      current_streak INTEGER NOT NULL DEFAULT 0,
      longest_streak INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT,
      total_applications_submitted INTEGER NOT NULL DEFAULT 0,
      total_emails_sent INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS xp_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action_type TEXT NOT NULL,
      xp_awarded INTEGER NOT NULL,
      related_entity_type TEXT,
      related_entity_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_id INTEGER NOT NULL REFERENCES universities(id),
      name TEXT NOT NULL,
      degree_level TEXT NOT NULL,
      field_of_study TEXT NOT NULL,
      language_of_instruction TEXT NOT NULL DEFAULT 'English',
      description TEXT,
      duration_months INTEGER,
      tuition_amount REAL,
      tuition_currency TEXT,
      tuition_period TEXT,
      application_fee_amount REAL,
      application_fee_currency TEXT,
      ielts_min REAL,
      toefl_min INTEGER,
      gpa_min REAL,
      gre_required INTEGER DEFAULT 0,
      scholarship_available INTEGER DEFAULT 0,
      source_url TEXT,
      ranking INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS program_intakes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id),
      intake_term TEXT NOT NULL,
      intake_year INTEGER NOT NULL,
      application_deadline TEXT,
      decision_expected_date TEXT,
      application_open_date TEXT
    );
    CREATE TABLE IF NOT EXISTS program_documents_required (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id),
      document_type TEXT NOT NULL,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS saved_programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL REFERENCES programs(id),
      notes TEXT,
      saved_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS saved_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      filter_criteria TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_run_at TEXT
    );
    CREATE TABLE IF NOT EXISTS profiles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      degree_level TEXT NOT NULL,
      field_of_study TEXT NOT NULL,
      target_countries TEXT NOT NULL,
      ielts_score REAL,
      toefl_score INTEGER,
      gpa REAL,
      gre_score INTEGER,
      budget_amount REAL,
      budget_currency TEXT,
      accent_color TEXT DEFAULT '#1A4040',
      is_active INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS profile_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id),
      document_id INTEGER NOT NULL REFERENCES documents(id),
      role TEXT,
      notes TEXT
    );
    CREATE TABLE IF NOT EXISTS fit_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER NOT NULL REFERENCES profiles(id),
      program_id INTEGER NOT NULL REFERENCES programs(id),
      overall_score REAL NOT NULL,
      gpa_score REAL,
      language_score REAL,
      gre_score REAL,
      budget_score REAL,
      field_score REAL,
      breakdown TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS supervisors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      profile_id INTEGER REFERENCES profiles(id),
      university_id INTEGER REFERENCES universities(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      university TEXT NOT NULL,
      department TEXT,
      program TEXT,
      title TEXT,
      research_interests TEXT,
      personal_website_url TEXT,
      status TEXT NOT NULL DEFAULT 'not_contacted',
      first_contacted_at TEXT,
      last_contacted_at TEXT,
      last_response_at TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS supervisor_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supervisor_id INTEGER NOT NULL REFERENCES supervisors(id),
      application_id INTEGER NOT NULL REFERENCES applications(id)
    );
    CREATE TABLE IF NOT EXISTS outreach_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supervisor_id INTEGER NOT NULL REFERENCES supervisors(id),
      type TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      occurred_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // ── Migration: add new columns if missing (safe to re-run) ────────────
  const existingCols = sqlite.prepare("PRAGMA table_info(programs)").all() as { name: string }[];
  const colNames = new Set(existingCols.map((c) => c.name));
  if (!colNames.has("required_skills")) sqlite.exec("ALTER TABLE programs ADD COLUMN required_skills TEXT");
  if (!colNames.has("prerequisites")) sqlite.exec("ALTER TABLE programs ADD COLUMN prerequisites TEXT");
  if (!colNames.has("research_areas")) sqlite.exec("ALTER TABLE programs ADD COLUMN research_areas TEXT");
  if (!colNames.has("skill_match_cache")) {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS skill_match_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        applicant_id INTEGER NOT NULL,
        program_id INTEGER NOT NULL REFERENCES programs(id),
        score REAL NOT NULL,
        matched TEXT,
        missing TEXT,
        tip TEXT,
        computed_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  // ── Migration: recreate fit_scores with new columns if needed ─────
  const fitCols = new Set(sqlite.prepare("PRAGMA table_info(fit_scores)").all().map((c: any) => c.name));
  if (!fitCols.has("degree_score")) {
    sqlite.exec("DROP TABLE IF EXISTS fit_scores");
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS fit_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        profile_id INTEGER NOT NULL REFERENCES profiles(id),
        program_id INTEGER NOT NULL REFERENCES programs(id),
        overall_score REAL NOT NULL,
        degree_score REAL,
        gpa_score REAL,
        skill_match_score REAL,
        budget_score REAL,
        scholarship_score REAL,
        breakdown TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

function seed() {
  console.log("Creating tables...");
  createTables();

  // Check if already seeded
  const existing = sqlite.prepare("SELECT COUNT(*) as count FROM universities").get() as { count: number };
  if (existing.count > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  console.log("Seeding database...");

  // Universities (20)
  const unis = [
    { name: "University of Toronto", country: "Canada", city: "Toronto", website: "https://utoronto.ca", logoUrl: null },
    { name: "McGill University", country: "Canada", city: "Montreal", website: "https://mcgill.ca", logoUrl: null },
    { name: "University of Waterloo", country: "Canada", city: "Waterloo", website: "https://uwaterloo.ca", logoUrl: null },
    { name: "University of British Columbia", country: "Canada", city: "Vancouver", website: "https://ubc.ca", logoUrl: null },
    { name: "University of Alberta", country: "Canada", city: "Edmonton", website: "https://ualberta.ca", logoUrl: null },
    { name: "McMaster University", country: "Canada", city: "Hamilton", website: "https://mcmaster.ca", logoUrl: null },
    { name: "Western University", country: "Canada", city: "London", website: "https://uwo.ca", logoUrl: null },
    { name: "Concordia University", country: "Canada", city: "Montreal", website: "https://concordia.ca", logoUrl: null },
    { name: "Carleton University", country: "Canada", city: "Ottawa", website: "https://carleton.ca", logoUrl: null },
    { name: "Dalhousie University", country: "Canada", city: "Halifax", website: "https://dal.ca", logoUrl: null },
    { name: "Université PSL", country: "France", city: "Paris", website: "https://psl.eu", logoUrl: null },
    { name: "Sciences Po", country: "France", city: "Paris", website: "https://sciencespo.fr", logoUrl: null },
    { name: "Sorbonne University", country: "France", city: "Paris", website: "https://sorbonne-universite.fr", logoUrl: null },
    { name: "École Polytechnique", country: "France", city: "Palaiseau", website: "https://polytechnique.edu", logoUrl: null },
    { name: "INSA Lyon", country: "France", city: "Lyon", website: "https://insa-lyon.fr", logoUrl: null },
    { name: "TU Munich", country: "Germany", city: "Munich", website: "https://tum.de", logoUrl: null },
    { name: "RWTH Aachen", country: "Germany", city: "Aachen", website: "https://rwth-aachen.de", logoUrl: null },
    { name: "Heidelberg University", country: "Germany", city: "Heidelberg", website: "https://uni-heidelberg.de", logoUrl: null },
    { name: "TU Delft", country: "Netherlands", city: "Delft", website: "https://tudelft.nl", logoUrl: null },
    { name: "University of Amsterdam", country: "Netherlands", city: "Amsterdam", website: "https://uva.nl", logoUrl: null },
  ];

  const insertUni = sqlite.prepare(
    "INSERT INTO universities (name, country, city, website, logo_url) VALUES (?, ?, ?, ?, ?)"
  );
  for (const u of unis) {
    insertUni.run(u.name, u.country, u.city, u.website, u.logoUrl);
  }

  // Profiles (must be before applications due to FK)
  const insertProfile = sqlite.prepare(
    "INSERT INTO profiles (name, degree_level, field_of_study, target_countries, ielts_score, gpa, budget_amount, budget_currency, accent_color, is_active, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );
  insertProfile.run("MS Computer Science - Canada", "Masters", "CS", "Canada,USA", 7.5, 3.6, 40000, "CAD", "#1A4040", 1, "Primary profile targeting top Canadian CS programs with US safeties");
  insertProfile.run("MS Public Policy - Europe", "Masters", "Public Policy", "France,Germany,Netherlands", 7.5, 3.6, 20000, "EUR", "#825EE4", 0, "Targeting European policy schools with affordable tuition");

  // Applications (6 from spec) — profileId: 1=CS Canada, 2=Public Policy Europe
  const apps = [
    { universityId: 1, profileId: 1, programName: "MSc Computer Science", degreeLevel: "Masters", intakeTerm: "Fall", intakeYear: 2026, deadline: daysFromNow(45), decisionDate: daysFromNow(150), tuition: 58680, currency: "CAD", period: "per_year", fee: 125, feeCurrency: "CAD", status: "submitted", priority: "high", gpa: 3.5, ielts: 7.0, toefl: 100, gre: false },
    { universityId: 2, profileId: 1, programName: "MSc Data Science", degreeLevel: "Masters", intakeTerm: "Fall", intakeYear: 2026, deadline: daysFromNow(30), decisionDate: daysFromNow(120), tuition: 26000, currency: "CAD", period: "per_year", fee: 120, feeCurrency: "CAD", status: "preparing", priority: "high", gpa: 3.3, ielts: 6.5, toefl: 90, gre: false },
    { universityId: 16, profileId: 1, programName: "MSc Informatics", degreeLevel: "Masters", intakeTerm: "Winter", intakeYear: 2027, deadline: daysFromNow(90), decisionDate: daysFromNow(180), tuition: 0, currency: "EUR", period: "per_year", fee: 0, feeCurrency: "EUR", status: "researching", priority: "medium", gpa: 3.0, ielts: 6.5, toefl: 88, gre: false },
    { universityId: 11, profileId: 1, programName: "MSc Artificial Intelligence", degreeLevel: "Masters", intakeTerm: "Fall", intakeYear: 2026, deadline: daysFromNow(15), decisionDate: daysFromNow(100), tuition: 4500, currency: "EUR", period: "per_year", fee: 30, feeCurrency: "EUR", status: "interview", priority: "high", gpa: 3.2, ielts: 7.0, toefl: 95, gre: false },
    { universityId: 12, profileId: 2, programName: "Master in Public Policy", degreeLevel: "Masters", intakeTerm: "Fall", intakeYear: 2026, deadline: daysFromNow(10), decisionDate: daysFromNow(100), tuition: 14850, currency: "EUR", period: "per_year", fee: 0, feeCurrency: "EUR", status: "submitted", priority: "medium", gpa: 3.0, ielts: 7.0, toefl: 100, gre: false },
    { universityId: 16, profileId: 2, programName: "MSc Robotics, Cognition, Intelligence", degreeLevel: "Masters", intakeTerm: "Spring", intakeYear: 2027, deadline: daysFromNow(120), decisionDate: daysFromNow(200), tuition: 0, currency: "EUR", period: "per_year", fee: 0, feeCurrency: "EUR", status: "researching", priority: "low", gpa: 3.3, ielts: 7.0, toefl: 100, gre: false },
  ];

  const insertApp = sqlite.prepare(
    `INSERT INTO applications (university_id, profile_id, program_name, degree_level, intake_term, intake_year, application_deadline, decision_expected_date, tuition_amount, tuition_currency, tuition_period, application_fee_amount, application_fee_currency, status, priority, min_gpa, ielts_required, toefl_required, gre_required, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
  );
  for (const a of apps) {
    insertApp.run(a.universityId, a.profileId, a.programName, a.degreeLevel, a.intakeTerm, a.intakeYear, a.deadline, a.decisionDate, a.tuition, a.currency, a.period, a.fee, a.feeCurrency, a.status, a.priority, a.gpa, a.ielts, a.toefl, a.gre ? 1 : 0);
  }

  // Documents (4)
  const docs = [
    { name: "Statement of Purpose - v2", type: "SOP", status: "draft", version: 2, content: "My passion for computer science began when I built my first website at age 14..." },
    { name: "Curriculum Vitae", type: "CV", status: "final", version: 3, content: null },
    { name: "IELTS Score Report", type: "IELTS", status: "final", version: 1, content: null },
    { name: "Undergraduate Transcripts", type: "Transcript", status: "final", version: 1, content: null },
  ];

  const insertDoc = sqlite.prepare(
    "INSERT INTO documents (name, type, status, version, content) VALUES (?, ?, ?, ?, ?)"
  );
  for (const d of docs) {
    insertDoc.run(d.name, d.type, d.status, d.version, d.content);
  }

  // Link docs to applications
  const insertAppDoc = sqlite.prepare(
    "INSERT INTO application_documents (application_id, document_id) VALUES (?, ?)"
  );
  // App 1 (Toronto) has SOP, CV, IELTS, Transcripts
  insertAppDoc.run(1, 1); insertAppDoc.run(1, 2); insertAppDoc.run(1, 3); insertAppDoc.run(1, 4);
  // App 2 (McGill) has CV, IELTS
  insertAppDoc.run(2, 2); insertAppDoc.run(2, 3);
  // App 4 (PSL) has SOP, CV
  insertAppDoc.run(4, 1); insertAppDoc.run(4, 2);
  // App 5 (Waterloo) has all
  insertAppDoc.run(5, 1); insertAppDoc.run(5, 2); insertAppDoc.run(5, 3); insertAppDoc.run(5, 4);

  // Recommenders (2)
  const insertRec = sqlite.prepare(
    "INSERT INTO recommenders (name, email, designation, institution) VALUES (?, ?, ?, ?)"
  );
  insertRec.run("Dr. Sarah Chen", "s.chen@university.edu", "Associate Professor of CS", "Current University");
  insertRec.run("Prof. James Miller", "j.miller@university.edu", "Professor of Data Science", "Current University");

  // LOR requests
  const insertLor = sqlite.prepare(
    "INSERT INTO lor_requests (application_id, recommender_id, status, requested_date, submitted_date) VALUES (?, ?, ?, ?, ?)"
  );
  insertLor.run(1, 1, "submitted", daysAgo(30), daysAgo(15));
  insertLor.run(1, 2, "requested", daysAgo(25), null);
  insertLor.run(5, 1, "submitted", daysAgo(40), daysAgo(25));
  insertLor.run(5, 2, "submitted", daysAgo(40), daysAgo(20));

  // Emails (8)
  const insertEmail = sqlite.prepare(
    `INSERT INTO emails (application_id, subject, sender, recipient, body, direction, thread_id, sent_at, extracted_metadata)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertEmail.run(1, "Application Received - MSc CS", "admissions@utoronto.ca", "student@email.com", "Dear Applicant,\n\nThank you for your application to the MSc Computer Science program. We have received your materials and will begin reviewing them shortly. You can expect a decision within 8-12 weeks.\n\nBest regards,\nGraduate Admissions", "inbound", "thread-1", daysAgo(20), JSON.stringify({ sentiment: "positive", actionRequested: null }));
  insertEmail.run(1, "Re: Application Received - MSc CS", "student@email.com", "admissions@utoronto.ca", "Dear Admissions Team,\n\nThank you for confirming receipt. Could you please confirm whether my IELTS scores have been received as well?\n\nBest regards", "outbound", "thread-1", daysAgo(18), null);
  insertEmail.run(4, "Interview Invitation - MSc AI", "admissions@psl.eu", "student@email.com", "Dear Applicant,\n\nWe are pleased to invite you for an interview for the MSc Artificial Intelligence program. Please select a time slot from the following options: March 15, March 18, or March 20.\n\nBest regards,\nPSL Admissions", "inbound", "thread-2", daysAgo(5), JSON.stringify({ sentiment: "positive", actionRequested: "Select interview time slot", deadline: daysFromNow(3) }));
  insertEmail.run(4, "Re: Interview Invitation - MSc AI", "student@email.com", "admissions@psl.eu", "Dear Admissions Team,\n\nThank you for the interview invitation. I would like to select March 18 at 2:00 PM CET.\n\nBest regards", "outbound", "thread-2", daysAgo(4), null);
  insertEmail.run(2, "Document Reminder - MSc Data Science", "grad.admissions@mcgill.ca", "student@email.com", "Dear Applicant,\n\nThis is a reminder that your application for the MSc Data Science program is missing the following documents:\n- Official transcripts\n- Statement of Purpose\n\nPlease submit these by the deadline.\n\nRegards,\nMcGill Graduate Admissions", "inbound", "thread-3", daysAgo(8), JSON.stringify({ sentiment: "neutral", actionRequested: "Submit missing documents" }));
  insertEmail.run(5, "Application Status Update - MMath CS", "cs-grad@uwaterloo.ca", "student@email.com", "Dear Applicant,\n\nYour application is currently under review by the admissions committee. We anticipate decisions will be communicated by early summer.\n\nRegards,\nCS Graduate Office", "inbound", "thread-4", daysAgo(12), JSON.stringify({ sentiment: "neutral", actionRequested: null }));
  insertEmail.run(null, "IELTS Score Delivery Confirmation", "noreply@ielts.org", "student@email.com", "Your IELTS test results have been sent to the following institutions:\n- University of Toronto\n- McGill University\n- University of Waterloo\n\nPlease allow 5-7 business days for processing.", "inbound", "thread-5", daysAgo(25), null);
  insertEmail.run(null, "Scholarship Application - Vanier CGS", "student@email.com", "vanier@nserc-crsng.gc.ca", "Dear Selection Committee,\n\nI am writing to submit my application for the Vanier Canada Graduate Scholarship for the 2026-2027 academic year.\n\nPlease find attached my research proposal and supporting documents.\n\nBest regards", "outbound", "thread-6", daysAgo(15), null);

  // Deadlines (5)
  const insertDeadline = sqlite.prepare(
    "INSERT INTO deadlines (application_id, title, type, due_date, completed) VALUES (?, ?, ?, ?, ?)"
  );
  insertDeadline.run(2, "McGill Application Deadline", "application", daysFromNow(30), 0);
  insertDeadline.run(4, "PSL Interview", "interview", daysFromNow(3), 0);
  insertDeadline.run(3, "TU Munich Application Opens", "application", daysFromNow(90), 0);
  insertDeadline.run(1, "Submit official transcripts to UofT", "document", daysFromNow(7), 0);
  insertDeadline.run(null, "Vanier Scholarship Result", "scholarship", daysFromNow(60), 0);

  // Tasks (6)
  const insertTask = sqlite.prepare(
    "INSERT INTO tasks (application_id, title, description, due_date, completed, priority) VALUES (?, ?, ?, ?, ?, ?)"
  );
  insertTask.run(2, "Finalize SOP for McGill", "Tailor the statement of purpose for McGill's Data Science program", daysFromNow(14), 0, "high");
  insertTask.run(2, "Request transcripts for McGill", "Order official transcripts from registrar", daysFromNow(10), 0, "high");
  insertTask.run(4, "Prepare for PSL interview", "Review common interview questions and prepare talking points", daysFromNow(2), 0, "high");
  insertTask.run(1, "Follow up on IELTS delivery to UofT", "Confirm IELTS scores were received", daysFromNow(5), 0, "medium");
  insertTask.run(3, "Research TU Munich requirements", "Look into specific documentation needed for international students", daysFromNow(30), 0, "low");
  insertTask.run(null, "Update CV with recent project", "Add the ML capstone project to CV", daysFromNow(7), 0, "medium");

  // Decision log
  const insertDecision = sqlite.prepare(
    "INSERT INTO decision_log (entry_type, title, reasoning, related_application_id, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  insertDecision.run("added_application", "Added University of Toronto", "Top CS program in Canada, strong research in AI/ML which aligns with my interests. High tuition but strong funding opportunities.", 1, daysAgo(45));
  insertDecision.run("added_application", "Added TU Munich", "Tuition-free, excellent reputation in Europe, good industry connections in Munich. Winter intake gives more preparation time.", 3, daysAgo(30));
  insertDecision.run("priority_change", "Elevated PSL to high priority", "Interview invitation received — strong signal of interest. Need to prioritize preparation.", 4, daysAgo(5));
  insertDecision.run("strategy_note", "Consider narrowing focus", "Currently tracking 6 applications across 3 countries. May want to drop lower-priority ones after interview results come in to focus energy.", null, daysAgo(2));

  // User stats (level 3, 12-day streak)
  sqlite.prepare(
    "INSERT INTO user_stats (xp, level, current_streak, longest_streak, last_active_date, total_applications_submitted, total_emails_sent) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(1650, 3, 12, 12, daysAgo(0), 2, 4);

  // XP events history
  const insertXp = sqlite.prepare(
    "INSERT INTO xp_events (action_type, xp_awarded, related_entity_type, related_entity_id, created_at) VALUES (?, ?, ?, ?, ?)"
  );
  insertXp.run("application_submitted", 200, "application", 1, daysAgo(20));
  insertXp.run("application_submitted", 200, "application", 5, daysAgo(15));
  insertXp.run("document_completed", 50, "document", 2, daysAgo(25));
  insertXp.run("document_completed", 50, "document", 3, daysAgo(22));
  insertXp.run("document_completed", 50, "document", 4, daysAgo(22));
  insertXp.run("email_sent", 10, "email", 2, daysAgo(18));
  insertXp.run("email_sent", 10, "email", 4, daysAgo(4));
  insertXp.run("email_sent", 10, "email", 8, daysAgo(15));
  insertXp.run("task_completed", 15, null, null, daysAgo(10));
  insertXp.run("task_completed", 15, null, null, daysAgo(8));
  insertXp.run("daily_checkin", 5, null, null, daysAgo(0));
  for (let i = 1; i <= 11; i++) {
    insertXp.run("daily_checkin", 5, null, null, daysAgo(i));
  }
  // remaining XP to reach 1650: 1650 - (400+150+30+30+60+5*12) = 1650-730 = 920
  insertXp.run("email_logged", 20, "email", 1, daysAgo(20));
  insertXp.run("email_logged", 20, "email", 3, daysAgo(5));
  insertXp.run("added_research", 25, "application", 3, daysAgo(30));
  insertXp.run("added_research", 25, "application", 6, daysAgo(14));

  // Programs (30+ across universities)
  const insertProgram = sqlite.prepare(
    `INSERT INTO programs (university_id, name, degree_level, field_of_study, language_of_instruction, description, duration_months, tuition_amount, tuition_currency, tuition_period, application_fee_amount, application_fee_currency, ielts_min, toefl_min, gpa_min, gre_required, scholarship_available, source_url, ranking, required_skills, prerequisites, research_areas)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const programData = [
    // University of Toronto (1)
    [1, "MSc Computer Science", "Masters", "CS", "English", "Research-intensive program covering AI, systems, theory, and HCI.", 24, 58680, "CAD", "per_year", 125, "CAD", 7.0, 100, 3.5, 0, 1, "https://web.cs.toronto.edu", 1, null, null, null],
    [1, "MEng Electrical & Computer Engineering", "Masters", "Engineering", "English", "Professional master's with focus on software and hardware systems.", 16, 58680, "CAD", "per_year", 125, "CAD", 7.0, 100, 3.3, 0, 0, null, 2, null, null, null],
    [1, "MSc Data Science", "Masters", "Data Science", "English", "Interdisciplinary program spanning statistics, CS, and domain expertise.", 20, 58680, "CAD", "per_year", 125, "CAD", 7.0, 100, 3.3, 0, 1, null, 3, null, null, null],
    // McGill (2)
    [2, "MSc Data Science", "Masters", "Data Science", "English", "Cutting-edge program in statistical learning, big data, and AI applications.", 24, 26000, "CAD", "per_year", 120, "CAD", 6.5, 90, 3.3, 0, 1, "https://mcgill.ca/datascience", 5, null, null, null],
    [2, "MSc Computer Science", "Masters", "CS", "English", "Thesis-based program with strong research groups in ML, NLP, and robotics.", 24, 26000, "CAD", "per_year", 120, "CAD", 7.0, 100, 3.5, 0, 1, null, 4, null, null, null],
    [2, "MBA", "Masters", "Business", "English", "Full-time MBA with global perspective and strong alumni network.", 20, 85000, "CAD", "total", 200, "CAD", 7.0, 100, 3.0, 1, 1, null, 8, null, null, null],
    // Waterloo (3)
    [3, "MMath Computer Science", "Masters", "CS", "English", "Research-focused master's with co-op options. Strong in algorithms and systems.", 24, 32000, "CAD", "per_year", 150, "CAD", 7.0, 100, 3.7, 1, 1, "https://cs.uwaterloo.ca", 3, null, null, null],
    [3, "MEng Systems Design", "Masters", "Engineering", "English", "Applied engineering program with industry partnerships.", 16, 32000, "CAD", "per_year", 150, "CAD", 6.5, 90, 3.3, 0, 0, null, 10, null, null, null],
    [3, "MSc Data Science", "Masters", "Data Science", "English", "Joint program between Math and CS faculties.", 24, 32000, "CAD", "per_year", 150, "CAD", 7.0, 100, 3.5, 0, 1, null, 6, null, null, null],
    // UBC (4)
    [4, "MSc Computer Science", "Masters", "CS", "English", "Top-ranked CS program on Canada's west coast. Strong in HCI, ML, and graphics.", 24, 9131, "CAD", "per_year", 168, "CAD", 7.0, 100, 3.3, 0, 1, "https://cs.ubc.ca", 7, null, null, null],
    [4, "MEng Electrical and Computer Engineering", "Masters", "Engineering", "English", "Coursework-based professional program.", 16, 9131, "CAD", "per_year", 168, "CAD", 6.5, 90, 3.0, 0, 0, null, 12, null, null, null],
    // Alberta (5)
    [5, "MSc Computing Science", "Masters", "CS", "English", "Strong AI and ML research groups. Home to reinforcement learning pioneers.", 24, 14000, "CAD", "per_year", 100, "CAD", 6.5, 90, 3.3, 0, 1, "https://cs.ualberta.ca", 9, null, null, null],
    [5, "PhD Computing Science", "PhD", "CS", "English", "Fully funded PhD with world-class AI research.", 48, 14000, "CAD", "per_year", 100, "CAD", 7.0, 100, 3.5, 1, 1, null, 2, null, null, null],
    // McMaster (6)
    [6, "MSc Computer Science", "Masters", "CS", "English", "Research-based program with focus on software engineering and AI.", 24, 22000, "CAD", "per_year", 110, "CAD", 6.5, 92, 3.3, 0, 0, null, 15, null, null, null],
    // Western (7)
    [7, "MSc Computer Science", "Masters", "CS", "English", "Program covering AI, databases, and software engineering.", 24, 20000, "CAD", "per_year", 100, "CAD", 6.0, 86, 3.0, 0, 0, null, 18, null, null, null],
    // Concordia (8)
    [8, "MSc Applied Computer Science", "Masters", "CS", "English", "Applied program with industry connections in Montreal's tech ecosystem.", 24, 22000, "CAD", "per_year", 100, "CAD", 6.5, 90, 3.0, 0, 1, null, 20, null, null, null],
    [8, "MEng Information Systems Security", "Masters", "CS", "English", "Specialized cybersecurity program.", 16, 22000, "CAD", "per_year", 100, "CAD", 6.5, 90, 3.0, 0, 0, null, 25, null, null, null],
    // Carleton (9)
    [9, "MSc Computer Science", "Masters", "CS", "English", "Located in Canada's capital. Good government and industry connections.", 24, 18000, "CAD", "per_year", 100, "CAD", 6.5, 86, 3.0, 0, 1, null, 22, null, null, null],
    // Dalhousie (10)
    [10, "MSc Computer Science", "Masters", "CS", "English", "East coast program with marine and health informatics specializations.", 24, 16000, "CAD", "per_year", 70, "CAD", 6.5, 90, 3.0, 0, 1, null, 28, null, null, null],
    // PSL (11)
    [11, "MSc Artificial Intelligence", "Masters", "CS", "English", "Elite program combining ENS and Dauphine. Strong theory and ML focus.", 24, 4500, "EUR", "per_year", 30, "EUR", 7.0, 95, 3.2, 0, 1, "https://psl.eu", 6, null, null, null],
    [11, "MSc Data Science", "Masters", "Data Science", "English", "Interdisciplinary data science within the PSL consortium.", 24, 4500, "EUR", "per_year", 30, "EUR", 6.5, 90, 3.0, 0, 0, null, 11, null, null, null],
    // Sciences Po (12)
    [12, "Master in Public Policy", "Masters", "Public Policy", "English", "Two-year policy program with global focus and internship component.", 24, 14850, "EUR", "per_year", 0, "EUR", 7.0, 100, 3.0, 0, 1, null, 4, null, null, null],
    [12, "Master in Digital, New Technology and Public Policy", "Masters", "Public Policy", "English", "Tech policy at the intersection of digital innovation and governance.", 24, 14850, "EUR", "per_year", 0, "EUR", 7.0, 100, 3.0, 0, 0, null, 8, null, null, null],
    // Sorbonne (13)
    [13, "MSc Computer Science", "Masters", "CS", "French", "Research-oriented CS program. Strong in theory and systems.", 24, 300, "EUR", "per_year", 0, "EUR", null, null, 3.0, 0, 0, null, 14, null, null, null],
    [13, "MSc Mathematics and Applications", "Masters", "Data Science", "French", "Mathematical foundations for data science and ML.", 24, 300, "EUR", "per_year", 0, "EUR", null, null, 3.3, 0, 0, null, 16, null, null, null],
    // École Polytechnique (14)
    [14, "MSc Artificial Intelligence & Advanced Visual Computing", "Masters", "CS", "English", "Two-year program at France's top engineering school.", 24, 15000, "EUR", "per_year", 50, "EUR", 6.5, 90, 3.3, 0, 1, null, 5, null, null, null],
    // INSA Lyon (15)
    [15, "MSc Computer Science", "Masters", "CS", "English", "Engineering school program with strong industry links in Lyon.", 24, 600, "EUR", "per_year", 0, "EUR", 6.0, 80, 2.8, 0, 1, null, 30, null, null, null],
    // TU Munich (16)
    [16, "MSc Informatics", "Masters", "CS", "English", "Germany's top CS program. No tuition fees. Strong industry connections.", 24, 0, "EUR", "per_year", 0, "EUR", 6.5, 88, 3.0, 0, 1, "https://in.tum.de", 1, null, null, null],
    [16, "MSc Data Engineering and Analytics", "Masters", "Data Science", "English", "Applied data science at TUM's School of Computation.", 24, 0, "EUR", "per_year", 0, "EUR", 6.5, 88, 3.0, 0, 0, null, 7, null, null, null],
    [16, "MSc Robotics, Cognition, Intelligence", "Masters", "Engineering", "English", "Interdisciplinary program combining AI and robotics.", 24, 0, "EUR", "per_year", 0, "EUR", 6.5, 88, 3.3, 0, 1, null, 9, null, null, null],
    // RWTH Aachen (17)
    [17, "MSc Computer Science", "Masters", "CS", "English", "Strong technical program with focus on software engineering and AI.", 24, 0, "EUR", "per_year", 0, "EUR", 6.5, 90, 3.0, 0, 1, null, 10, null, null, null],
    [17, "MSc Data Science", "Masters", "Data Science", "English", "New program combining CS and statistics at RWTH.", 24, 0, "EUR", "per_year", 0, "EUR", 6.5, 90, 3.0, 0, 0, null, 13, null, null, null],
    // Heidelberg (18)
    [18, "MSc Scientific Computing", "Masters", "CS", "English", "Computational science at Germany's oldest university.", 24, 0, "EUR", "per_year", 0, "EUR", 6.5, 90, 3.0, 0, 0, null, 17, null, null, null],
    // TU Delft (19)
    [19, "MSc Computer Science", "Masters", "CS", "English", "Top Dutch CS program with strong software and AI tracks.", 24, 18500, "EUR", "per_year", 100, "EUR", 6.5, 90, 3.0, 0, 1, "https://tudelft.nl/cs", 8, null, null, null],
    [19, "MSc Artificial Intelligence", "Masters", "CS", "English", "AI-focused program at the Netherlands' top technical university.", 24, 18500, "EUR", "per_year", 100, "EUR", 6.5, 90, 3.0, 0, 1, null, 11, null, null, null],
    // Amsterdam (20)
    [20, "MSc Artificial Intelligence", "Masters", "CS", "English", "One of Europe's oldest AI programs. Strong in logic and cognition.", 24, 17900, "EUR", "per_year", 100, "EUR", 7.0, 100, 3.3, 0, 1, "https://uva.nl/ai", 6, null, null, null],
    [20, "MSc Data Science", "Masters", "Data Science", "English", "Joint program between UvA's informatics and statistics groups.", 24, 17900, "EUR", "per_year", 100, "EUR", 6.5, 90, 3.0, 0, 0, null, 12, null, null, null],
  ];

  for (const p of programData) {
    insertProgram.run(...p);
  }

  // Program intakes
  const insertIntake = sqlite.prepare(
    "INSERT INTO program_intakes (program_id, intake_term, intake_year, application_deadline, decision_expected_date, application_open_date) VALUES (?, ?, ?, ?, ?, ?)"
  );
  // Generate intakes for each program
  for (let i = 1; i <= programData.length; i++) {
    // Fall 2026
    insertIntake.run(i, "Fall", 2026, daysFromNow(Math.floor(Math.random() * 120) + 15), daysFromNow(Math.floor(Math.random() * 90) + 120), daysAgo(60));
    // Winter 2027 (for some)
    if (i % 3 === 0) {
      insertIntake.run(i, "Winter", 2027, daysFromNow(Math.floor(Math.random() * 150) + 90), daysFromNow(Math.floor(Math.random() * 90) + 200), daysFromNow(30));
    }
  }

  // Program documents required
  const insertProgramDoc = sqlite.prepare(
    "INSERT INTO program_documents_required (program_id, document_type, notes) VALUES (?, ?, ?)"
  );
  for (let i = 1; i <= programData.length; i++) {
    insertProgramDoc.run(i, "Transcript", "Official transcripts required");
    insertProgramDoc.run(i, "CV", null);
    insertProgramDoc.run(i, "SOP", "Statement of Purpose (2-3 pages)");
    if (i % 2 === 0) {
      insertProgramDoc.run(i, "LOR", "2 letters of recommendation");
    } else {
      insertProgramDoc.run(i, "LOR", "3 letters of recommendation");
    }
  }

  // Link documents to profiles
  const insertProfileDoc = sqlite.prepare(
    "INSERT INTO profile_documents (profile_id, document_id, role) VALUES (?, ?, ?)"
  );
  insertProfileDoc.run(1, 1, "CS Canada");
  insertProfileDoc.run(1, 2, "CS Canada");
  insertProfileDoc.run(1, 3, "Shared");
  insertProfileDoc.run(1, 4, "Shared");
  insertProfileDoc.run(2, 1, "Policy Europe");
  insertProfileDoc.run(2, 2, "Policy Europe");
  insertProfileDoc.run(2, 3, "Shared");
  insertProfileDoc.run(2, 4, "Shared");

  // Pre-compute fit scores for programs against each profile
  const insertFit = sqlite.prepare(
    "INSERT INTO fit_scores (profile_id, program_id, overall_score, degree_score, gpa_score, skill_match_score, budget_score, scholarship_score, breakdown) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
  );

  // Fit scores for all programs against both profiles
  for (let progId = 1; progId <= programData.length; progId++) {
    const program = programData[progId - 1];
    const progField = program[3] as string;
    const progDegree = program[2] as string;
    const progTuition = (program[6] as number) || 0;
    const progCurrency = program[7] as string;
    const progGpa = program[14] as number | null;
    const progScholarship = program[16] as number;

    // Profile 1: MS CS Canada
    {
      const degreeScore = progDegree === "Masters" ? 20 : 0;
      let gpaScore = 100;
      if (progGpa) gpaScore = Math.min(100, Math.round((3.6 / progGpa) * 100));
      const skillMatchScore = ["CS", "Data Science", "Engineering"].includes(progField) ? 75 : 40;
      let budgetScore = 100;
      if (progTuition > 0 && progCurrency === "CAD") budgetScore = Math.min(100, Math.round((40000 / progTuition) * 100));
      else if (progCurrency !== "CAD") budgetScore = 80;
      const scholarshipScore = progScholarship ? 100 : 0;

      const overall = Math.round(degreeScore * 0.2 + (gpaScore / 100) * 25 + (skillMatchScore / 100) * 25 + (budgetScore / 100) * 15 + (scholarshipScore / 100) * 15);
      const breakdown = JSON.stringify({ degree: { score: degreeScore, max: 20 }, gpa: { score: gpaScore, max: 25 }, skill: { score: skillMatchScore, max: 25 }, budget: { score: budgetScore, max: 15 }, scholarship: { score: scholarshipScore, max: 15 } });
      insertFit.run(1, progId, overall, degreeScore, gpaScore, skillMatchScore, budgetScore, scholarshipScore, breakdown);
    }

    // Profile 2: MS Public Policy Europe
    {
      const degreeScore = progDegree === "Masters" ? 20 : 0;
      let gpaScore = 100;
      if (progGpa) gpaScore = Math.min(100, Math.round((3.6 / progGpa) * 100));
      const skillMatchScore = progField === "Public Policy" ? 85 : progField === "Business" || progField === "Data Science" ? 60 : 30;
      let budgetScore = 100;
      if (progTuition > 0 && progCurrency === "EUR") budgetScore = Math.min(100, Math.round((20000 / progTuition) * 100));
      else budgetScore = 60;
      const scholarshipScore = progScholarship ? 80 : 0;

      const overall = Math.round(degreeScore * 0.2 + (gpaScore / 100) * 25 + (skillMatchScore / 100) * 25 + (budgetScore / 100) * 15 + (scholarshipScore / 100) * 15);
      const breakdown = JSON.stringify({ degree: { score: degreeScore, max: 20 }, gpa: { score: gpaScore, max: 25 }, skill: { score: skillMatchScore, max: 25 }, budget: { score: budgetScore, max: 15 }, scholarship: { score: scholarshipScore, max: 15 } });
      insertFit.run(2, progId, overall, degreeScore, gpaScore, skillMatchScore, budgetScore, scholarshipScore, breakdown);
    }
  }

  // Supervisors
  const insertSup = sqlite.prepare(
    `INSERT INTO supervisors (profile_id, university_id, name, email, university, department, title, research_interests, personal_website_url, status, first_contacted_at, last_contacted_at, last_response_at, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  // sup 1 — emailed, positive reply
  insertSup.run(1, 1, "Dr. Rahul Mehta", "r.mehta@cs.utoronto.ca", "University of Toronto", "Department of Computer Science", "Associate Professor", "Reinforcement learning, multi-agent systems, robotics", "https://cs.utoronto.ca/~rmehta", "replied_positive", daysAgo(18), daysAgo(18), daysAgo(10), "Very responsive. Mentioned he is taking 1-2 students for Fall 2026. Read his paper on hierarchical RL — ask about the follow-up work.");
  // sup 2 — emailed, no reply yet, 14 days (needs follow-up)
  insertSup.run(1, 2, "Prof. Ananya Roy", "a.roy@mila.mcgill.ca", "McGill University", "School of Computer Science", "Assistant Professor", "Natural language processing, low-resource languages, multilingual models", "https://ananyaroy.github.io", "emailed", daysAgo(14), daysAgo(14), null, "Sent first email 14 days ago. No reply yet. Mention the EMNLP paper on code-switching.");
  // sup 3 — not contacted
  insertSup.run(1, 3, "Dr. Fatemeh Nouri", "fnouri@uwaterloo.ca", "University of Waterloo", "Cheriton School of CS", "Associate Professor", "Privacy-preserving machine learning, federated learning, differential privacy", null, "not_contacted", null, null, null, "Found via lab website. Two recent NeurIPS papers on federated learning. Will contact after McGill response.");
  // sup 4 — meeting completed
  insertSup.run(1, 1, "Prof. James Liu", "james.liu@utoronto.ca", "University of Toronto", "Department of Computer Science", "Professor", "Computer vision, generative models, medical imaging", "https://jliu.cs.utoronto.ca", "meeting_completed", daysAgo(35), daysAgo(10), daysAgo(10), "Had a 30-min Zoom call. Very friendly. Encouraged me to apply. Said my background in vision is a good fit. Send thank-you + mention the application.");
  // sup 5 — cold (emailed, 2 follow-ups, no response)
  insertSup.run(1, 5, "Dr. Yuki Tanaka", "ytanaka@ualberta.ca", "University of Alberta", "Department of Computing Science", "Associate Professor", "Graph neural networks, molecular property prediction", null, "cold", daysAgo(45), daysAgo(18), null, "Sent initial email and two follow-ups. No response. Likely not taking students or missed emails. Keep for future cycles.");

  const supIds = [1, 2, 3, 4, 5];

  // Link supervisors to applications
  const insertSupApp = sqlite.prepare(
    "INSERT INTO supervisor_applications (supervisor_id, application_id) VALUES (?, ?)"
  );
  insertSupApp.run(1, 1); // Mehta → UofT app
  insertSupApp.run(2, 2); // Roy → McGill app
  insertSupApp.run(4, 1); // Liu → UofT app
  insertSupApp.run(5, 5); // Tanaka → UAlberta (Waterloo app as proxy)

  // Outreach events
  const insertEvent = sqlite.prepare(
    `INSERT INTO outreach_events (supervisor_id, type, subject, body, occurred_at)
     VALUES (?, ?, ?, ?, ?)`
  );

  // Sup 1 (Mehta) — sent email, got positive reply
  insertEvent.run(1, "email_sent", "Research inquiry — MSc CS Fall 2026", "Dear Dr. Mehta,\n\nI am writing to express my interest in joining your research group for the Fall 2026 intake...", daysAgo(18));
  insertEvent.run(1, "email_received", "Re: Research inquiry — MSc CS Fall 2026", "Dear applicant,\n\nThank you for reaching out. Your background looks interesting. I am indeed considering taking 1-2 students...", daysAgo(10));

  // Sup 2 (Roy) — only sent initial email
  insertEvent.run(2, "email_sent", "Research inquiry — NLP / multilingual models", "Dear Prof. Roy,\n\nI came across your recent EMNLP paper on code-switching and was very impressed...", daysAgo(14));

  // Sup 4 (Liu) — sent email, got reply, had meeting, sent thank-you
  insertEvent.run(4, "email_sent", "Research inquiry — Computer Vision", "Dear Prof. Liu,\n\nI am interested in your work on generative models for medical imaging...", daysAgo(35));
  insertEvent.run(4, "email_received", "Re: Research inquiry — Computer Vision", "Hi, thanks for reaching out. Would you be available for a 30 min call next week?", daysAgo(30));
  insertEvent.run(4, "meeting", "Video call with Prof. Liu", "Discussed research directions, my background, and the application process. He encouraged me to apply.", daysAgo(10));

  // Sup 5 (Tanaka) — sent 3 emails, none replied
  insertEvent.run(5, "email_sent", "Research inquiry — Graph Neural Networks", "Dear Dr. Tanaka,\n\nI am very interested in your work on GNNs for molecular property prediction...", daysAgo(45));
  insertEvent.run(5, "email_sent", "Follow-up: Research inquiry", "Dear Dr. Tanaka,\n\nI wanted to follow up on my email from two weeks ago...", daysAgo(30));
  insertEvent.run(5, "email_sent", "Follow-up #2: Research inquiry", "Dear Dr. Tanaka,\n\nI apologise for the repeated emails. I understand you may be very busy...", daysAgo(18));

  console.log("✅ Database seeded successfully!");
  console.log(`   ${unis.length} universities`);
  console.log(`   ${apps.length} applications`);
  console.log(`   ${docs.length} documents`);
  console.log(`   ${programData.length} programs`);
  console.log(`   2 profiles (CS Canada + Policy Europe)`);
  console.log(`   ${programData.length * 2} fit scores computed`);
  console.log(`   5 supervisors, 9 outreach events`);
  console.log(`   5 deadlines, 6 tasks`);
  console.log(`   2 recommenders, 4 LOR requests`);
  console.log(`   User: Level 3, 1650 XP, 12-day streak`);
}

seed();
