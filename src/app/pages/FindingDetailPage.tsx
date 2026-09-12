import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Cvss31CalculatorModal } from "../../modules/cvss/Cvss31CalculatorModal";
import { FindingAssetsPanel } from "../../modules/finding/ui/FindingAssetsPanel";
import { FindingEvidencePanel } from "../../modules/finding/ui/FindingEvidencePanel";
import type { FindingStatus } from "../../modules/finding/finding.types";
import { useDeleteFinding, useFinding, useUpdateFinding } from "../../modules/finding/useFindings";
import { findPagesReferencingTarget } from "../../modules/page/page.utils";
import { usePages } from "../../modules/page/usePages";
import { useProjects } from "../../modules/project/useProjects";
import { CweCategoryPicker } from "../../modules/finding/ui/CweCategoryPicker";
import { Button } from "../../shared/ui/Button";
import { SeverityBadge } from "../../shared/ui/Badge";
import { ConfirmDialog } from "../../shared/ui/ConfirmDialog";
import { Input } from "../../shared/ui/Input";
import { Textarea } from "../../shared/ui/Textarea";
import { showToast } from "../../shared/ui/toastStore";

const STATUSES: FindingStatus[] = [
  "draft",
  "validated",
  "reported",
  "remediated",
  "retested",
  "closed",
];

const TEXT_FIELDS: { key: "description" | "rootCause" | "impact" | "reproduction" | "remediation" | "references"; label: string }[] = [
  { key: "description", label: "Description" },
  { key: "rootCause", label: "Root cause" },
  { key: "impact", label: "Impact" },
  { key: "reproduction", label: "Reproduction steps" },
  { key: "remediation", label: "Remediation" },
  { key: "references", label: "References" },
];

