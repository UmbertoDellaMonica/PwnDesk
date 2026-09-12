import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { buildProjectGraph } from "../../modules/graph/graph";
import { GraphView } from "../../modules/graph/ui/GraphView";
import { useAllFindingAssetLinks, useAllFindingEvidenceLinks, useAssets, useFindings } from "../../modules/finding/useFindings";
import { usePages } from "../../modules/page/usePages";
import { useProjects } from "../../modules/project/useProjects";
import { useEvidenceList } from "../../modules/evidence/useEvidence";

export function GraphPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: pages } = usePages(entry);
  const { data: findings } = useFindings(entry);
  const { data: assets } = useAssets(entry);
  const { data: evidenceList } = useEvidenceList(entry);
  const { data: findingEvidenceLinks } = useAllFindingEvidenceLinks(entry);
  const { data: findingAssetLinks } = useAllFindingAssetLinks(entry);

  const graph = useMemo(
    () =>
      buildProjectGraph(
        pages ?? [],
        findings ?? [],
        assets ?? [],
        evidenceList ?? [],
        findingEvidenceLinks ?? [],
        findingAssetLinks ?? [],
      ),
    [pages, findings, assets, evidenceList, findingEvidenceLinks, findingAssetLinks],
  );

  if (!entry) {
    return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="mb-1 text-xl font-semibold text-neutral-100">Graph</h1>
      <p className="mb-4 text-sm text-neutral-500">
        How your pages, evidence, and findings connect — via mentions, evidence links, and
        vulnerability notes.
      </p>
      <GraphView
        data={graph}
        onNodeClick={(node) => {
          if (node.type === "page") navigate(`/projects/${entry.id}/pages/${node.id}`);
          if (node.type === "finding") navigate(`/projects/${entry.id}/findings/${node.id}`);
          if (node.type === "evidence") navigate(`/projects/${entry.id}/evidence?preview=${node.id}`);
          if (node.type === "asset") navigate(`/projects/${entry.id}/assets/${node.id}`);
        }}
      />
    </div>
  );
}
