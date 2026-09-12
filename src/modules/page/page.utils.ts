import type { JsonValue } from "../../shared/types";
import type { LinkTarget } from "./page_link.repository";
import type { Page } from "./page.types";

const REFERENCE_NODE_TYPES = new Set(["mention", "evidenceRef"]);

export function extractLinkTargets(blocks: JsonValue): LinkTarget[] {
  const targets: LinkTarget[] = [];
  const seen = new Set<string>();

  function walk(node: JsonValue): void {
    if (typeof node !== "object" || node === null || Array.isArray(node)) return;

    const type = node.type;
    const attrs = node.attrs;
    const hasAttrs = typeof attrs === "object" && attrs !== null && !Array.isArray(attrs);

    const addTarget = (targetType: string, targetId: string) => {
      const key = `${targetType}:${targetId}`;
      if (!seen.has(key)) {
        seen.add(key);
        targets.push({ targetType, targetId });
      }
    };

    if (
      typeof type === "string" &&
      REFERENCE_NODE_TYPES.has(type) &&
      hasAttrs &&
      typeof attrs.id === "string" &&
      typeof attrs.targetType === "string"
    ) {
      addTarget(attrs.targetType, attrs.id);
    }

    // vulnNote carries its own list of linked evidence, plus an optional
    // promoted Finding — surface both so backlinks/the graph see them too.
    if (type === "vulnNote" && hasAttrs) {
      const evidenceIds = attrs.evidenceIds;
      if (Array.isArray(evidenceIds)) {
        for (const evidenceId of evidenceIds) {
          if (typeof evidenceId === "string") addTarget("evidence", evidenceId);
        }
      }
      if (typeof attrs.promotedFindingId === "string") {
        addTarget("finding", attrs.promotedFindingId);
      }
    }

    const content = node.content;
    if (Array.isArray(content)) {
      for (const child of content) {
        walk(child);
      }
    }
  }

  walk(blocks);
  return targets;
}

/** Client-side reverse lookup: which pages reference a given entity (e.g. an evidence id) — used for "Referenced in" panels without a DB round-trip, since usePages(entry) already loads full block content. */
export function findPagesReferencingTarget(
  pages: Page[],
  targetType: string,
  targetId: string,
): Page[] {
  return pages.filter(
    (page) =>
      !page.isDeleted &&
      extractLinkTargets(page.blocks).some(
        (target) => target.targetType === targetType && target.targetId === targetId,
      ),
  );
}
