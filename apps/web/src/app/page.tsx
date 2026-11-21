"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { getDefaultHomePath } from "@/lib/rbac";

export default function HomePage() {
  const router = useRouter();
  const { user, hasPermission } = useAuthStore();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    } else {
      router.replace(getDefaultHomePath(hasPermission, user.plan));
    }
  }, [user, hasPermission, router]);

  return (
    <div className="grid min-h-dvh place-items-center text-sm text-[var(--muted)]">
      Memuat Kassa...
    </div>
  );
}
