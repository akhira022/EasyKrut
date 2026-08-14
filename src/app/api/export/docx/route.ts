import { NextRequest, NextResponse } from "next/server";
import { buildExternalDocx } from "@/lib/documents/external/docx";
import { buildInternalDocx } from "@/lib/documents/internal/docx";
import { buildStampDocx } from "@/lib/documents/stamp/docx";
import { buildOrderDocx } from "@/lib/documents/order/docx";
import { buildAnnounceDocx } from "@/lib/documents/announce/docx";
import { buildCertDocx } from "@/lib/documents/cert/docx";
import { buildMeetingDocx } from "@/lib/documents/meeting/docx";
import { DocumentType } from "@/lib/constants";
import {
  parseAnnouncePayload,
  parseCertPayload,
  parseExternalPayload,
  parseInternalPayload,
  parseMeetingPayload,
  parseOrderPayload,
  parseStampPayload,
} from "@/lib/documents/payload";
import { canExportWord } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { currentYearMonth } from "@/lib/thai";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

    const ctx = await requireOrgContext();
    const gate = canExportWord({ planKey: ctx.organization.planKey });
    if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 403 });

    const doc = await prisma.document.findFirst({
      where: { id, organizationId: ctx.organization.id },
    });
    if (!doc) return NextResponse.json({ error: "not found" }, { status: 404 });

    let buffer: Buffer;
    switch (doc.type) {
      case DocumentType.INTERNAL:
        buffer = await buildInternalDocx(parseInternalPayload(doc.payload));
        break;
      case DocumentType.STAMP:
        buffer = await buildStampDocx(parseStampPayload(doc.payload));
        break;
      case DocumentType.ORDER:
        buffer = await buildOrderDocx(parseOrderPayload(doc.payload));
        break;
      case DocumentType.ANNOUNCE:
        buffer = await buildAnnounceDocx(parseAnnouncePayload(doc.payload));
        break;
      case DocumentType.CERT:
        buffer = await buildCertDocx(parseCertPayload(doc.payload));
        break;
      case DocumentType.MEETING:
        buffer = await buildMeetingDocx(parseMeetingPayload(doc.payload));
        break;
      default:
        buffer = await buildExternalDocx(parseExternalPayload(doc.payload));
    }

    const yearMonth = currentYearMonth();
    await prisma.usageMeter.upsert({
      where: { organizationId_yearMonth: { organizationId: ctx.organization.id, yearMonth } },
      create: { organizationId: ctx.organization.id, yearMonth, exportsCount: 1 },
      update: { exportsCount: { increment: 1 } },
    });

    const filename = encodeURIComponent(`${doc.title || "document"}.docx`);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "export failed" }, { status: 500 });
  }
}
