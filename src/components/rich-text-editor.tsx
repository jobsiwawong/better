"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Image from "@tiptap/extension-image";
import {
  Bold,
  CheckSquare,
  Columns3,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  List,
  ListOrdered,
  Minus,
  Rows3,
  Table as TableIcon,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Underline as UnderlineIcon,
  Heading2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { uploadImage, MAX_IMAGE_BYTES } from "@/lib/upload-image";

export interface RichTextEditorHandle {
  getJSON: () => object;
}

// Tab / Shift-Tab indent list items — even inside a table, where the Table
// extension otherwise steals Tab for cell navigation. High priority so this
// runs first; it only claims Tab when the cursor is in a list item, otherwise
// it returns false and Tab falls through to the table's cell navigation.
const ListTabIndent = Extension.create({
  name: "listTabIndent",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (!this.editor.isActive("listItem")) return false;
        return this.editor.chain().focus().sinkListItem("listItem").run();
      },
      "Shift-Tab": () => {
        if (!this.editor.isActive("listItem")) return false;
        return this.editor.chain().focus().liftListItem("listItem").run();
      },
    };
  },
});

// Make Cmd/Ctrl + arrows move by WORD (like Option+Arrow) instead of the OS
// default (jump to line start/end). Uses the native Selection.modify with
// "word" granularity — same boundaries the OS uses — and lets ProseMirror's
// DOM-selection observer sync state. Shift variants extend the selection.
const wordArrow = (alter: "move" | "extend", direction: "left" | "right") => () => {
  const sel = typeof window !== "undefined" ? window.getSelection() : null;
  // Selection.modify is supported in all major browsers; bail if ever missing
  // so native handling applies.
  if (!sel || typeof sel.modify !== "function") return false;
  sel.modify(alter, direction, "word");
  return true;
};

