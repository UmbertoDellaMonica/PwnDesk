import { Node, mergeAttributes, type Editor } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { EvidenceChip } from "../nodes/EvidenceChip";

export const EvidenceRef = Node.create({
  name: "evidenceRef",
  group: "inline",
  inline: true,
  atom: true,

  addAttributes() {
    return {
      id: { default: null },
      targetType: { default: "evidence" },
      caption: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-evidence-ref]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["span", mergeAttributes(HTMLAttributes, { "data-evidence-ref": "" })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(EvidenceChip);
  },
});

export function insertEvidenceRef(editor: Editor, evidenceId: string): void {
  editor
    .chain()
    .focus()
    .insertContent({ type: "evidenceRef", attrs: { id: evidenceId, targetType: "evidence" } })
    .run();
}
