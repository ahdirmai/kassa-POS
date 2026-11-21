"use client";

import LandingSection from "@/components/LandingSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function LeadsPage() {
  const { notify, loadOverview } = useBackOffice();

  return <LandingSection onNotify={notify} onTenantCreated={loadOverview} initialSubTab="leads" />;
}
