import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, FileTextIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Navbar } from "@/components/layout/Navbar";
import { DocumentEditor } from "@/components/documents/DocumentEditor";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Document, DocumentType } from "@/types/document";
import { documentKeys, fetchDocuments, createDocument, deleteDocument } from "@/api/documents";

function EmptyEditor() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
      <FileTextIcon className="h-12 w-12 mb-3 opacity-30" />
      <p className="text-sm font-medium">Select a document to edit</p>
      <p className="text-xs mt-1">or create a new resume or cover letter</p>
    </div>
  );
}

export default function Documents() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Document | null>(null);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: documentKeys.list(),
    queryFn: () => fetchDocuments(),
  });

  const createMut = useMutation({
    mutationFn: (type: DocumentType) =>
      createDocument({
        name: type === "resume" ? "My Resume" : "My Cover Letter",
        type,
        content_md: type === "resume"
          ? "# Your Name\n\nyour.email@example.com · linkedin.com/in/you\n\n## Experience\n\n### Job Title — Company\n*Month Year – Present*\n\n- Achievement one\n- Achievement two\n\n## Education\n\n### Degree — University\n*Year*\n\n## Skills\n\nPython · TypeScript · React · FastAPI\n"
          : "Dear Hiring Manager,\n\nI am writing to express my interest in the [Job Title] role at [Company].\n\n[Opening paragraph — why you are excited about this company.]\n\n[Middle paragraph — your key relevant experience and achievements.]\n\n[Closing paragraph — call to action.]\n\nSincerely,\nYour Name\n",
      }),
    onSuccess: (doc) => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      setSelectedId(doc.id);
      toast.success("Document created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteDocument,
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      if (selectedId === id) setSelectedId(null);
      toast.success("Document deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resumes = documents.filter((d) => d.type === "resume");
  const coverLetters = documents.filter((d) => d.type === "cover_letter");
  const selectedDoc = documents.find((d) => d.id === selectedId) ?? null;

  function DocItem({ doc }: { doc: Document }) {
    return (
      <button
        key={doc.id}
        onClick={() => setSelectedId(doc.id)}
        className={`w-full text-left flex items-center justify-between group px-3 py-2 rounded-md text-sm transition-colors ${
          selectedId === doc.id
            ? "bg-blue-50 text-blue-700 font-medium"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <span className="truncate">{doc.name}</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPendingDelete(doc);
          }}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition"
        >
          <Trash2Icon className="h-3.5 w-3.5" />
        </button>
      </button>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 min-h-0 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Resumes</h3>
              <button
                onClick={() => createMut.mutate("resume")}
                className="text-blue-600 hover:text-blue-700"
                title="New resume"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {isLoading ? (
              <div className="space-y-1">
                {[1,2].map((n) => (
                  <div key={n} className="h-8 bg-gray-200 animate-pulse rounded-md" />
                ))}
              </div>
            ) : resumes.length === 0 ? (
              <p className="text-xs text-gray-400 px-3">No resumes yet</p>
            ) : (
              <div className="space-y-0.5">
                {resumes.map((doc) => <DocItem key={doc.id} doc={doc} />)}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Cover Letters</h3>
              <button
                onClick={() => createMut.mutate("cover_letter")}
                className="text-blue-600 hover:text-blue-700"
                title="New cover letter"
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
            {isLoading ? (
              <div className="space-y-1">
                {[1].map((n) => (
                  <div key={n} className="h-8 bg-gray-200 animate-pulse rounded-md" />
                ))}
              </div>
            ) : coverLetters.length === 0 ? (
              <p className="text-xs text-gray-400 px-3">No cover letters yet</p>
            ) : (
              <div className="space-y-0.5">
                {coverLetters.map((doc) => <DocItem key={doc.id} doc={doc} />)}
              </div>
            )}
          </div>
        </aside>

        {/* Editor area */}
        <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden flex flex-col" style={{ minHeight: "calc(100vh - 140px)" }}>
          {selectedDoc ? <DocumentEditor document={selectedDoc} /> : <EmptyEditor />}
        </div>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete document?"
        description={
          pendingDelete
            ? `"${pendingDelete.name}" will be permanently deleted. This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (pendingDelete) deleteMut.mutate(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
