import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { deleteLead, updateLead } from "@/lib/storage";
import type { LeadStatus } from "@/lib/types";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  try {
    const body = (await req.json()) as {
      status?: LeadStatus;
      notes?: string;
      name?: string;
      businessName?: string;
      whatsapp?: string;
      email?: string;
      outletCount?: string;
      planInterest?: string;
      message?: string;
    };
    const updated = await updateLead(id, body);
    if (!updated) {
      return NextResponse.json(
        { error: "Lead tidak ditemukan." },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true, lead: updated });
  } catch {
    return NextResponse.json(
      { error: "Gagal memperbarui lead." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const ok = await deleteLead(id);
  if (!ok) {
    return NextResponse.json(
      { error: "Lead tidak ditemukan." },
      { status: 404 }
    );
  }
  return NextResponse.json({ ok: true });
}
