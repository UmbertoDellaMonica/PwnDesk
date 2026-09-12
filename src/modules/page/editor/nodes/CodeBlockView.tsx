import { NodeViewContent, NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { CODE_LANGUAGES } from "../extensions/codeBlock";

export function CodeBlockView({ node, updateAttributes }: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? "plaintext";

  return (
    <NodeViewWrapper className="relative my-2">
      <select
        // contentEditable="false" is implicit for NodeViewWrapper children
        // outside NodeViewContent, but the select itself still needs to stay
        // out of the ProseMirror content flow so typing in the code below
        // doesn't get intercepted by it.
        contentEditable={false}
        value={CODE_LANGUAGES.some((entry) => entry.value === language) ? language : "plaintext"}
        onChange={(event) => updateAttributes({ language: event.target.value })}
        className="absolute right-2 top-2 z-10 rounded border border-neutral-700 bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-300 focus:outline-none"
      >
        {CODE_LANGUAGES.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </select>
      <pre>
        <NodeViewContent<"code"> as="code" />
      </pre>
    </NodeViewWrapper>
  );
}
