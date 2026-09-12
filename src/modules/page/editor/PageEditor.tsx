import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import { Extension } from "@tiptap/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Table, TableCell, TableHeader, TableRow } from "@tiptap/extension-table";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { useEffect, useMemo, useRef, useState } from "react";
import { EvidenceRef, insertEvidenceRef } from "../../evidence/editor/extensions/evidenceRef";
import { EvidencePickerModal } from "../../evidence/ui/EvidencePickerModal";
import { VulnNote, insertVulnNote } from "../../finding/editor/extensions/vulnNote";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { useDebouncedCallback } from "../../../shared/lib/useDebouncedCallback";
import { Button } from "../../../shared/ui/Button";
import type { JsonValue } from "../../../shared/types";
import { createMentionExtension, type MentionItem } from "./extensions/mention";
import { createSlashCommandExtension, type SlashCommandItem } from "./extensions/slashCommand";
import { CodeBlock, lowlight } from "./extensions/codeBlock";
import { FormattingToolbar } from "./extensions/FormattingToolbar";
import { LinkModal } from "./extensions/LinkModal";
import { TableSizeModal } from "./extensions/TableSizeModal";
import { TableToolbar } from "./extensions/TableToolbar";
import type { LinkTarget } from "../page_link.repository";
import { extractLinkTargets } from "../page.utils";

function insertTimestampAt(editor: Editor): void {
  const now = new Date();
  const label = `${now.toLocaleDateString(undefined, { day: "2-digit", month: "short" })}, ${now.toLocaleTimeString(
    [],
    { hour: "2-digit", minute: "2-digit" },
  )}`;

  const chain = editor.chain().focus();
  // Start a fresh line unless the current one is already empty — otherwise
  // repeated timestamps (or one dropped mid-sentence) run straight into
  // whatever text is already there.
  const { $from } = editor.state.selection;
  if ($from.parent.content.size > 0) {
    chain.splitBlock();
  }
  chain
    .insertContent([
      { type: "text", marks: [{ type: "bold" }], text: label },
      { type: "text", text: " — " },
    ])
    .run();
}

/** Mod-Shift-T inserts a timestamp without reaching for the "/" menu or the toolbar button — handy when logging several steps in quick succession. */
const TimestampShortcut = Extension.create({
  name: "timestampShortcut",
  addKeyboardShortcuts() {
    return {
      "Mod-Shift-t": () => {
        insertTimestampAt(this.editor);
        return true;
      },
    };
  },
});

interface PageEditorProps {
  pageId: string;
  entry: CatalogEntry;
  initialContent: JsonValue;
  mentionItems: MentionItem[];
  onSave: (blocks: JsonValue) => void;
  onLinksChange: (targets: LinkTarget[]) => void;
}

function isDocContent(value: JsonValue): value is JSONContent {
  return typeof value === "object" && value !== null && !Array.isArray(value) && "type" in value;
}

