"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { performRedo, performUndo } from "@/lib/undo-store";

function isEditingText(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest("input, textarea, [contenteditable='true']");
}

export function UndoManager() {
  const router = useRouter();
  const busy = React.useRef(false);

  React.useEffect(() => {
    async function handler(e: KeyboardEvent) {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      const isUndo = key === "z" && !e.shiftKey;
      const isRedo = (key === "z" && e.shiftKey) || key === "y";
      if (!isUndo && !isRedo) return;
      // Let inputs and rich-text editors handle their own native undo.
      if (isEditingText(e.target)) return;

      e.preventDefault();
      if (busy.current) return;
      busy.current = true;
      try {
        const entry = isUndo ? await performUndo() : await performRedo();
        if (entry) {
          toast(`${isUndo ? "Undid" : "Redid"}: ${entry.label}`);
          router.refresh();
        } else {
          toast(isUndo ? "Nothing to undo" : "Nothing to redo");
        }
      } finally {
        busy.current = false;
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router]);

  return null;
}
