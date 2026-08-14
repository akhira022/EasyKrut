import { notFound } from "next/navigation";
import { ExternalEditor } from "@/components/editor/ExternalEditor";
import { InternalEditor } from "@/components/editor/InternalEditor";
import { StampEditor } from "@/components/editor/StampEditor";
import { OrderEditor } from "@/components/editor/OrderEditor";
import { AnnounceEditor } from "@/components/editor/AnnounceEditor";
import { CertEditor } from "@/components/editor/CertEditor";
import { MeetingEditor } from "@/components/editor/MeetingEditor";
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
  const common = { documentId: doc.id, initialStatus: status as "DRAFT" | "FINAL" };

  if (doc.type === DocumentType.INTERNAL) {
    return <InternalEditor {...common} initialPayload={parseInternalPayload(doc.payload)} />;
  }
  if (doc.type === DocumentType.STAMP) {
    return <StampEditor {...common} initialPayload={parseStampPayload(doc.payload)} />;
  }
  if (doc.type === DocumentType.ORDER) {
    return <OrderEditor {...common} initialPayload={parseOrderPayload(doc.payload)} />;
  }
  if (doc.type === DocumentType.ANNOUNCE) {
    return <AnnounceEditor {...common} initialPayload={parseAnnouncePayload(doc.payload)} />;
  }
  if (doc.type === DocumentType.CERT) {
    return <CertEditor {...common} initialPayload={parseCertPayload(doc.payload)} />;
  }
  if (doc.type === DocumentType.MEETING) {
    return <MeetingEditor {...common} initialPayload={parseMeetingPayload(doc.payload)} />;
  }

  return <ExternalEditor {...common} initialPayload={parseExternalPayload(doc.payload)} />;
}
