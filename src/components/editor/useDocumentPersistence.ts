"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type PersistStatus = "idle" | "unsaved" | "saving" | "saved" | "error";
export type MessageTone = "info" | "success" | "error";

export function useDocumentPersistence(
  saveFn: () => Promise<{ ok: boolean; error?: string }>,
) {
  const dirtyRef = useRef(false);
  const genRef = useRef(0);
  const queueRef = useRef(Promise.resolve(true));
  const saveFnRef = useRef(saveFn);
  const [persistStatus, setPersistStatus] = useState<PersistStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<MessageTone>("info");

  useEffect(() => {
    saveFnRef.current = saveFn;
  }, [saveFn]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    genRef.current += 1;
    setPersistStatus("unsaved");
  }, []);

  const persist = useCallback(async (opts?: { silent?: boolean }) => {
    const run = async () => {
      let attempts = 0;
      while (dirtyRef.current && attempts < 5) {
        attempts += 1;
        const gen = genRef.current;
        setPersistStatus("saving");
        try {
          const result = await saveFnRef.current();
          if (!result.ok) {
            setPersistStatus("error");
            setMessageTone("error");
            setMessage(
              opts?.silent
                ? "บันทึกอัตโนมัติไม่สำเร็จ — กดบันทึกอีกครั้ง"
                : (result.error ?? "บันทึกไม่สำเร็จ"),
            );
            return false;
          }
          if (genRef.current === gen) {
            dirtyRef.current = false;
            setPersistStatus("saved");
            setMessageTone("success");
            setMessage(opts?.silent ? "บันทึกอัตโนมัติแล้ว" : "บันทึกแล้ว");
            return true;
          }
        } catch {
          setPersistStatus("error");
          setMessageTone("error");
          setMessage(
            opts?.silent
              ? "บันทึกอัตโนมัติไม่สำเร็จ — กดบันทึกอีกครั้ง"
              : "บันทึกไม่สำเร็จ",
          );
          return false;
        }
      }
      return !dirtyRef.current;
    };
    const next = queueRef.current.then(run, run);
    queueRef.current = next.then(
      () => true,
      () => true,
    );
    return next;
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (!dirtyRef.current) return;
      void persist({ silent: true });
    }, 20_000);
    return () => window.clearInterval(id);
  }, [persist]);

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (!dirtyRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  return {
    persist,
    markDirty,
    persistStatus,
    message,
    messageTone,
    setMessage,
    setMessageTone,
  };
}

export function persistStatusLabel(status: PersistStatus) {
  switch (status) {
    case "saving":
      return "กำลังบันทึก...";
    case "unsaved":
      return "ยังไม่บันทึก";
    case "saved":
      return "บันทึกแล้ว";
    case "error":
      return "บันทึกไม่สำเร็จ";
    default:
      return "";
  }
}
