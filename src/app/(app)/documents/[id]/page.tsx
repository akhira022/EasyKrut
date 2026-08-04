import { notFound } from "next/navigation";
import { ExternalEditor } from "@/components/editor/ExternalEditor";
import { parseExternalPayload } from "@/lib/documents/payload";
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

  const payload = parseExternalPayload(doc.payload);

  return (
    <ExternalEditor
      documentId={doc.id}
      initialStatus={doc.status === "FINAL" ? "FINAL" : "DRAFT"}
      initialPayload={payload}
    />
  );
}
