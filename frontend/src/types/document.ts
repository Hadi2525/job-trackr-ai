export type DocumentType = "resume" | "cover_letter";

export interface Document {
  id: string;
  user_id: string;
  name: string;
  type: DocumentType;
  content_md: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentBrief {
  id: string;
  name: string;
  type: DocumentType;
}