const WordwiseArrows = Extension.create({
  name: "wordwiseArrows",
  priority: 1000,
  addKeyboardShortcuts() {
    return {
      "Mod-ArrowLeft": wordArrow("move", "left"),
      "Mod-ArrowRight": wordArrow("move", "right"),
      "Mod-Shift-ArrowLeft": wordArrow("extend", "left"),
      "Mod-Shift-ArrowRight": wordArrow("extend", "right"),
    };
  },
});

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start typing…",
  variant = "basic",
  minHeight = "6rem",
  className,
}: {
  content?: string | null;
  onChange?: (json: object) => void;
  placeholder?: string;
  variant?: "basic" | "full";
  minHeight?: string;
  className?: string;
}) {
  const initialContent = React.useMemo(() => {
    if (!content) return undefined;
    try {
      return JSON.parse(content);
    } catch {
      return undefined;
    }
  }, [content]);

  // Held in a ref so the (stable) paste handler can reach the latest editor.
  const editorRef = React.useRef<Editor | null>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ListTabIndent,
      WordwiseArrows,
      StarterKit.configure({
        heading: variant === "full" ? { levels: [1, 2, 3] } : false,
        codeBlock: false,
        blockquote: variant === "full" ? {} : false,
        horizontalRule: variant === "full" ? {} : false,
      }),
      Placeholder.configure({ placeholder }),
      ...(variant === "full"
        ? [
            TaskList,
            TaskItem.configure({ nested: true }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            Image.configure({ inline: false, allowBase64: true }),
          ]
        : []),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none px-4 py-3 focus:outline-none dark:prose-invert",
          "prose-headings:font-semibold prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5"
        ),
        // Min-height lives on the editable element itself (not a wrapper) so
        // the whole visible box is clickable — otherwise clicks below the first
        // line miss the contenteditable and the editor never focuses.
        style: `min-height: ${minHeight}`,
      },
      handlePaste:
        variant === "full"
          ? (view, event) => {
              const files = Array.from(event.clipboardData?.files ?? []).filter((f) =>
                f.type.startsWith("image/")
              );
              if (files.length === 0) return false;
              event.preventDefault();
              files.forEach(async (file) => {
                if (file.size > MAX_IMAGE_BYTES) return;
                const src = await uploadImage(file);
                editorRef.current
                  ?.chain()
                  .focus()
                  .setImage({ src })
                  .run();
              });
              return true;
            }
          : undefined,
    },
  });

  React.useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  return (
    <div className={cn("rounded-2xl border border-border bg-background", className)}>
      {editor && <Toolbar editor={editor} variant={variant} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  variant,
}: {
  editor: Editor;
  variant: "basic" | "full";
}) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Re-render the toolbar on every selection/transaction so the active
  // states and the contextual table controls always reflect the cursor
  // (the table bar used to appear only intermittently).
  const [, forceUpdate] = React.useReducer((n: number) => n + 1, 0);
  React.useEffect(() => {
    const handle = () => forceUpdate();
    editor.on("selectionUpdate", handle);
    editor.on("transaction", handle);
    return () => {
      editor.off("selectionUpdate", handle);
      editor.off("transaction", handle);
    };
  }, [editor]);

  const inTable = editor.isActive("table");
  const inOrderedList = editor.isActive("orderedList");
  const inList =
    editor.isActive("bulletList") || inOrderedList || editor.isActive("listItem");
  const orderedStart = Number(editor.getAttributes("orderedList").start ?? 1);

  const setStart = (n: number) => {
    if (!Number.isFinite(n) || n < 1) return;
    editor
      .chain()
      .focus()
      .updateAttributes("orderedList", { start: Math.floor(n) })
      .run();
  };

  // Continue numbering from the nearest ordered list earlier in the document
  // (numbering restarts at 1 whenever a table or paragraph splits a list).
  const continueNumbering = () => {
    const { state } = editor;
    const $from = state.selection.$from;
    let curPos = -1;
    for (let d = $from.depth; d > 0; d--) {
      if ($from.node(d).type.name === "orderedList") {
        curPos = $from.before(d);
        break;
      }
    }
    if (curPos < 0) return;
    const prevLists: { start: number; count: number }[] = [];
    state.doc.descendants((node, pos) => {
      if (pos < curPos && node.type.name === "orderedList") {
        prevLists.push({
          start: Number(node.attrs.start ?? 1),
          count: node.childCount,
        });
      }
    });
    const prev = prevLists[prevLists.length - 1];
    if (!prev) return;
    setStart(prev.start + prev.count);
  };

  const insertImages = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_IMAGE_BYTES) {
        window.alert("That image is too large (max 8 MB).");
        continue;
      }
      const src = await uploadImage(file);
      editor.chain().focus().setImage({ src }).run();
    }
  };

  return (
    <div className="sticky top-0 z-20 rounded-t-2xl bg-background">
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-2 py-1.5">
      <ToolbarButton
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label="Bold"
      >
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label="Italic"
      >
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label="Underline"
      >
        <UnderlineIcon className="size-3.5" />
      </ToolbarButton>
      <Separator orientation="vertical" className="mx-1 h-4" />
      <ToolbarButton
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="Bullet list"
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="Numbered list"
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>
      {inList && (
        <>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
            label="Indent (sub-item)"
          >
            <IndentIncrease className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().liftListItem("listItem").run()}
            label="Outdent"
          >
            <IndentDecrease className="size-3.5" />
          </ToolbarButton>
        </>
      )}
      {variant === "full" && (
        <>
          <Separator orientation="vertical" className="mx-1 h-4" />
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            label="Heading"
          >
            <Heading2 className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("taskList")}
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            label="Checklist"
          >
            <CheckSquare className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            label="Partition line"
          >
            <Minus className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() =>
              editor
                .chain()
                .focus()
                .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                .run()
            }
            label="Insert table"
          >
            <TableIcon className="size-3.5" />
          </ToolbarButton>
          <ToolbarButton
            active={false}
            onClick={() => fileInputRef.current?.click()}
            label="Insert image"
          >
            <ImagePlus className="size-3.5" />
          </ToolbarButton>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              insertImages(e.target.files);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>

    {variant === "full" && inTable && (
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5 text-xs">
        <span className="mr-1 font-medium text-muted-foreground">Table:</span>
        <TableChip onClick={() => editor.chain().focus().addRowAfter().run()}>
          <Rows3 className="size-3" /> Add row
        </TableChip>
        <TableChip onClick={() => editor.chain().focus().addColumnAfter().run()}>
          <Columns3 className="size-3" /> Add column
        </TableChip>
        <TableChip onClick={() => editor.chain().focus().deleteRow().run()}>
          <Rows3 className="size-3" /> Delete row
        </TableChip>
        <TableChip onClick={() => editor.chain().focus().deleteColumn().run()}>
          <Columns3 className="size-3" /> Delete column
        </TableChip>
        <TableChip onClick={() => editor.chain().focus().mergeCells().run()}>
          <TableCellsMerge className="size-3" /> Merge cells
        </TableChip>
        <TableChip onClick={() => editor.chain().focus().splitCell().run()}>
          <TableCellsSplit className="size-3" /> Split cell
        </TableChip>
        <TableChip onClick={() => editor.chain().focus().toggleHeaderRow().run()}>
          Header row
        </TableChip>
        <TableChip
          onClick={() => editor.chain().focus().deleteTable().run()}
          destructive
        >
          <Trash2 className="size-3" /> Delete table
        </TableChip>
      </div>
    )}

    {inOrderedList && (
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5 text-xs">
        <span className="mr-1 font-medium text-muted-foreground">Numbering:</span>
        <TableChip onClick={continueNumbering}>Continue from above</TableChip>
        <TableChip onClick={() => setStart(1)}>Restart at 1</TableChip>
        <label className="ml-1 flex items-center gap-1 text-muted-foreground">
          Start at
          <input
            type="number"
            min={1}
            value={orderedStart}
            onChange={(e) => setStart(Number(e.target.value))}
            className="h-6 w-14 rounded-md border border-border bg-background px-1.5 text-foreground"
          />
        </label>
      </div>
    )}
    </div>
  );
}

function TableChip({
  onClick,
  children,
  destructive,
}: {
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 font-medium transition-colors hover:bg-accent",
        destructive && "text-destructive hover:bg-destructive/10"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-7 rounded-lg", active && "bg-accent text-accent-foreground")}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </Button>
  );
}
