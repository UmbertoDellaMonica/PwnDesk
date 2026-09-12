import { Outlet } from "react-router-dom";
import { EvidenceLookupSync } from "../modules/evidence/EvidenceLookupSync";
import { FindingLookupSync } from "../modules/finding/FindingLookupSync";
import { PageTreeSidebar } from "../modules/page/ui/PageTreeSidebar";
import { ProjectSidebar } from "../modules/project/ui/ProjectSidebar";
import { ResizeHandle } from "../shared/ui/ResizeHandle";
import { ToastContainer } from "../shared/ui/ToastContainer";
import { COLLAPSED_RAIL_WIDTH, useLayoutStore } from "./layoutStore";

export function AppShell() {
  const projectSidebarCollapsed = useLayoutStore((state) => state.projectSidebarCollapsed);
  const projectSidebarWidth = useLayoutStore((state) => state.projectSidebarWidth);
  const pageTreeWidth = useLayoutStore((state) => state.pageTreeWidth);
  const setProjectSidebarWidth = useLayoutStore((state) => state.setProjectSidebarWidth);
  const setPageTreeWidth = useLayoutStore((state) => state.setPageTreeWidth);

  return (
    <div className="flex h-screen w-screen bg-neutral-900 text-neutral-100">
      <EvidenceLookupSync />
      <FindingLookupSync />

      <div
        style={{ width: projectSidebarCollapsed ? COLLAPSED_RAIL_WIDTH : projectSidebarWidth }}
        className="h-full shrink-0"
      >
        <ProjectSidebar />
      </div>
      {!projectSidebarCollapsed && (
        <ResizeHandle
          getValue={() => useLayoutStore.getState().projectSidebarWidth}
          onChange={setProjectSidebarWidth}
          onCommit={() => useLayoutStore.getState().persistLayout()}
        />
      )}

      <div style={{ width: pageTreeWidth }} className="h-full shrink-0">
        <PageTreeSidebar />
      </div>
      <ResizeHandle
        getValue={() => useLayoutStore.getState().pageTreeWidth}
        onChange={setPageTreeWidth}
        onCommit={() => useLayoutStore.getState().persistLayout()}
      />

      <main className="flex-1 min-w-0 overflow-y-auto">
        <Outlet />
      </main>
      <ToastContainer />
    </div>
  );
}
