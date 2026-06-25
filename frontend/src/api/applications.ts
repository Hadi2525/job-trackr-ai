import type { Application, ApplicationCreate, ApplicationFilters, ApplicationUpdate, ScrapeResult } from "@/types/application";
import apiFetch from "./client";

export const applicationKeys = {
  all: ["applications"] as const,
  list: (filters: ApplicationFilters) => [...applicationKeys.all, "list", filters] as const,
  detail: (id: string) => [...applicationKeys.all, "detail", id] as const,
};

function buildQuery(filters: ApplicationFilters): string {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.order) params.set("order", filters.order);
  return params.toString();
}

export const fetchApplications = (filters: ApplicationFilters = {}) => {
  const q = buildQuery(filters);
  return apiFetch<Application[]>(`/api/v1/applications${q ? `?${q}` : ""}`);
};

export const fetchApplication = (id: string) =>
  apiFetch<Application>(`/api/v1/applications/${id}`);

export const createApplication = (data: ApplicationCreate) =>
  apiFetch<Application>("/api/v1/applications", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateApplication = (id: string, data: ApplicationUpdate) =>
  apiFetch<Application>(`/api/v1/applications/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const deleteApplication = (id: string) =>
  apiFetch(`/api/v1/applications/${id}`, { method: "DELETE" });

export const scrapeJobPosting = (url: string) =>
  apiFetch<ScrapeResult>("/api/v1/applications/scrape", {
    method: "POST",
    body: JSON.stringify({ url }),
  });
