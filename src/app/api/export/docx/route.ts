import { NextRequest, NextResponse } from "next/server";
import { buildExternalDocx } from "@/lib/documents/external/docx";
import { parseExternalPayload } from "@/lib/documents/payload";
import { canExportWord } from "@/lib/entitlements";
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
    const gate = canExportWord({ planKey: ctx.organization.planKey });
    if (!gate.ok) {
      return NextResponse.json({ error: gate.reason }, { status: 403 });
    }

    const doc = await prisma.document.findFirst({
      where: { id, organizationId: ctx.organization.id },
    });
    if (!doc) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }

    const payload = parseExternalPayload(doc.payload);
    const buffer = await buildExternalDocx(payload);

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