export function FindingDetailPage() {
  const { projectId, findingId } = useParams<{ projectId: string; findingId: string }>();
  const navigate = useNavigate();

  const { data: projects } = useProjects();
  const entry = projects?.find((project) => project.id === projectId) ?? null;

  const { data: finding, isLoading } = useFinding(entry, findingId);
  const { data: pages } = usePages(entry);
  const updateFinding = useUpdateFinding(entry);
  const deleteFinding = useDeleteFinding(entry);

  const [titleDraft, setTitleDraft] = useState("");
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string>>({});
  const [showCvssCalculator, setShowCvssCalculator] = useState(false);
  const [showCwePicker, setShowCwePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setTitleDraft(finding?.title ?? "");
    setFieldDrafts((finding?.data as Record<string, string> | undefined) ?? {});
  }, [finding?.id]);

  if (!entry) return <div className="p-6 text-sm text-neutral-400">Project not found.</div>;
  if (isLoading) return <div className="p-6 text-sm text-neutral-500">Loading…</div>;
  if (!finding || !findingId) {
    return <div className="p-6 text-sm text-neutral-400">Finding not found.</div>;
  }

  const commitTitle = () => {
    const nextTitle = titleDraft.trim() || "Untitled finding";
    if (nextTitle !== finding.title) {
      updateFinding.mutate({ findingId, patch: { title: nextTitle } });
    }
  };

  const commitField = (key: string) => {
    if (fieldDrafts[key] === (finding.data[key] ?? "")) return;
    updateFinding.mutate({
      findingId,
      patch: { data: { ...finding.data, [key]: fieldDrafts[key] } },
    });
  };

  const handleDelete = async () => {
    await deleteFinding.mutateAsync(findingId);
    showToast(`Deleted finding "${finding.title}"`);
    navigate(`/projects/${entry.id}/findings`);
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <button
          className="text-xs text-neutral-500 hover:text-neutral-300"
          onClick={() => navigate(`/projects/${entry.id}/findings`)}
        >
          ← Back to findings
        </button>
        <span className="text-xs text-neutral-500">
          {updateFinding.isPending && "Saving…"}
          {updateFinding.isSuccess && !updateFinding.isPending && (
            <span className="text-emerald-500">Saved</span>
          )}
        </span>
      </div>

      <input
        value={titleDraft}
        onChange={(event) => setTitleDraft(event.target.value)}
        onBlur={commitTitle}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commitTitle();
          }
        }}
        className="w-full bg-transparent text-2xl font-semibold text-neutral-100 focus:outline-none"
        placeholder="Untitled finding"
      />

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Display ID</label>
          <Input value={finding.displayId ?? "—"} disabled className="w-28" />
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Status</label>
          <select
            value={finding.status}
            onChange={(event) =>
              updateFinding.mutate({
                findingId,
                patch: { status: event.target.value as FindingStatus },
              })
            }
            className="bg-neutral-800 border border-neutral-700 rounded-md px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Severity (CVSS 3.1)</label>
          <div className="flex items-center gap-2">
            {finding.severity ? (
              <>
                <SeverityBadge severity={finding.severity} />
                <span className="text-sm font-semibold text-neutral-100">
                  {finding.cvssScore?.toFixed(1)}
                </span>
                <span className="font-mono text-xs text-neutral-500">{finding.cvssVector}</span>
              </>
            ) : (
              <span className="text-xs text-neutral-500">Not assessed</span>
            )}
            <Button
              variant="secondary"
              className="text-xs"
              onClick={() => setShowCvssCalculator(true)}
            >
              Assess (CVSS 3.1)
            </Button>
          </div>
        </div>
      </div>

      <Cvss31CalculatorModal
        open={showCvssCalculator}
        initialVector={finding.cvssVector}
        onClose={() => setShowCvssCalculator(false)}
        onSave={(result) =>
          updateFinding.mutate({
            findingId,
            patch: {
              cvssVector: result.vector,
              cvssScore: result.score,
              severity: result.severity,
            },
          })
        }
      />

      <div>
        <label className="block text-xs text-neutral-400 mb-1">Category (CWE / OWASP / custom)</label>
        <div className="flex items-center gap-2">
          <span className="flex-1 rounded-md border border-neutral-700 bg-neutral-800/60 px-3 py-2 text-sm text-neutral-200">
            {finding.data.category || <span className="text-neutral-500">Not set</span>}
          </span>
          <Button variant="secondary" className="text-xs" onClick={() => setShowCwePicker(true)}>
            Select…
          </Button>
        </div>
      </div>

      <CweCategoryPicker
        open={showCwePicker}
        onSelect={(category) => {
          updateFinding.mutate({ findingId, patch: { data: { ...finding.data, category } } });
          setShowCwePicker(false);
        }}
        onClose={() => setShowCwePicker(false)}
      />

      <div className="space-y-4">
        {TEXT_FIELDS.map(({ key, label }) => (
          <div key={key}>
            <label className="block text-xs text-neutral-400 mb-1">{label}</label>
            <Textarea
              rows={key === "description" ? 4 : 3}
              value={fieldDrafts[key] ?? ""}
              onChange={(event) =>
                setFieldDrafts((prev) => ({ ...prev, [key]: event.target.value }))
              }
              onBlur={() => commitField(key)}
            />
          </div>
        ))}
      </div>

      <FindingEvidencePanel entry={entry} findingId={findingId} />
      <FindingAssetsPanel entry={entry} findingId={findingId} />

      <div>
        <h2 className="mb-2 text-sm font-medium text-neutral-300">Referenced in pages</h2>
        {(() => {
          const referencingPages = findPagesReferencingTarget(pages ?? [], "finding", findingId);
          return referencingPages.length === 0 ? (
            <p className="text-xs text-neutral-500">
              Not mentioned in any page yet — type @{finding.displayId ?? finding.title} in a page to link it here.
            </p>
          ) : (
            <ul className="space-y-0.5">
              {referencingPages.map((page) => (
                <li key={page.id}>
                  <Link
                    to={`/projects/${entry.id}/pages/${page.id}`}
                    className="text-sm text-emerald-400 hover:text-emerald-300"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          );
        })()}
      </div>

      <div className="pt-4">
        <Button variant="danger" disabled={deleteFinding.isPending} onClick={() => setShowDeleteConfirm(true)}>
          {deleteFinding.isPending ? "Deleting…" : "Delete finding"}
        </Button>
      </div>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete finding"
        message={`This permanently deletes "${finding.title}" and its evidence/asset links (the evidence and assets themselves are not deleted). This cannot be undone.`}
        isPending={deleteFinding.isPending}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
