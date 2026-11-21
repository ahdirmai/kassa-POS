"use client";

import LandingSection from "@/components/LandingSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function LandingPage() {
  const { notify, loadOverview } = useBackOffice();

  return <LandingSection onNotify={notify} onTenantCreated={loadOverview} initialSubTab="cms" />;
}
