"use client";

import { useRouter } from "next/navigation";
import OverviewSection from "@/components/OverviewSection";
import { useBackOffice } from "@/components/BackOfficeShell";

export default function OverviewPage() {
  const router = useRouter();
  const { overview } = useBackOffice();

  return (
    <OverviewSection
      data={overview}
      onNavigate={(next) => router.push(`/${next}`)}
    />
  );
}