export function PageEditor({
  pageId,
  entry,
  initialContent,
  mentionItems,
  onSave,
  onLinksChange,
}: PageEditorProps) {
  const [showEvidencePicker, setShowEvidencePicker] = useState(false);
  const [showTableSizeModal, setShowTableSizeModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);

  const itemsRef = useRef<MentionItem[]>(mentionItems);
  useEffect(() => {
    itemsRef.current = mentionItems;
  }, [mentionItems]);

  const mentionExtension = useMemo(
    () =>
      createMentionExtension((query) =>
        itemsRef.current
          .filter((item) => !(item.targetType === "page" && item.id === pageId))
          .filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 10),
      ),
    [pageId],
  );

  const slashItems = useMemo<SlashCommandItem[]>(
    () => [
      {
        id: "heading1",
        label: "Heading 1",
        icon: "H1",
        action: (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: "heading2",
        label: "Heading 2",
        icon: "H2",
        action: (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: "heading3",
        label: "Heading 3",
        icon: "H3",
        action: (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        id: "heading4",
        label: "Heading 4",
        icon: "H4",
        action: (ed) => ed.chain().focus().toggleHeading({ level: 4 }).run(),
      },
      {
        id: "heading5",
        label: "Heading 5",
        icon: "H5",
        action: (ed) => ed.chain().focus().toggleHeading({ level: 5 }).run(),
      },
      {
        id: "checklist",
        label: "Checklist",
        icon: "☑️",
        action: (ed) => ed.chain().focus().toggleTaskList().run(),
      },
      {
        id: "bulletList",
        label: "Bullet list",
        icon: "•",
        action: (ed) => ed.chain().focus().toggleBulletList().run(),
      },
      {
        id: "orderedList",
        label: "Numbered list",
        icon: "1.",
        action: (ed) => ed.chain().focus().toggleOrderedList().run(),
      },
      {
        id: "codeBlock",
        label: "Code block",
        icon: "💻",
        action: (ed) => ed.chain().focus().toggleCodeBlock().run(),
      },
      {
        id: "table",
        label: "Table",
        icon: "▦",
        action: () => setShowTableSizeModal(true),
      },
      {
        id: "divider",
        label: "Divider",
        icon: "―",
        action: (ed) => ed.chain().focus().setHorizontalRule().run(),
      },
      {
        id: "timestamp",
        label: "Timestamp",
        icon: "🕒",
        action: insertTimestampAt,
      },
      {
        id: "evidence",
        label: "Evidence",
        icon: "📎",
        action: () => setShowEvidencePicker(true),
      },
      {
        id: "vulnNote",
        label: "Vulnerability note",
        icon: "🐞",
        action: insertVulnNote,
      },
    ],
    [],
  );

  const slashExtension = useMemo(
    () => createSlashCommandExtension(() => slashItems),
    [slashItems],
  );

  const extensions = useMemo(
    () => [
      StarterKit.configure({ codeBlock: false }),
      mentionExtension,
      slashExtension,
      EvidenceRef,
      VulnNote,
      Link.configure({ openOnClick: false, autolink: true }),
      CodeBlock.configure({ lowlight }),
      TimestampShortcut,
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    [mentionExtension, slashExtension],
  );

  const [saveStatus, setSaveStatus] = useState<"idle" | "pending" | "saved">("idle");
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const debouncedSave = useDebouncedCallback((blocks: JsonValue) => {
    onSave(blocks);
    onLinksChange(extractLinkTargets(blocks));
    setSaveStatus("saved");
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
  }, 500);

  const editor = useEditor({
    extensions,
    content: isDocContent(initialContent) ? initialContent : "",
    onUpdate: ({ editor: currentEditor }) => {
      setSaveStatus("pending");
      debouncedSave(currentEditor.getJSON() as JsonValue);
    },
    editorProps: {
      // Link is configured with openOnClick: false — its default click-to-open
      // uses window.open(), which doesn't open the system browser from inside
      // a Tauri webview. Ctrl/Cmd+Click here instead, using the opener plugin.
      handleClick: (_view, _pos, event) => {
        if (!(event.ctrlKey || event.metaKey)) return false;
        const anchor = (event.target as HTMLElement).closest("a");
        const href = anchor?.getAttribute("href");
        if (!href) return false;
        event.preventDefault();
        openUrl(href).catch(() => undefined);
        return true;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const nextContent = isDocContent(initialContent) ? initialContent : "";
    editor.commands.setContent(nextContent, { emitUpdate: false });
    // Only re-sync when switching to a different page, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, pageId]);

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Button
          variant="secondary"
          className="text-xs"
          title="Quick reference to a screenshot/file, with its own caption and a Link to Finding button. For a suspected vulnerability with severity, use + Vulnerability note instead."
          onClick={() => setShowEvidencePicker(true)}
        >
          + Evidence
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          title="Log a suspected vulnerability here: title, severity, evidence with captions. Promote it to a structured Finding once you're sure it's real."
          onClick={() => editor && insertVulnNote(editor)}
        >
          + Vulnerability note
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          title="Insert a table with a chosen number of rows/columns. Add/remove rows and columns later from the table toolbar, or drag column borders to resize."
          onClick={() => setShowTableSizeModal(true)}
        >
          + Table
        </Button>
        <Button
          variant="secondary"
          className="text-xs"
          title="Insert the current date and time on a new line (Ctrl/Cmd+Shift+T) — handy for a running activity log."
          onClick={() => editor && insertTimestampAt(editor)}
        >
          + Timestamp
        </Button>
        <span className="text-xs text-neutral-600">
          Type &quot;/&quot; for headings (H1-H5), checklists, code blocks, tables…
        </span>
        <span className="ml-auto self-center text-xs text-neutral-500">
          {saveStatus === "pending" && "Saving…"}
          {saveStatus === "saved" && <span className="text-emerald-500">Saved</span>}
        </span>
      </div>

      <FormattingToolbar editor={editor} onLinkClick={() => setShowLinkModal(true)} />
      <TableToolbar editor={editor} />

      <div className="min-h-[200px] rounded-md border border-neutral-800 bg-neutral-900/40 px-4 py-3 text-sm text-neutral-200">
        <EditorContent editor={editor} />
      </div>

      <EvidencePickerModal
        open={showEvidencePicker}
        entry={entry}
        onPick={(evidence) => {
          if (editor) insertEvidenceRef(editor, evidence.id);
          setShowEvidencePicker(false);
        }}
        onClose={() => setShowEvidencePicker(false)}
      />
      <TableSizeModal
        open={showTableSizeModal}
        onInsert={(rows, cols, withHeaderRow) =>
          editor?.chain().focus().insertTable({ rows, cols, withHeaderRow }).run()
        }
        onClose={() => setShowTableSizeModal(false)}
      />
      <LinkModal
        open={showLinkModal}
        initialUrl={(editor?.getAttributes("link").href as string | undefined) ?? ""}
        onApply={(url) => editor?.chain().focus().extendMarkRange("link").setLink({ href: url }).run()}
        onRemove={() => editor?.chain().focus().extendMarkRange("link").unsetLink().run()}
        onClose={() => setShowLinkModal(false)}
      />
    </div>
  );
}
