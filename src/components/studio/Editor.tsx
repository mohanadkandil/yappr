"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import "./editor.css";
import { applyFixToHtml, type FixTarget } from "@/lib/apply-fix";

export type EditorHandle = {
  /** Replace the targeted span with newHtml; preserves the rest of the doc. */
  applyFix: (target: FixTarget, newHtml: string) => void;
  getHTML: () => string;
};

export const Editor = forwardRef<EditorHandle, {
  initialContent: string;
  onUpdate?: (html: string) => void;
}>(function Editor({ initialContent, onUpdate }, ref) {
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Paste a URL or start writing…" }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: "beacon-editor focus:outline-none" },
    },
    onUpdate: ({ editor }) => onUpdateRef.current?.(editor.getHTML()),
  });

  useImperativeHandle(ref, () => ({
    applyFix(target, newHtml) {
      if (!editor) return;
      const current = editor.getHTML();
      const next = applyFixToHtml(current, target, newHtml);
      editor.commands.setContent(next, { emitUpdate: true });
    },
    getHTML: () => editor?.getHTML() ?? "",
  }), [editor]);

  useEffect(() => {
    return () => editor?.destroy();
  }, [editor]);

  return <EditorContent editor={editor} />;
});
