"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  deleteDocumentAction,
  duplicateDocumentAction,
} from "@/lib/actions/documents";
import { documentStatusLabel, documentTypeLabel } from "@/lib/documents/labels";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/ui/StatusBadge";

type DocRow = {
  id: string;
  title: string;
  type: string;
  status: string;
  createdById: string;
  createdByName: string;
  updatedAt: string;
};

export function DocumentList({
  documents,
  canDeleteIds,
}: {
  documents: DocRow[];
  canDeleteIds: string[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function duplicate(id: string) {
    startTransition(async () => {
      const result = await duplicateDocumentAction(id);
      if (result.ok && result.documentId) {
        router.push(`/documents/${result.documentId}`);
      }
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    const id = deleteId;
    startTransition(async () => {
      await deleteDocumentAction(id);
      setDeleteId(null);
      router.refresh();
    });
  }

  return (
    <>
      <div className="rounded-xl border border-[var(--border-color)] bg-white overflow-hidden">
        <table className="doc-list-desktop text-sm">
          <thead className="bg-[#f7f6fb] text-left">
            <tr>
              <th className="p-3 font-medium">เรื่อง</th>
              <th className="p-3 font-medium">ประเภท</th>
              <th className="p-3 font-medium">สถานะ</th>
              <th className="p-3 font-medium">ผู้สร้าง</th>
              <th className="p-3 font-medium">อัปเดต</th>
              <th className="p-3 font-medium">
                <span className="sr-only">การกระทำ</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id} className="border-t border-[var(--border-color)]">
                <td className="p-3">
                  <Link href={`/documents/${doc.id}`} className="text-[var(--primary-color)] hover:underline">
                    {doc.title}
                  </Link>
                </td>
                <td className="p-3">{documentTypeLabel(doc.type)}</td>
                <td className="p-3">{documentStatusLabel(doc.status)}</td>
                <td className="p-3">{doc.createdByName}</td>
                <td className="p-3 whitespace-nowrap">{doc.updatedAt}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button type="button" className="btn-text" disabled={pending} onClick={() => duplicate(doc.id)}>
                      คัดลอก
                    </button>
                    {canDeleteIds.includes(doc.id) ? (
                      <button type="button" className="btn-danger" onClick={() => setDeleteId(doc.id)}>
                        ลบ
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="doc-list-mobile divide-y">
          {documents.map((doc) => (
            <div key={doc.id} className="p-4 space-y-2">
              <Link href={`/documents/${doc.id}`} className="font-medium text-[var(--primary-color)]">
                {doc.title}
              </Link>
              <div className="flex flex-wrap gap-2 items-center text-xs text-[var(--text-muted)]">
                <StatusBadge>{documentTypeLabel(doc.type)}</StatusBadge>
                <span>{documentStatusLabel(doc.status)}</span>
                <span>{doc.createdByName}</span>
                <span>{doc.updatedAt}</span>
              </div>
              <div className="flex gap-2">
                <button type="button" className="btn-text" disabled={pending} onClick={() => duplicate(doc.id)}>
                  คัดลอก
                </button>
                {canDeleteIds.includes(doc.id) ? (
                  <button type="button" className="btn-danger" onClick={() => setDeleteId(doc.id)}>
                    ลบ
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
      <ConfirmDialog
        open={Boolean(deleteId)}
        title="ลบเอกสารนี้?"
        description="การลบไม่สามารถย้อนกลับได้"
        confirmLabel="ลบเอกสาร"
        danger
        pending={pending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
}
