import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const universities = sqliteTable("universities", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  website: text("website"),
  logoUrl: text("logo_url"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  emailVerifiedAt: text("email_verified_at"),
  verificationTokenHash: text("verification_token_hash"),
  verificationTokenExpiresAt: text("verification_token_expires_at"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const profiles = sqliteTable("profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  degreeLevel: text("degree_level", { enum: ["Bachelors", "Masters", "PhD"] }).notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  targetCountries: text("target_countries").notNull(),
  ieltsScore: real("ielts_score"),
  toeflScore: integer("toefl_score"),
  gpa: real("gpa"),
  greScore: integer("gre_score"),
  budgetAmount: real("budget_amount"),
  budgetCurrency: text("budget_currency"),
  accentColor: text("accent_color").default("#1A4040"),
  isActive: integer("is_active", { mode: "boolean" }).default(false).notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const applications = sqliteTable("applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  universityId: integer("university_id").references(() => universities.id).notNull(),
  profileId: integer("profile_id").references(() => profiles.id),
  programName: text("program_name").notNull(),
  degreeLevel: text("degree_level", { enum: ["Bachelors", "Masters", "PhD"] }).notNull(),
  intakeTerm: text("intake_term", { enum: ["Winter", "Spring", "Summer", "Fall"] }).notNull(),
  intakeYear: integer("intake_year").notNull(),
  applicationDeadline: text("application_deadline"),
  decisionExpectedDate: text("decision_expected_date"),
  tuitionAmount: real("tuition_amount"),
  tuitionCurrency: text("tuition_currency"),
  tuitionPeriod: text("tuition_period", { enum: ["per_year", "total"] }),
  applicationFeeAmount: real("application_fee_amount"),
  applicationFeeCurrency: text("application_fee_currency"),
  status: text("status", {
    enum: ["researching", "preparing", "submitted", "interview", "admitted", "rejected", "waitlisted", "withdrawn"],
  }).default("researching").notNull(),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium").notNull(),
  minGpa: real("min_gpa"),
  ieltsRequired: real("ielts_required"),
  toeflRequired: integer("toefl_required"),
  greRequired: integer("gre_required", { mode: "boolean" }),
  sourceUrl: text("source_url"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  type: text("type", {
    enum: ["SOP", "CV", "Transcript", "LOR", "IELTS", "TOEFL", "Passport", "FinancialProof", "Other"],
  }).notNull(),
  status: text("status", { enum: ["draft", "final"] }).default("draft").notNull(),
  fileUrl: text("file_url"),
  version: integer("version").default(1).notNull(),
  content: text("content"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const applicationDocuments = sqliteTable("application_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
});

export const recommenders = sqliteTable("recommenders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  designation: text("designation"),
  institution: text("institution"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const lorRequests = sqliteTable("lor_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
  recommenderId: integer("recommender_id").references(() => recommenders.id).notNull(),
  status: text("status", {
    enum: ["not_requested", "requested", "submitted", "declined"],
  }).default("not_requested").notNull(),
  requestedDate: text("requested_date"),
  submittedDate: text("submitted_date"),
  notes: text("notes"),
});

export const emails = sqliteTable("emails", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id").references(() => applications.id),
  subject: text("subject").notNull(),
  sender: text("sender").notNull(),
  recipient: text("recipient").notNull(),
  body: text("body").notNull(),
  direction: text("direction", { enum: ["inbound", "outbound"] }).notNull(),
  threadId: text("thread_id"),
  sentAt: text("sent_at").notNull(),
  extractedMetadata: text("extracted_metadata"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const deadlines = sqliteTable("deadlines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id").references(() => applications.id),
  title: text("title").notNull(),
  type: text("type", {
    enum: ["application", "document", "fee", "visa", "scholarship", "interview", "other"],
  }).notNull(),
  dueDate: text("due_date").notNull(),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id").references(() => applications.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: text("due_date"),
  completed: integer("completed", { mode: "boolean" }).default(false).notNull(),
  priority: text("priority", { enum: ["high", "medium", "low"] }).default("medium").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  completedAt: text("completed_at"),
});

export const decisionLog = sqliteTable("decision_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryType: text("entry_type", {
    enum: ["priority_change", "dropped_application", "added_application", "strategy_note"],
  }).notNull(),
  title: text("title").notNull(),
  reasoning: text("reasoning"),
  relatedApplicationId: integer("related_application_id").references(() => applications.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const userStats = sqliteTable("user_stats", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  xp: integer("xp").default(0).notNull(),
  level: integer("level").default(1).notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastActiveDate: text("last_active_date"),
  totalApplicationsSubmitted: integer("total_applications_submitted").default(0).notNull(),
  totalEmailsSent: integer("total_emails_sent").default(0).notNull(),
});

export const xpEvents = sqliteTable("xp_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  actionType: text("action_type").notNull(),
  xpAwarded: integer("xp_awarded").notNull(),
  relatedEntityType: text("related_entity_type"),
  relatedEntityId: integer("related_entity_id"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  universityId: integer("university_id").references(() => universities.id).notNull(),
  name: text("name").notNull(),
  degreeLevel: text("degree_level", { enum: ["Bachelors", "Masters", "PhD"] }).notNull(),
  fieldOfStudy: text("field_of_study").notNull(),
  languageOfInstruction: text("language_of_instruction").default("English").notNull(),
  description: text("description"),
  durationMonths: integer("duration_months"),
  tuitionAmount: real("tuition_amount"),
  tuitionCurrency: text("tuition_currency"),
  tuitionPeriod: text("tuition_period", { enum: ["per_year", "total"] }),
  applicationFeeAmount: real("application_fee_amount"),
  applicationFeeCurrency: text("application_fee_currency"),
  ieltsMin: real("ielts_min"),
  toeflMin: integer("toefl_min"),
  gpaMin: real("gpa_min"),
  greRequired: integer("gre_required", { mode: "boolean" }).default(false),
  scholarshipAvailable: integer("scholarship_available", { mode: "boolean" }).default(false),
  sourceUrl: text("source_url"),
  ranking: integer("ranking"),
  requiredSkills: text("required_skills"),
  prerequisites: text("prerequisites"),
  researchAreas: text("research_areas"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});

export const programIntakes = sqliteTable("program_intakes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id").references(() => programs.id).notNull(),
  intakeTerm: text("intake_term", { enum: ["Winter", "Spring", "Summer", "Fall"] }).notNull(),
  intakeYear: integer("intake_year").notNull(),
  applicationDeadline: text("application_deadline"),
  decisionExpectedDate: text("decision_expected_date"),
  applicationOpenDate: text("application_open_date"),
});

export const programDocumentsRequired = sqliteTable("program_documents_required", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id").references(() => programs.id).notNull(),
  documentType: text("document_type").notNull(),
  notes: text("notes"),
});

export const savedPrograms = sqliteTable("saved_programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("program_id").references(() => programs.id).notNull(),
  notes: text("notes"),
  savedAt: text("saved_at").default(sql`(datetime('now'))`).notNull(),
});

export const savedSearches = sqliteTable("saved_searches", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  filterCriteria: text("filter_criteria").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  lastRunAt: text("last_run_at"),
});

export const profileDocuments = sqliteTable("profile_documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  documentId: integer("document_id").references(() => documents.id).notNull(),
  role: text("role"),
  notes: text("notes"),
});

export const fitScores = sqliteTable("fit_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").references(() => profiles.id).notNull(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  overallScore: real("overall_score").notNull(),
  degreeScore: real("degree_score"),
  gpaScore: real("gpa_score"),
  skillMatchScore: real("skill_match_score"),
  budgetScore: real("budget_score"),
  scholarshipScore: real("scholarship_score"),
  breakdown: text("breakdown"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const skillMatchCache = sqliteTable("skill_match_cache", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  applicantId: integer("applicant_id").notNull(),
  programId: integer("program_id").references(() => programs.id).notNull(),
  score: real("score").notNull(),
  matched: text("matched"),
  missing: text("missing"),
  tip: text("tip"),
  computedAt: text("computed_at").default(sql`(datetime('now'))`).notNull(),
});

// ─── Supervisors ──────────────────────────────────────────────────────────────

export const supervisors = sqliteTable("supervisors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  profileId: integer("profile_id").references(() => profiles.id),
  universityId: integer("university_id").references(() => universities.id),
  name: text("name").notNull(),
  email: text("email").notNull(),
  university: text("university").notNull(), // denormalized for convenience
  department: text("department"),
  program: text("program"),
  title: text("title"),
  researchInterests: text("research_interests"),
  personalWebsiteUrl: text("personal_website_url"),
  status: text("status", {
    enum: [
      "not_contacted",
      "emailed",
      "replied_positive",
      "replied_neutral",
      "replied_declined",
      "meeting_scheduled",
      "meeting_completed",
      "cold",
    ],
  }).default("not_contacted").notNull(),
  firstContactedAt: text("first_contacted_at"),
  lastContactedAt: text("last_contacted_at"),
  lastResponseAt: text("last_response_at"),
  notes: text("notes"),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
  updatedAt: text("updated_at").default(sql`(datetime('now'))`).notNull(),
});

export const supervisorApplications = sqliteTable("supervisor_applications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supervisorId: integer("supervisor_id").references(() => supervisors.id).notNull(),
  applicationId: integer("application_id").references(() => applications.id).notNull(),
});

export const outreachEvents = sqliteTable("outreach_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  supervisorId: integer("supervisor_id").references(() => supervisors.id).notNull(),
  type: text("type", {
    enum: ["email_sent", "email_received", "meeting", "note"],
  }).notNull(),
  subject: text("subject"),
  body: text("body"),
  occurredAt: text("occurred_at").notNull(),
  createdAt: text("created_at").default(sql`(datetime('now'))`).notNull(),
});
