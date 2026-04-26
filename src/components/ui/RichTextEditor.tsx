"use client";

import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import type { PartialBlock } from "@blocknote/core";
import { useEffect, useRef, useState } from "react";

import styles from "./RichTextEditor.module.css";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";

interface RichTextEditorProps {
  initialContent: string;
  onSave: (content: string) => void | Promise<void>;
  placeholder?: string;
}

function toPlainTextFromHtml(value: string) {
  if (typeof window === "undefined") {
    return value.replace(/<[^>]*>/g, " ").trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return (doc.body.textContent ?? "").trim();
}

export function RichTextEditor({
  initialContent,
  onSave,
  placeholder = "Type / for commands",
}: RichTextEditorProps) {
  const [isMounted, setIsMounted] = useState(false);
  const editor = useCreateBlockNote({
    initialContent: undefined,
    placeholderText: placeholder,
  });
  const lastSavedRef = useRef("");
  const mountedRef = useRef(false);

  // Ensure client-only rendering to prevent hydration errors
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    let active = true;

    async function setInitialBlocks() {
      const value = initialContent.trim();
      let blocks: PartialBlock[] | null = null;

      if (value.startsWith("[") && value.endsWith("]")) {
        try {
          const parsed = JSON.parse(value) as PartialBlock[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            blocks = parsed;
          }
        } catch {
          blocks = null;
        }
      }

      if (!blocks && value) {
        try {
          const parsedMarkdown = await editor.tryParseMarkdownToBlocks(value);
          if (parsedMarkdown.length > 0) {
            blocks = parsedMarkdown;
          }
        } catch {
          blocks = null;
        }
      }

      if (!blocks) {
        const content = value.startsWith("<") ? toPlainTextFromHtml(value) : value;
        blocks = [{ type: "paragraph", content }];
      }

      if (!active) {
        return;
      }

      editor.replaceBlocks(editor.document, blocks);
      lastSavedRef.current = JSON.stringify(editor.document);
      mountedRef.current = true;
    }

    void setInitialBlocks();

    return () => {
      active = false;
    };
  }, [editor, initialContent]);

  async function handleSave() {
    if (!mountedRef.current) {
      return;
    }

    const serialized = JSON.stringify(editor.document);
    if (serialized === lastSavedRef.current) {
      return;
    }

    lastSavedRef.current = serialized;
    await onSave(serialized);
  }

  // Show loading placeholder until client-side mount
  if (!isMounted) {
    return (
      <div className={styles.editorWrap}>
        <div className={styles.placeholder} style={{ padding: "1rem", color: "#666" }}>
          Loading editor...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.editorWrap} onBlurCapture={() => void handleSave()}>
      <BlockNoteView
        editor={editor}
        editable
        formattingToolbar={false}
      />
    </div>
  );
}
