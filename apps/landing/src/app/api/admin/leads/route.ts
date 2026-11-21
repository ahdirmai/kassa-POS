import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { createLead, getLeads } from "@/lib/storage";
import type { LeadStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const leads = await getLeads();
  return NextResponse.json({ leads });
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = (await req.json()) as {
      name?: string;
      businessName?: string;
      whatsapp?: string;
      email?: string;
      outletCount?: string;
      planInterest?: string;
      message?: string;
      status?: LeadStatus;
      notes?: string;
      source?: string;
    };

    if (!body.name?.trim() || !body.whatsapp?.trim()) {
      return NextResponse.json(
        { error: "Nama dan nomor WhatsApp wajib diisi." },
        { status: 400 }
      );
    }

    const lead = await createLead({
      name: body.name,
      businessName: body.businessName || "-",
      whatsapp: body.whatsapp,
      email: body.email || "",
      outletCount: body.outletCount || "1 outlet",
      planInterest: body.planInterest || "Pro",
      message: body.message || "",
      status: body.status || "new",
      notes: body.notes || "",
      source: body.source || "manual-admin",
    });

    return NextResponse.json({ ok: true, lead }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal menambahkan lead." },
      { status: 400 }
    );
  }
}
