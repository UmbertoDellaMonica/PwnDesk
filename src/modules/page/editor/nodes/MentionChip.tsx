import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { useAssetLookupStore } from "../../../finding/assetLookupStore";
import { useFindingLookupStore } from "../../../finding/findingLookupStore";
import { usePageLookupStore } from "../pageLookupStore";

function PageMentionChip({ id, fallbackLabel }: { id: string; fallbackLabel: string }) {
  const projectId = usePageLookupStore((state) => state.projectId);
  const entry = usePageLookupStore((state) => state.pagesById[id]);

  const missing = !entry;
  const deleted = entry?.isDeleted ?? false;
  const label = entry?.title ?? fallbackLabel;

  const handleClick = () => {
    if (!projectId || missing || deleted) return;
    window.location.hash = `#/projects/${projectId}/pages/${id}`;
  };

  return (
    <span
      onClick={handleClick}
      className={`rounded px-1 py-0.5 text-sm ${
        missing || deleted
          ? "bg-neutral-800 text-neutral-500 line-through cursor-default"
          : "bg-emerald-900/40 text-emerald-300 cursor-pointer hover:bg-emerald-900/60"
      }`}
      title={missing ? "Page not found" : deleted ? "Page deleted" : undefined}
    >
      @{label}
    </span>
  );
}

function FindingMentionChip({ id, fallbackLabel }: { id: string; fallbackLabel: string }) {
  const projectId = useFindingLookupStore((state) => state.projectId);
  const entry = useFindingLookupStore((state) => state.findingsById[id]);

  const missing = !entry;
  const label = entry ? (entry.displayId ? `${entry.displayId} ${entry.title}` : entry.title) : fallbackLabel;

  const handleClick = () => {
    if (!projectId || missing) return;
    window.location.hash = `#/projects/${projectId}/findings/${id}`;
  };

  return (
    <span
      onClick={handleClick}
      className={`rounded px-1 py-0.5 text-sm ${
        missing
          ? "bg-neutral-800 text-neutral-500 line-through cursor-default"
          : "bg-amber-900/40 text-amber-300 cursor-pointer hover:bg-amber-900/60"
      }`}
      title={missing ? "Finding not found" : undefined}
    >
      🐞@{label}
    </span>
  );
}

function AssetMentionChip({ id, fallbackLabel }: { id: string; fallbackLabel: string }) {
  const entry = useAssetLookupStore((state) => state.assetsById[id]);

  const missing = !entry;
  const label = entry ? entry.name : fallbackLabel;

  return (
    <span
      className={`rounded px-1 py-0.5 text-sm ${
        missing
          ? "bg-neutral-800 text-neutral-500 line-through cursor-default"
          : "bg-sky-900/40 text-sky-300 cursor-default"
      }`}
      title={missing ? "Asset not found" : entry.assetType}
    >
      🎯@{label}
    </span>
  );
}

export function MentionChip({ node }: NodeViewProps) {
  const id = node.attrs.id as string;
  const fallbackLabel = (node.attrs.label as string | null) ?? id;
  const targetType = (node.attrs.targetType as string) ?? "page";

  return (
    <NodeViewWrapper as="span" className="inline">
      {targetType === "finding" ? (
        <FindingMentionChip id={id} fallbackLabel={fallbackLabel} />
      ) : targetType === "asset" ? (
        <AssetMentionChip id={id} fallbackLabel={fallbackLabel} />
      ) : (
        <PageMentionChip id={id} fallbackLabel={fallbackLabel} />
      )}
    </NodeViewWrapper>
  );
}
