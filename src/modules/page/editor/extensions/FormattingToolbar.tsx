import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";

interface FormattingToolbarProps {
  editor: Editor | null;
  onLinkClick: () => void;
}

interface FormatState {
  bold: boolean;
  italic: boolean;
  strike: boolean;
  code: boolean;
  bulletList: boolean;
  orderedList: boolean;
  blockquote: boolean;
  link: boolean;
  hasSelection: boolean;
}

/** A mark toggle only makes sense with a selection to apply it to, or to turn an already-active mark back off — otherwise there's nothing for the click to act on. */
function canToggle(active: boolean, hasSelection: boolean): boolean {
  return active || hasSelection;
}

/**
 * StarterKit already wires up bold/italic/lists/etc. via keyboard shortcuts
 * and markdown input rules, but there was no visible button for any of
 * them — a user who doesn't already know "**text**" or Ctrl+B had no way
 * to discover the feature at all.
 */
export function FormattingToolbar({ editor, onLinkClick }: FormattingToolbarProps) {
  const state = useEditorState<FormatState | null>({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            bold: ed.isActive("bold"),
            italic: ed.isActive("italic"),
            strike: ed.isActive("strike"),
            code: ed.isActive("code"),
            bulletList: ed.isActive("bulletList"),
            orderedList: ed.isActive("orderedList"),
            blockquote: ed.isActive("blockquote"),
            link: ed.isActive("link"),
            hasSelection: !ed.state.selection.empty,
          }
        : null,
  });

  if (!editor || !state) return null;

  const buttonClass = (active: boolean) =>
    `rounded px-2 py-1 text-xs hover:bg-neutral-700 disabled:opacity-40 disabled:hover:bg-transparent ${
      active ? "bg-neutral-700 text-neutral-100" : "text-neutral-300"
    }`;

  const boldEnabled = canToggle(state.bold, state.hasSelection);
  const italicEnabled = canToggle(state.italic, state.hasSelection);
  const strikeEnabled = canToggle(state.strike, state.hasSelection);
  const codeEnabled = canToggle(state.code, state.hasSelection);
  const linkEnabled = canToggle(state.link, state.hasSelection);

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/60 p-1.5">
      <button
        className={buttonClass(state.bold)}
        title={boldEnabled ? "Bold (Ctrl+B) — applies to the selected text" : "Select text first"}
        disabled={!boldEnabled}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </button>
      <button
        className={buttonClass(state.italic)}
        title={italicEnabled ? "Italic (Ctrl+I) — applies to the selected text" : "Select text first"}
        disabled={!italicEnabled}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </button>
      <button
        className={buttonClass(state.strike)}
        title={strikeEnabled ? "Strikethrough — applies to the selected text" : "Select text first"}
        disabled={!strikeEnabled}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <span className="line-through">S</span>
      </button>
      <button
        className={buttonClass(state.code)}
        title={codeEnabled ? "Inline code — applies to the selected text" : "Select text first"}
        disabled={!codeEnabled}
        onClick={() => editor.chain().focus().toggleCode().run()}
      >
        {"</>"}
      </button>
      <span className="mx-1 h-4 w-px bg-neutral-700" />
      <button
        className={buttonClass(state.bulletList)}
        title="Bullet list (Ctrl+Shift+8)"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        • List
      </button>
      <button
        className={buttonClass(state.orderedList)}
        title="Numbered list (Ctrl+Shift+7)"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1. List
      </button>
      <button
        className={buttonClass(state.blockquote)}
        title="Blockquote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        " Quote
      </button>
      <span className="mx-1 h-4 w-px bg-neutral-700" />
      <button
        className={buttonClass(state.link)}
        title={linkEnabled ? "Link — applies to the selected text" : "Select text first"}
        disabled={!linkEnabled}
        onClick={onLinkClick}
      >
        🔗 Link
      </button>
    </div>
  );
}
