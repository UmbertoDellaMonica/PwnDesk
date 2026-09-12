import type { CatalogEntry } from "../../workspace/workspace.types";

interface ProjectListItemProps {
  entry: CatalogEntry;
  active: boolean;
  onOpen: () => void;
  onDelete: () => void;
}

export function ProjectListItem({ entry, active, onOpen, onDelete }: ProjectListItemProps) {
  return (
    <div
      className={`group flex items-center justify-between rounded-md px-2 py-1.5 cursor-pointer text-sm ${
        active ? "bg-neutral-800 text-neutral-100" : "text-neutral-400 hover:bg-neutral-800/60"
      }`}
      onClick={onOpen}
    >
      <span className="truncate">{entry.name}</span>
      <button
        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 text-xs px-1"
        onClick={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        title="Delete project"
      >
        ✕
      </button>
    </div>
  );
}
