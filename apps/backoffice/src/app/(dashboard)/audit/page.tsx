"use client";

import AuditLogsSection from "@/components/AuditLogsSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function AuditPage() {
  const { notify } = useBackOffice();

  return <AuditLogsSection onNotify={notify} />;
}
