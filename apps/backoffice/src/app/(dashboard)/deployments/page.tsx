"use client";

import DeploymentsSection from "@/components/DeploymentsSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function DeploymentsPage() {
  const { admin, notify } = useBackOffice();

  if (admin.role !== "SUPERADMIN") {
    return (
      <div className="card p-6 text-xs text-[var(--muted)]">
        Halaman Deployments hanya dapat diakses oleh Superadmin.
      </div>
    );
  }

  return <DeploymentsSection onNotify={notify} />;
}
