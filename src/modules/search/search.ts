import type { Asset, Finding } from "../finding/finding.types";
import type { Evidence } from "../evidence/evidence.types";
import type { Page } from "../page/page.types";
import type { JsonValue } from "../../shared/types";

function walkText(node: JsonValue, out: string[]): void {
  if (typeof node !== "object" || node === null || Array.isArray(node)) return;

  if (typeof node.text === "string") out.push(node.text);

  if (
    node.type === "vulnNote" &&
    typeof node.attrs === "object" &&
    node.attrs !== null &&
    !Array.isArray(node.attrs)
  ) {
    const attrs = node.attrs as Record<string, JsonValue>;
    if (typeof attrs.title === "string") out.push(attrs.title);
    if (typeof attrs.cwe === "string") out.push(attrs.cwe);
    if (typeof attrs.description === "string") out.push(attrs.description);
    if (typeof attrs.reproduction === "string") out.push(attrs.reproduction);
  }

  if (
    node.type === "evidenceRef" &&
    typeof node.attrs === "object" &&
    node.attrs !== null &&
    !Array.isArray(node.attrs)
  ) {
    const attrs = node.attrs as Record<string, JsonValue>;
    if (typeof attrs.caption === "string") out.push(attrs.caption);
  }

  const content = node.content;
  if (Array.isArray(content)) {
    for (const child of content) walkText(child, out);
  }
}

export function extractPageText(page: Page): string {
  const parts: string[] = [page.title];
  walkText(page.blocks, parts);
  return parts.join(" ");
}

export interface SearchResult {
  kind: "page" | "finding" | "evidence" | "asset";
  id: string;
  title: string;
  snippet: string;
}

function makeSnippet(text: string, query: string, radius = 40): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, radius * 2).trim();
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + query.length + radius);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

export function searchProject(
  pages: Page[],
  findings: Finding[],
  query: string,
  evidenceList: Evidence[] = [],
  assets: Asset[] = [],
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: SearchResult[] = [];

  for (const page of pages) {
    if (page.isDeleted) continue;
    const text = extractPageText(page);
    if (text.toLowerCase().includes(q)) {
      results.push({ kind: "page", id: page.id, title: page.title, snippet: makeSnippet(text, q) });
    }
  }

  for (const finding of findings) {
    const text = [finding.title, finding.data.category, finding.data.description]
      .filter((value): value is string => typeof value === "string")
      .join(" ");
    if (text.toLowerCase().includes(q)) {
      results.push({
        kind: "finding",
        id: finding.id,
        title: finding.title,
        snippet: makeSnippet(text, q),
      });
    }
  }

  for (const evidence of evidenceList) {
    if (evidence.isDeleted) continue;
    const title = evidence.originalName ?? evidence.sha256.slice(0, 12);
    if (title.toLowerCase().includes(q) || evidence.mimeType.toLowerCase().includes(q)) {
      results.push({
        kind: "evidence",
        id: evidence.id,
        title,
        snippet: evidence.mimeType,
      });
    }
  }

  for (const asset of assets) {
    const text = `${asset.name} ${asset.assetType}`;
    if (text.toLowerCase().includes(q)) {
      results.push({
        kind: "asset",
        id: asset.id,
        title: asset.name,
        snippet: asset.assetType,
      });
    }
  }

  return results;
}
