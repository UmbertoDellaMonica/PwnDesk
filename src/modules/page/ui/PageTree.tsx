import { useState } from "react";
import { Link } from "react-router-dom";
import type { Page } from "../page.types";
import type { MovePageInput } from "../usePages";

interface PageTreeProps {
  pages: Page[];
  projectId: string;
  activePageId?: string;
  onDelete: (pageId: string) => void;
  onMove: (input: MovePageInput) => void;
}

function buildChildrenMap(pages: Page[]): Map<string | null, Page[]> {
  const map = new Map<string | null, Page[]>();
  for (const page of pages) {
    const key = page.parentId;
    const siblings = map.get(key) ?? [];
    siblings.push(page);
    map.set(key, siblings);
  }
  return map;
}

type DropZone = "before" | "after" | "inside";

function PageTreeLevel({
  parentId,
  childrenMap,
  projectId,
  activePageId,
  onDelete,
  onMove,
  draggedId,
  setDraggedId,
  depth,
}: {
  parentId: string | null;
  childrenMap: Map<string | null, Page[]>;
  projectId: string;
  activePageId?: string;
  onDelete: (pageId: string) => void;
  onMove: (input: MovePageInput) => void;
  draggedId: string | null;
  setDraggedId: (id: string | null) => void;
  depth: number;
}) {
  const children = childrenMap.get(parentId) ?? [];
  const [dropZone, setDropZone] = useState<{ pageId: string; zone: DropZone } | null>(null);
  if (children.length === 0) return null;

  return (
    <ul className="space-y-1" style={{ marginLeft: depth > 0 ? 16 : 0 }}>
      {children.map((page) => {
        const isActive = page.id === activePageId;
        const isDragged = page.id === draggedId;
        const activeDropZone = dropZone?.pageId === page.id ? dropZone.zone : null;

        return (
          <li key={page.id}>
            <div
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", page.id);
                event.dataTransfer.effectAllowed = "move";
                setDraggedId(page.id);
              }}
              onDragEnd={() => {
                setDraggedId(null);
                setDropZone(null);
              }}
              onDragOver={(event) => {
                if (!draggedId || draggedId === page.id) return;
                event.preventDefault();
                const rect = event.currentTarget.getBoundingClientRect();
                const relY = (event.clientY - rect.top) / rect.height;
                const zone: DropZone = relY < 0.25 ? "before" : relY > 0.75 ? "after" : "inside";
                setDropZone({ pageId: page.id, zone });
              }}
              onDragLeave={() => setDropZone((current) => (current?.pageId === page.id ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                const sourceId = event.dataTransfer.getData("text/plain");
                setDropZone(null);
                setDraggedId(null);
                if (!sourceId || sourceId === page.id) return;
                onMove({ pageId: sourceId, targetId: page.id, position: activeDropZone ?? "after" });
              }}
              className={`group flex items-center justify-between rounded-md px-2 py-1.5 ${
                isActive ? "bg-emerald-900/40" : "bg-neutral-800/60"
              } ${isDragged ? "opacity-40" : ""} ${
                activeDropZone === "inside" ? "ring-1 ring-emerald-500" : ""
              } ${activeDropZone === "before" ? "border-t-2 border-emerald-500" : ""} ${
                activeDropZone === "after" ? "border-b-2 border-emerald-500" : ""
              }`}
            >
              <Link
                to={`/projects/${projectId}/pages/${page.id}`}
                className={`flex-1 truncate text-sm ${
                  isActive
                    ? "text-emerald-300 font-medium"
                    : "text-neutral-300 hover:text-neutral-100"
                }`}
              >
                {page.title}
              </Link>
              <button
                className="text-xs text-neutral-500 opacity-0 group-hover:opacity-100 hover:text-red-400"
                onClick={() => onDelete(page.id)}
                title="Delete page"
              >
                ✕
              </button>
            </div>
            <PageTreeLevel
              parentId={page.id}
              childrenMap={childrenMap}
              projectId={projectId}
              activePageId={activePageId}
              onDelete={onDelete}
              onMove={onMove}
              draggedId={draggedId}
              setDraggedId={setDraggedId}
              depth={depth + 1}
            />
          </li>
        );
      })}
    </ul>
  );
}

export function PageTree({ pages, projectId, activePageId, onDelete, onMove }: PageTreeProps) {
  const childrenMap = buildChildrenMap(pages);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  return (
    <PageTreeLevel
      parentId={null}
      childrenMap={childrenMap}
      projectId={projectId}
      activePageId={activePageId}
      onDelete={onDelete}
      onMove={onMove}
      draggedId={draggedId}
      setDraggedId={setDraggedId}
      depth={0}
    />
  );
}
