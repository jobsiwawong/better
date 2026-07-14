"use client";

import * as React from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
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
  Italic,
  List,
  ListOrdered,
  Rows3,
  Table as TableIcon,
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
      StarterKit.configure({
        heading: variant === "full" ? { levels: [1, 2, 3] } : false,
        codeBlock: false,
        blockquote: variant === "full" ? {} : false,
        horizontalRule: false,
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
  const inTable = editor.isActive("table");

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
    <>
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
    </>
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
