import type { Document, DocumentType } from "@/types/document";
import apiFetch from "./client";

export const documentKeys = {
  all: ["documents"] as const,
  list: (type?: DocumentType) => [...documentKeys.all, "list", type ?? "all"] as const,
  detail: (id: string) => [...documentKeys.all, "detail", id] as const,
};

export const fetchDocuments = (type?: DocumentType) => {
  const q = type ? `?type=${type}` : "";
  return apiFetch<Document[]>(`/api/v1/documents${q}`);
};

export const fetchDocument = (id: string) =>
  apiFetch<Document>(`/api/v1/documents/${id}`);

export const createDocument = (data: { name: string; type: DocumentType; content_md?: string }) =>
  apiFetch<Document>("/api/v1/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateDocument = (id: string, data: { name?: string; content_md?: string }) =>
  apiFetch<Document>(`/api/v1/documents/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteDocument = (id: string) =>
  apiFetch(`/api/v1/documents/${id}`, { method: "DELETE" });

export const exportDocumentPdf = async (id: string, filename: string) => {
  const res = await fetch(`/api/v1/documents/${id}/export-pdf`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("PDF export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename.replace(/\s+/g, "_")}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

export const reviewCoverLetter = async (
  id: string,
  jobDescription: string,
  onChunk: (text: string) => void,
  onDone: () => void
) => {
  const res = await fetch(`/api/v1/documents/${id}/review`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_description: jobDescription }),
  });
  if (!res.ok) throw new Error("AI review failed");
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const text = line.slice(6);
        if (text === "[DONE]") { onDone(); return; }
        onChunk(text);
      }
    }
  }
  onDone();
};
