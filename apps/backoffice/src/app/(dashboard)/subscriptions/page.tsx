"use client";

import SubscriptionsSection from "@/components/SubscriptionsSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function SubscriptionsPage() {
  const { notify, loadOverview } = useBackOffice();

  return <SubscriptionsSection onNotify={notify} onMutated={loadOverview} />;
}
