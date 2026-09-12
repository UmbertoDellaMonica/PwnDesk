import { createHashRouter } from "react-router-dom";
import { AppShell } from "./AppShell";
import { AssetDetailPage } from "./pages/AssetDetailPage";
import { AssetsListPage } from "./pages/AssetsListPage";
import { EmptyState } from "./pages/EmptyState";
import { EvidenceGalleryPage } from "./pages/EvidenceGalleryPage";
import { FindingDetailPage } from "./pages/FindingDetailPage";
import { FindingsListPage } from "./pages/FindingsListPage";
import { GraphPage } from "./pages/GraphPage";
import { PageView } from "./pages/PageView";
import { ProjectHome } from "./pages/ProjectHome";

export const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <EmptyState /> },
      { path: "projects/:projectId", element: <ProjectHome /> },
      { path: "projects/:projectId/pages/:pageId", element: <PageView /> },
      { path: "projects/:projectId/evidence", element: <EvidenceGalleryPage /> },
      { path: "projects/:projectId/findings", element: <FindingsListPage /> },
      { path: "projects/:projectId/findings/:findingId", element: <FindingDetailPage /> },
      { path: "projects/:projectId/assets", element: <AssetsListPage /> },
      { path: "projects/:projectId/assets/:assetId", element: <AssetDetailPage /> },
      { path: "projects/:projectId/graph", element: <GraphPage /> },
    ],
  },
]);
