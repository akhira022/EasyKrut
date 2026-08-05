import { notFound } from "next/navigation";
import { ExternalLetterPreview } from "@/components/documents/ExternalLetterPreview";
import { InternalLetterPreview } from "@/components/documents/InternalLetterPreview";
import { DocumentType } from "@/lib/constants";
import { parseExternalPayload, parseInternalPayload } from "@/lib/documents/payload";
import { canExportPdf } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { currentYearMonth } from "@/lib/thai";
import { PrintActions } from "./print-actions";

export default async function PrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const gate = canExportPdf({ planKey: ctx.organization.planKey });
  if (!gate.ok) {
    return (
      <div className="p-8">
        <p>{gate.reason}</p>
      </div>
    );
  }

  const doc = await prisma.document.findFirst({
    where: { id, organizationId: ctx.organization.id },
  });
  if (!doc) notFound();

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

  return (
    <div className="print-root bg-[#e8e8e8] min-h-screen py-6">
      <PrintActions title={doc.title} />
      <div className="flex justify-center">
        {doc.type === DocumentType.INTERNAL ? (
          <InternalLetterPreview data={parseInternalPayload(doc.payload)} printMode />
        ) : (
          <ExternalLetterPreview data={parseExternalPayload(doc.payload)} printMode />
        )}
      </div>
    </div>
  );
}
