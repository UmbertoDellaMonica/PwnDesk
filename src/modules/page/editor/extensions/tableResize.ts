import type { Editor } from "@tiptap/react";
import {
  addColumn,
  addRow,
  findTable,
  removeColumn,
  removeRow,
  TableMap,
  type TableRect,
} from "@tiptap/pm/tables";
import type { EditorView } from "@tiptap/pm/view";

export interface TableDimensions {
  rows: number;
  cols: number;
}

function getRect(view: EditorView): TableRect | null {
  const found = findTable(view.state.selection.$anchor);
  if (!found) return null;
  const map = TableMap.get(found.node);
  // addRow/removeRow/addColumn/removeColumn only read map/tableStart/table;
  // left/top/right/bottom are only present to satisfy TableRect's shape.
  return { left: 0, top: 0, right: map.width, bottom: map.height, map, tableStart: found.start, table: found.node };
}

/** Reads the dimensions of the table the current selection is inside, or null if not in a table. */
export function getTableDimensions(editor: Editor): TableDimensions | null {
  const rect = getRect(editor.view);
  if (!rect) return null;
  return { rows: rect.map.height, cols: rect.map.width };
}

/**
 * Grows/shrinks the current table to exactly `targetRows`/`targetCols`, one
 * row/column at a time, re-reading the table after each step since row/column
 * positions shift as the doc changes. Dispatched as separate transactions
 * (rather than one big one) because the rect must be recomputed against the
 * current doc after every insert/removal.
 */
export function resizeTable(editor: Editor, targetRows: number, targetCols: number): void {
  const { view } = editor;
  const wantedRows = Math.max(1, targetRows);
  const wantedCols = Math.max(1, targetCols);

  let rect = getRect(view);
  while (rect && rect.map.height < wantedRows) {
    view.dispatch(addRow(view.state.tr, rect, rect.map.height));
    rect = getRect(view);
  }
  while (rect && rect.map.height > wantedRows) {
    const tr = view.state.tr;
    removeRow(tr, rect, rect.map.height - 1);
    view.dispatch(tr);
    rect = getRect(view);
  }

  rect = getRect(view);
  while (rect && rect.map.width < wantedCols) {
    view.dispatch(addColumn(view.state.tr, rect, rect.map.width));
    rect = getRect(view);
  }
  while (rect && rect.map.width > wantedCols) {
    const tr = view.state.tr;
    removeColumn(tr, rect, rect.map.width - 1);
    view.dispatch(tr);
    rect = getRect(view);
  }
}
