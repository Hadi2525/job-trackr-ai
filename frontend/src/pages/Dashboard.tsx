import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { FilterBar } from "@/components/applications/FilterBar";
import { ApplicationsGrid } from "@/components/applications/ApplicationsGrid";
import { ApplicationModal } from "@/components/applications/ApplicationModal";
import { Button } from "@/components/ui/button";
import type { Application, ApplicationFilters } from "@/types/application";
import { applicationKeys, fetchApplications } from "@/api/applications";

export default function Dashboard() {
  const [filters, setFilters] = useState<ApplicationFilters>({
    sort: "created_at",
    order: "desc",
  });
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () => fetchApplications(filters),
  });

  const openCreate = () => { setSelectedApp(null); setIsCreating(true); setModalOpen(true); };
  const openEdit = (app: Application) => { setSelectedApp(app); setIsCreating(false); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setSelectedApp(null); };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
            <p className="text-sm text-gray-500 mt-0.5">Your job search at a glance</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            Add Application
          </Button>
        </div>

        <div className="space-y-4">
          <FilterBar filters={filters} onChange={setFilters} total={applications.length} />

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ApplicationsGrid applications={applications} onSelect={openEdit} />
          )}
        </div>
      </main>

      <ApplicationModal
        open={modalOpen}
        onClose={closeModal}
        application={isCreating ? null : selectedApp}
      />
    </div>
  );
}
