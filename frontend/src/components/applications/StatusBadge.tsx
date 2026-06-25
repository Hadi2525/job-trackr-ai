import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus } from "@/types/application";
import { STATUS_LABELS } from "@/types/application";

const STATUS_VARIANTS: Record<ApplicationStatus, "default" | "secondary" | "destructive" | "green" | "yellow" | "orange" | "purple" | "indigo"> = {
  applied: "default",
  screening: "yellow",
  interview: "orange",
  technical_interview: "purple",
  technical_interview_2: "indigo",
  offer: "green",
  rejected: "destructive",
  withdrawn: "secondary",
};

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
