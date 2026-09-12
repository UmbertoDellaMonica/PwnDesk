import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { getTableDimensions, resizeTable } from "./tableResize";

interface TableToolbarProps {
  editor: Editor | null;
}

const MAX_DIMENSION = 30;

/**
 * Tiptap's table extension only exposes commands (addRowAfter, deleteColumn,
 * etc.) — there's no built-in UI for them. This renders a small contextual
 * bar whenever the cursor is inside a table: quick +/- buttons, plus number
 * inputs that resize the table live to an exact row/column count.
 */
export function TableToolbar({ editor }: TableToolbarProps) {
  const dimensions = useEditorState({
    editor,
    selector: ({ editor: currentEditor }) =>
      currentEditor?.isActive("table") ? getTableDimensions(currentEditor) : null,
  });

  if (!editor || !dimensions) return null;

  const buttonClass =
    "rounded px-2 py-1 text-xs text-neutral-300 hover:bg-neutral-700 disabled:opacity-40";

  return (
    <div className="mb-2 flex flex-wrap items-center gap-1 rounded-md border border-neutral-800 bg-neutral-900/60 p-1.5">
      <span className="px-1 text-xs text-neutral-500">Table:</span>

      <label className="flex items-center gap-1 text-xs text-neutral-400">
        Rows
        <input
          type="number"
          min={1}
          max={MAX_DIMENSION}
          value={dimensions.rows}
          onChange={(event) => {
            const next = Math.min(MAX_DIMENSION, Math.max(1, Number(event.target.value) || 1));
            resizeTable(editor, next, dimensions.cols);
          }}
          className="w-14 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-xs text-neutral-100"
        />
      </label>
      <label className="flex items-center gap-1 text-xs text-neutral-400">
        Cols
        <input
          type="number"
          min={1}
          max={MAX_DIMENSION}
          value={dimensions.cols}
          onChange={(event) => {
            const next = Math.min(MAX_DIMENSION, Math.max(1, Number(event.target.value) || 1));
            resizeTable(editor, dimensions.rows, next);
          }}
          className="w-14 rounded border border-neutral-700 bg-neutral-800 px-1 py-0.5 text-xs text-neutral-100"
        />
      </label>

      <span className="mx-1 h-4 w-px bg-neutral-700" />
      <button
        className={buttonClass}
        onClick={() => resizeTable(editor, dimensions.rows + 1, dimensions.cols)}
      >
        + Row
      </button>
      <button
        className={buttonClass}
        onClick={() => resizeTable(editor, dimensions.rows - 1, dimensions.cols)}
      >
        − Row
      </button>
      <button
        className={buttonClass}
        onClick={() => resizeTable(editor, dimensions.rows, dimensions.cols + 1)}
      >
        + Col
      </button>
      <button
        className={buttonClass}
        onClick={() => resizeTable(editor, dimensions.rows, dimensions.cols - 1)}
      >
        − Col
      </button>
      <span className="mx-1 h-4 w-px bg-neutral-700" />
      <button
        className={buttonClass}
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
      >
        Toggle header row
      </button>
      <button className={buttonClass} onClick={() => editor.chain().focus().mergeOrSplit().run()}>
        Merge/split cells
      </button>
      <button
        className={`${buttonClass} ml-auto text-red-400`}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        Delete table
      </button>
    </div>
  );
}
