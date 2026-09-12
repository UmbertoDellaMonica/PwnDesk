import type { Evidence } from "../evidence/evidence.types";
import type { Asset, Finding } from "../finding/finding.types";
import { extractLinkTargets } from "../page/page.utils";
import type { Page } from "../page/page.types";

export type GraphNodeType = "page" | "finding" | "evidence" | "asset";

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  severity?: Finding["severity"];
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildProjectGraph(
  pages: Page[],
  findings: Finding[],
  assets: Asset[],
  evidenceList: Evidence[],
  findingEvidenceLinks: { findingId: string; evidenceId: string }[],
  findingAssetLinks: { findingId: string; assetId: string }[],
): GraphData {
  const edges: GraphEdge[] = [];
  const referencedEvidenceIds = new Set<string>();
  const referencedAssetIds = new Set<string>();

  const livePages = pages.filter((page) => !page.isDeleted);

  for (const page of livePages) {
    for (const target of extractLinkTargets(page.blocks)) {
      if (
        target.targetType === "page" ||
        target.targetType === "evidence" ||
        target.targetType === "finding" ||
        target.targetType === "asset"
      ) {
        edges.push({ source: page.id, target: target.targetId });
        if (target.targetType === "evidence") referencedEvidenceIds.add(target.targetId);
        if (target.targetType === "asset") referencedAssetIds.add(target.targetId);
      }
    }
  }

  for (const link of findingEvidenceLinks) {
    edges.push({ source: link.findingId, target: link.evidenceId });
    referencedEvidenceIds.add(link.evidenceId);
  }

  for (const link of findingAssetLinks) {
    edges.push({ source: link.findingId, target: link.assetId });
    referencedAssetIds.add(link.assetId);
  }

  const nodes: GraphNode[] = [
    ...livePages.map((page): GraphNode => ({ id: page.id, type: "page", label: page.title })),
    ...findings.map((finding): GraphNode => ({
      id: finding.id,
      type: "finding",
      label: finding.title,
      severity: finding.severity,
    })),
    ...evidenceList
      .filter((evidence) => referencedEvidenceIds.has(evidence.id) && !evidence.isDeleted)
      .map((evidence): GraphNode => ({
        id: evidence.id,
        type: "evidence",
        label: evidence.originalName ?? evidence.sha256.slice(0, 8),
      })),
    ...assets
      .filter((asset) => referencedAssetIds.has(asset.id))
      .map((asset): GraphNode => ({ id: asset.id, type: "asset", label: asset.name })),
  ];

  // Only keep edges where both endpoints are actually rendered nodes
  // (e.g. a link to a since-deleted page/finding shouldn't dangle).
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  return { nodes, edges: validEdges };
}
