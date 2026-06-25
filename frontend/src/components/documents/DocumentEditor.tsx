import { useState, useRef, useCallback, Suspense, lazy } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { DownloadIcon, SaveIcon, SparklesIcon, XIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownPreview } from "./MarkdownPreview";
import type { Document } from "@/types/document";
import { documentKeys, updateDocument, exportDocumentPdf, reviewCoverLetter } from "@/api/documents";

const MonacoEditor = lazy(() => import("@monaco-editor/react"));

interface Props {
  document: Document;
}

function EditorSkeleton() {
  return <div className="flex-1 bg-gray-900 animate-pulse" />;
}

export function DocumentEditor({ document }: Props) {
  const qc = useQueryClient();
  const [name, setName] = useState(document.name);
  const [content, setContent] = useState(document.content_md);
  const [aiOpen, setAiOpen] = useState(false);
  const [jobDesc, setJobDesc] = useState("");
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const saveMut = useMutation({
    mutationFn: () => updateDocument(document.id, { name, content_md: content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: documentKeys.all });
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleContentChange = useCallback((value: string | undefined) => {
    setContent(value ?? "");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateDocument(document.id, { content_md: value ?? "" })
        .then(() => qc.invalidateQueries({ queryKey: documentKeys.all }))
        .catch(() => {});
    }, 1500);
  }, [document.id, qc]);

  const handleExportPdf = async () => {
    try {
      await exportDocumentPdf(document.id, name);
    } catch (e) {
      toast.error("PDF export failed");
    }
  };

  const handleAiReview = async () => {
    setAiText("");
    setAiLoading(true);
    try {
      await reviewCoverLetter(
        document.id,
        jobDesc,
        (chunk) => setAiText((t) => t + chunk),
        () => setAiLoading(false)
      );
    } catch (e) {
      toast.error("AI review failed");
      setAiLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="max-w-56 h-8 text-sm font-medium"
          onBlur={() => saveMut.mutate()}
        />
        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
          {document.type === "resume" ? "Resume" : "Cover Letter"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {document.type === "cover_letter" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 text-purple-600 border-purple-200 hover:bg-purple-50"
              onClick={() => setAiOpen((o) => !o)}
            >
              <SparklesIcon className="h-3.5 w-3.5" />
              AI Review
            </Button>
          )}
          <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleExportPdf}>
            <DownloadIcon className="h-3.5 w-3.5" />
            Export PDF
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-1.5"
            onClick={() => saveMut.mutate()}
            disabled={saveMut.isPending}
          >
            <SaveIcon className="h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Editor + Preview pane */}
      <div className="flex flex-1 min-h-0">
        {/* Monaco */}
        <div className="flex-1 min-w-0 border-r border-gray-200">
          <Suspense fallback={<EditorSkeleton />}>
            <MonacoEditor
              height="100%"
              language="markdown"
              theme="vs-dark"
              value={content}
              onChange={handleContentChange}
              options={{
                wordWrap: "on",
                minimap: { enabled: false },
                lineNumbers: "off",
                folding: false,
                renderLineHighlight: "none",
                fontSize: 14,
                fontFamily: '"Fira Code", "Cascadia Code", Menlo, monospace',
                scrollBeyondLastLine: false,
                padding: { top: 16, bottom: 16 },
              }}
            />
          </Suspense>
        </div>

        {/* Preview */}
        <div className="flex-1 min-w-0 bg-white overflow-y-auto">
          <MarkdownPreview content={content} />
        </div>
      </div>

      {/* AI Review Panel */}
      {aiOpen && document.type === "cover_letter" && (
        <div className="border-t border-gray-200 bg-gray-50 p-4 max-h-[40vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-1.5">
              <SparklesIcon className="h-4 w-4" />
              AI Cover Letter Review
            </h3>
            <button onClick={() => setAiOpen(false)} className="text-gray-400 hover:text-gray-600">
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Job Description (optional — paste for tailored feedback)
            </label>
            <Textarea
              value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              rows={4}
              placeholder="Paste the job description here…"
              className="text-xs"
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white mb-4"
            onClick={handleAiReview}
            disabled={aiLoading}
          >
            <SparklesIcon className="h-3.5 w-3.5" />
            {aiLoading ? "Analyzing…" : "Analyze"}
          </Button>
          {aiText && (
            <div className="prose prose-sm max-w-none bg-white rounded-md border border-purple-100 p-4">
              <MarkdownPreview content={aiText} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
