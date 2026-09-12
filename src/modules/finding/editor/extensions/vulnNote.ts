import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { VulnNoteBlock } from "../nodes/VulnNoteBlock";

export const VulnNote = Node.create({
  name: "vulnNote",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      title: { default: "" },
      cwe: { default: null },
      cvssVector: { default: null },
      cvssScore: { default: null },
      severity: { default: null },
      description: { default: "" },
      reproduction: { default: "" },
      evidenceIds: { default: [] as string[] },
      evidenceCaptions: { default: {} as Record<string, string> },
      promotedFindingId: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-vuln-note]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-vuln-note": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VulnNoteBlock);
  },
});

export function insertVulnNote(editor: Editor): void {
  editor.chain().focus().insertContent({ type: "vulnNote" }).run();
}
