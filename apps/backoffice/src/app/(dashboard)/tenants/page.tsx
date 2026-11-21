"use client";

import TenantsSection from "@/components/TenantsSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function TenantsPage() {
  const { notify, loadOverview } = useBackOffice();

  return <TenantsSection onNotify={notify} onMutated={loadOverview} />;
}
