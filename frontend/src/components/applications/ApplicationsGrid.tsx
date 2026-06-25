import { useState } from "react";
import { format } from "date-fns";
import { Trash2Icon } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { StatusBadge } from "./StatusBadge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Application } from "@/types/application";
import { applicationKeys, deleteApplication } from "@/api/applications";

interface Props {
  applications: Application[];
  onSelect: (app: Application) => void;
}

function CompanyLogo({ url, name }: { url: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) {
    return (
      <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-400 shrink-0">
        {name.charAt(0).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={url}
      alt=""
      className="h-8 w-8 rounded-lg object-contain bg-white shrink-0"
      onError={() => setFailed(true)}
    />
  );
}

function SalaryCell({ min, max }: { min: number | null; max: number | null }) {
  if (!min && !max) return <span className="text-gray-300">—</span>;
  const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`;
  if (min && max) return <span>{fmt(min)}–{fmt(max)}</span>;
  return <span>{fmt((min || max)!)}</span>;
}

export function ApplicationsGrid({ applications, onSelect }: Props) {
  const qc = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null);

  const deleteMut = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      toast.success("Application removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (applications.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-medium mb-1">No applications yet</p>
        <p className="text-sm">Click "Add Application" to get started.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 w-12"></th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Company</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Date Applied</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Location</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Salary</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500 max-w-48">Notes</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {applications.map((app) => (
              <tr
                key={app.id}
                className="hover:bg-blue-50/40 cursor-pointer transition-colors"
                onClick={() => onSelect(app)}
              >
                <td className="px-3 py-3">
                  <CompanyLogo url={app.company_logo_url} name={app.company} />
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900">{app.company}</td>
                <td className="px-4 py-3 text-gray-700">{app.title}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {app.date_applied ? format(new Date(app.date_applied), "MMM d, yyyy") : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {app.location ?? <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  <SalaryCell min={app.salary_min} max={app.salary_max} />
                </td>
                <td className="px-4 py-3 text-gray-400 max-w-48">
                  <p className="truncate">{app.notes ?? "—"}</p>
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-300 hover:text-red-500"
                    onClick={() => setPendingDelete(app)}
                  >
                    <Trash2Icon className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Delete application?"
        description={
          pendingDelete
            ? `This will permanently remove your application to ${pendingDelete.company} — ${pendingDelete.title}. This cannot be undone.`
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
    </>
  );
}
