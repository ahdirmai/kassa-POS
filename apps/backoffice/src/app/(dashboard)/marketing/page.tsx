"use client";

import MarketingSection from "@/components/MarketingSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function MarketingPage() {
  const { notify } = useBackOffice();

  return <MarketingSection onNotify={notify} />;
}
