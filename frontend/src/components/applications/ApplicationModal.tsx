import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { ExternalLinkIcon, SaveIcon, WandSparklesIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { StatusBadge } from "./StatusBadge";
import type { Application, ApplicationCreate, ApplicationStatus } from "@/types/application";
import { ALL_STATUSES, STATUS_LABELS } from "@/types/application";
import { applicationKeys, createApplication, updateApplication, scrapeJobPosting } from "@/api/applications";
import { documentKeys, fetchDocuments } from "@/api/documents";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface FormData {
  company: string;
  title: string;
  status: ApplicationStatus;
  location: string;
  salary_min: string;
  salary_max: string;
  date_applied: string;
  job_url: string;
  company_logo_url: string;
  job_description: string;
  responsibilities: string;
  requirements: string;
  nice_to_haves: string;
  notes: string;
  resume_id: string;
  cover_letter_id: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  application?: Application | null;
}

export function ApplicationModal({ open, onClose, application }: Props) {
  const isEditing = !!application;
  const qc = useQueryClient();
  const [scrapeInput, setScrapeInput] = useState("");
  const [isScraping, setIsScraping] = useState(false);

  const { data: documents = [] } = useQuery({
    queryKey: documentKeys.list(),
    queryFn: () => fetchDocuments(),
    enabled: open,
  });

  const resumes = documents.filter((d) => d.type === "resume");
  const coverLetters = documents.filter((d) => d.type === "cover_letter");

  const { register, handleSubmit, watch, setValue, reset } = useForm<FormData>({
    defaultValues: {
      company: application?.company ?? "",
      title: application?.title ?? "",
      status: application?.status ?? "applied",
      location: application?.location ?? "",
      salary_min: application?.salary_min?.toString() ?? "",
      salary_max: application?.salary_max?.toString() ?? "",
      date_applied: application?.date_applied ?? "",
      job_url: application?.job_url ?? "",
      company_logo_url: application?.company_logo_url ?? "",
      job_description: application?.job_description ?? "",
      responsibilities: application?.responsibilities ?? "",
      requirements: application?.requirements ?? "",
      nice_to_haves: application?.nice_to_haves ?? "",
      notes: application?.notes ?? "",
      resume_id: application?.resume_id ?? "",
      cover_letter_id: application?.cover_letter_id ?? "",
    },
  });

  const createMut = useMutation({
    mutationFn: (data: ApplicationCreate) => createApplication(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success("Application created");
      onClose();
      reset();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<ApplicationCreate>) => updateApplication(application!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (data: FormData) => {
    const payload: ApplicationCreate = {
      company: data.company,
      title: data.title,
      status: data.status,
      location: data.location || null,
      salary_min: data.salary_min ? parseInt(data.salary_min, 10) : null,
      salary_max: data.salary_max ? parseInt(data.salary_max, 10) : null,
      date_applied: data.date_applied || null,
      job_url: data.job_url || null,
      company_logo_url: data.company_logo_url || null,
      job_description: data.job_description || null,
      responsibilities: data.responsibilities || null,
      requirements: data.requirements || null,
      nice_to_haves: data.nice_to_haves || null,
      notes: data.notes || null,
      resume_id: data.resume_id || null,
      cover_letter_id: data.cover_letter_id || null,
    };
    if (isEditing) updateMut.mutate(payload);
    else createMut.mutate(payload);
  };

  const handleAutofill = async () => {
    if (!scrapeInput.trim()) return;
    setIsScraping(true);
    try {
      const result = await scrapeJobPosting(scrapeInput.trim());
      if (result.company) setValue("company", result.company);
      if (result.title) setValue("title", result.title);
      if (result.location) setValue("location", result.location);
      if (result.salary_min) setValue("salary_min", result.salary_min.toString());
      if (result.salary_max) setValue("salary_max", result.salary_max.toString());
      if (result.job_url) setValue("job_url", result.job_url);
      if (result.company_logo_url) setValue("company_logo_url", result.company_logo_url);
      if (result.job_description) setValue("job_description", result.job_description);
      if (result.responsibilities) setValue("responsibilities", result.responsibilities);
      if (result.requirements) setValue("requirements", result.requirements);
      if (result.nice_to_haves) setValue("nice_to_haves", result.nice_to_haves);
      toast.success("Fields autofilled from job posting");
    } catch {
      toast.error("Failed to scrape job posting");
    } finally {
      setIsScraping(false);
    }
  };

  const selectedResumeId = watch("resume_id");
  const selectedCLId = watch("cover_letter_id");
  const selectedResume = documents.find((d) => d.id === selectedResumeId);
  const selectedCL = documents.find((d) => d.id === selectedCLId);
  const jobUrl = watch("job_url");

  const handleClose = () => {
    onClose();
    reset();
    setScrapeInput("");
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-8">
            <div className="flex items-center gap-3 min-w-0">
              {isEditing && (
                application.company_logo_url ? (
                  <img
                    src={application.company_logo_url}
                    alt=""
                    className="h-9 w-9 rounded-lg object-contain bg-gray-50 border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="h-9 w-9 rounded-lg bg-gray-100 flex items-center justify-center text-base font-semibold text-gray-400 shrink-0">
                    {application.company.charAt(0).toUpperCase()}
                  </div>
                )
              )}
              <DialogTitle className="text-xl truncate">
                {isEditing ? `${application.company} — ${application.title}` : "New Application"}
              </DialogTitle>
            </div>
            {isEditing && <StatusBadge status={application.status} />}
          </div>
        </DialogHeader>

        {/* URL Autofill Banner — create mode only */}
        {!isEditing && (
          <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <WandSparklesIcon className="h-4 w-4 text-blue-500 shrink-0" />
            <Input
              value={scrapeInput}
              onChange={(e) => setScrapeInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAutofill()}
              placeholder="Paste a job posting URL to autofill…"
              className="flex-1 h-8 text-sm bg-white border-blue-200"
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100 gap-1.5 whitespace-nowrap"
              onClick={handleAutofill}
              disabled={isScraping || !scrapeInput.trim()}
            >
              {isScraping ? (
                <LoaderIcon className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <WandSparklesIcon className="h-3.5 w-3.5" />
              )}
              {isScraping ? "Scraping…" : "Autofill"}
            </Button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="overview">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="jd">Job Description</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Company *</label>
                  <Input {...register("company")} placeholder="Acme Corp" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Job Title *</label>
                  <Input {...register("title")} placeholder="Senior Software Engineer" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <Select value={watch("status")} onValueChange={(v) => setValue("status", v as ApplicationStatus)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Location</label>
                  <Input {...register("location")} placeholder="Remote / Edmonton, AB" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Salary Min (CAD)</label>
                  <Input type="number" {...register("salary_min")} placeholder="80000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Salary Max (CAD)</label>
                  <Input type="number" {...register("salary_max")} placeholder="120000" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date Applied</label>
                  <Input type="date" {...register("date_applied")} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Job URL</label>
                  <div className="flex gap-2">
                    <Input {...register("job_url")} placeholder="https://…" className="flex-1" />
                    {jobUrl && (
                      <a href={jobUrl} target="_blank" rel="noopener noreferrer">
                        <Button type="button" variant="outline" size="icon">
                          <ExternalLinkIcon className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Job Description Tab */}
            <TabsContent value="jd">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Job Description</label>
                  <Textarea {...register("job_description")} rows={8} placeholder="Paste the full job description here…" />
                </div>
                <Accordion type="multiple" className="w-full">
                  <AccordionItem value="responsibilities">
                    <AccordionTrigger className="text-sm font-medium">Responsibilities</AccordionTrigger>
                    <AccordionContent>
                      <Textarea {...register("responsibilities")} rows={5} placeholder="Key responsibilities…" />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="requirements">
                    <AccordionTrigger className="text-sm font-medium">Requirements</AccordionTrigger>
                    <AccordionContent>
                      <Textarea {...register("requirements")} rows={5} placeholder="Required qualifications…" />
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="nice_to_haves">
                    <AccordionTrigger className="text-sm font-medium">Nice to Haves</AccordionTrigger>
                    <AccordionContent>
                      <Textarea {...register("nice_to_haves")} rows={4} placeholder="Preferred qualifications…" />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Resume Used</label>
                  <Select
                    value={selectedResumeId || "none"}
                    onValueChange={(v) => setValue("resume_id", v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a resume…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {resumes.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedResume && (
                    <div className="mt-3 border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 mb-2">{selectedResume.name}</p>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedResume.content_md}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter Used</label>
                  <Select
                    value={selectedCLId || "none"}
                    onValueChange={(v) => setValue("cover_letter_id", v === "none" ? "" : v)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select a cover letter…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {coverLetters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCL && (
                    <div className="mt-3 border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto bg-gray-50">
                      <p className="text-xs font-medium text-gray-500 mb-2">{selectedCL.name}</p>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedCL.content_md}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
                <Textarea
                  {...register("notes")}
                  rows={12}
                  placeholder="Recruiter name, interview prep notes, follow-up tasks…"
                  className="resize-none"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
            <Button
              type="submit"
              disabled={createMut.isPending || updateMut.isPending}
              className="gap-2"
            >
              <SaveIcon className="h-4 w-4" />
              {isEditing ? "Save changes" : "Create application"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
