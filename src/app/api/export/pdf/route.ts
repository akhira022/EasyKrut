import { NextRequest, NextResponse } from "next/server";
import { buildExternalPdf, buildInternalPdf, buildStampPdf } from "@/lib/documents/build-pdf";
import { DocumentType } from "@/lib/constants";
import {
  parseExternalPayload,
  parseInternalPayload,
  parseStampPayload,
} from "@/lib/documents/payload";
import { canExportPdf } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { currentYearMonth } from "@/lib/thai";

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "missing id" }, { status: 400 });
    }

    const ctx = await requireOrgContext();
    const gate = canExportPdf({ planKey: ctx.organization.planKey });
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    const doc = await prisma.document.findFirst({
      where: { id, organizationId: ctx.organization.id },
    });
    if (!doc) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    let buffer: Buffer;
    if (doc.type === DocumentType.INTERNAL) {
      buffer = await buildInternalPdf(parseInternalPayload(doc.payload));
    } else if (doc.type === DocumentType.STAMP) {
      buffer = await buildStampPdf(parseStampPayload(doc.payload));
    } else {
      buffer = await buildExternalPdf(parseExternalPayload(doc.payload));
    }

    const yearMonth = currentYearMonth();
    await prisma.usageMeter.upsert({
      where: {
        organizationId_yearMonth: {
          organizationId: ctx.organization.id,
          yearMonth,
        },
      },
      create: {
        organizationId: ctx.organization.id,
        yearMonth,
        exportsCount: 1,
      },
      update: { exportsCount: { increment: 1 } },
    });

    const filename = encodeURIComponent(`${doc.title || "document"}.pdf`);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${filename}`,
      },
    });
  } catch (e) {
    console.error("PDF export failed:", e);
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "export failed", detail: msg },
      { status: 500 },
    );
  }
}
