import type { DocumentBrief } from "./document";

export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interview"
  | "technical_interview"
  | "technical_interview_2"
  | "offer"
  | "rejected"
  | "withdrawn";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  technical_interview: "Technical Interview",
  technical_interview_2: "Technical Interview 2",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const ALL_STATUSES: ApplicationStatus[] = [
  "applied",
  "screening",
  "interview",
  "technical_interview",
  "technical_interview_2",
  "offer",
  "rejected",
  "withdrawn",
];

export interface Application {
  id: string;
  user_id: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  date_applied: string | null;
  job_url: string | null;
  company_logo_url: string | null;
  job_description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  nice_to_haves: string | null;
  notes: string | null;
  resume_id: string | null;
  cover_letter_id: string | null;
  resume: DocumentBrief | null;
  cover_letter: DocumentBrief | null;
  created_at: string;
  updated_at: string;
}

export interface ScrapeResult {
  company: string | null;
  title: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  job_description: string | null;
  responsibilities: string | null;
  requirements: string | null;
  nice_to_haves: string | null;
  company_logo_url: string | null;
  job_url: string | null;
}

export interface ApplicationCreate {
  company: string;
  title: string;
  status?: ApplicationStatus;
  location?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  date_applied?: string | null;
  job_url?: string | null;
  company_logo_url?: string | null;
  job_description?: string | null;
  responsibilities?: string | null;
  requirements?: string | null;
  nice_to_haves?: string | null;
  notes?: string | null;
  resume_id?: string | null;
  cover_letter_id?: string | null;
}

export type ApplicationUpdate = Partial<ApplicationCreate>;

export interface ApplicationFilters {
  status?: ApplicationStatus | "";
  sort?: string;
  order?: "asc" | "desc";
}
