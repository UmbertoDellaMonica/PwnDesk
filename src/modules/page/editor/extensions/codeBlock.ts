import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { common, createLowlight } from "lowlight";
import powershell from "highlight.js/lib/languages/powershell";
import { CodeBlockView } from "../nodes/CodeBlockView";

export const lowlight = createLowlight(common);
// Not part of lowlight's "common" bundle, but common enough in a pentest
// context (Windows post-exploitation) to be worth registering explicitly.
lowlight.register({ powershell });

export const CODE_LANGUAGES: { value: string; label: string }[] = [
  { value: "plaintext", label: "Plain text" },
  { value: "bash", label: "Bash" },
  { value: "shell", label: "Shell" },
  { value: "powershell", label: "PowerShell" },
  { value: "python", label: "Python" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "java", label: "Java" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "sql", label: "SQL" },
  { value: "yaml", label: "YAML" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML / HTML" },
  { value: "ini", label: "INI / Config" },
  { value: "diff", label: "Diff" },
  { value: "markdown", label: "Markdown" },
];

export const CodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockView);
  },
});
