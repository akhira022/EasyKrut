import { notFound } from "next/navigation";
import { DocumentType } from "@/lib/constants";
import { parseExternalPayload, parseInternalPayload } from "@/lib/documents/payload";
import { canExportPdf } from "@/lib/entitlements";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";
import { PrintView } from "./print-view";

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

  return (
    <PrintView
      documentId={doc.id}
      title={doc.title}
      type={doc.type}
      internalData={
        doc.type === DocumentType.INTERNAL ? parseInternalPayload(doc.payload) : undefined
      }
      externalData={
        doc.type !== DocumentType.INTERNAL ? parseExternalPayload(doc.payload) : undefined
      }
    />
  );
}
