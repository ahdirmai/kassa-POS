import { NextResponse } from "next/server";
import { createLead } from "@/lib/storage";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      name?: string;
      businessName?: string;
      whatsapp?: string;
      email?: string;
      outletCount?: string;
      planInterest?: string;
      message?: string;
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
      source: body.source || "landing-modal",
    });

    return NextResponse.json({ ok: true, lead }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyimpan data. Silakan coba lagi." },
      { status: 400 }
    );
  }
}
