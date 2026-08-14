import { notFound } from "next/navigation";
import { ExternalEditor } from "@/components/editor/ExternalEditor";
import { InternalEditor } from "@/components/editor/InternalEditor";
import { StampEditor } from "@/components/editor/StampEditor";
import { DocumentType } from "@/lib/constants";
import {
  parseExternalPayload,
  parseInternalPayload,
  parseStampPayload,
} from "@/lib/documents/payload";
import { prisma } from "@/lib/db";
import { requireOrgContext } from "@/lib/org-context";

export default async function DocumentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgContext();
  const doc = await prisma.document.findFirst({
    where: { id, organizationId: ctx.organization.id },
  });
  if (!doc) notFound();

  const status = doc.status === "FINAL" ? "FINAL" : "DRAFT";

  if (doc.type === DocumentType.INTERNAL) {
    return (
      <InternalEditor
        documentId={doc.id}
        initialStatus={status}
        initialPayload={parseInternalPayload(doc.payload)}
      />
    );
  }

  if (doc.type === DocumentType.STAMP) {
    return (
      <StampEditor
        documentId={doc.id}
        initialStatus={status}
        initialPayload={parseStampPayload(doc.payload)}
      />
    );
  }

  return (
    <ExternalEditor
      documentId={doc.id}
      initialStatus={status}
      initialPayload={parseExternalPayload(doc.payload)}
    />
  );
}
