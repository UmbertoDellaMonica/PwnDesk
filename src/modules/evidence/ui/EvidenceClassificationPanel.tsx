import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateFindingFromEvidence } from "../../finding/useFindings";
import { TEST_CATALOG } from "../../methodology/testCatalog";
import type { MethodologyId } from "../../project/methodology";
import { useProjectDetails } from "../../project/useProjects";
import type { CatalogEntry } from "../../workspace/workspace.types";
import { Button } from "../../../shared/ui/Button";
import { Textarea } from "../../../shared/ui/Textarea";
import type { Evidence } from "../evidence.types";
import { useUpdateEvidenceData } from "../useEvidence";

interface EvidenceClassificationPanelProps {
  entry: CatalogEntry;
  evidence: Evidence;
}

export function EvidenceClassificationPanel({ entry, evidence }: EvidenceClassificationPanelProps) {
  const { data: project } = useProjectDetails(entry);
  const updateEvidenceData = useUpdateEvidenceData(entry);
  const createFinding = useCreateFindingFromEvidence(entry);
  const navigate = useNavigate();

  const [flowDraft, setFlowDraft] = useState("");

  const methodologyId = (project?.data.methodologyId as MethodologyId | undefined) ?? "none";
  const testCases = TEST_CATALOG[methodologyId] ?? [];
  const selectedTestCaseId = (evidence.data.testCaseId as string | undefined) ?? "";
  const selectedTestCase = testCases.find((testCase) => testCase.id === selectedTestCaseId);

  if (testCases.length === 0) {
    return (
      <p className="text-xs text-neutral-500">
        No vulnerability catalog for this project's methodology.
      </p>
    );
  }

  const handleCreateFinding = async (vulnName: string, cwe?: string) => {
    const finding = await createFinding.mutateAsync({
      title: vulnName,
      category: cwe ?? "",
      reproductionHint: flowDraft.trim(),
      evidenceId: evidence.id,
    });
    navigate(`/projects/${entry.id}/findings/${finding.id}`);
  };

  return (
    <div className="space-y-3 border-t border-neutral-800 pt-3">
      <div>
        <label className="block text-xs text-neutral-400 mb-1">
          Test case executed ({methodologyId})
        </label>
        <select
          value={selectedTestCaseId}
          onChange={(event) =>
            updateEvidenceData.mutate({
              id: evidence.id,
              data: { ...evidence.data, testCaseId: event.target.value, methodologyId },
            })
          }
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-2 py-2 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
        >
          <option value="">— not classified —</option>
          {testCases.map((testCase) => (
            <option key={testCase.id} value={testCase.id}>
              {testCase.id} — {testCase.label}
            </option>
          ))}
        </select>
      </div>

      {selectedTestCase && (
        <div>
          <p className="mb-1 text-xs text-neutral-400">Presumed vulnerability</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {selectedTestCase.suggestedVulnerabilities.map((vuln) => (
              <span
                key={vuln.name}
                title={vuln.description}
                className="rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300"
              >
                {vuln.name} {vuln.cwe && <span className="text-neutral-500">({vuln.cwe})</span>}
              </span>
            ))}
          </div>

          <label className="block text-xs text-neutral-400 mb-1">
            Flow (how it was found / reproduced)
          </label>
          <Textarea
            rows={2}
            value={flowDraft}
            onChange={(event) => setFlowDraft(event.target.value)}
            placeholder="e.g. Logged in as user A, changed the id parameter to user B's id, received their data."
          />

          <div className="mt-2 flex flex-wrap gap-2">
            {selectedTestCase.suggestedVulnerabilities.map((vuln) => (
              <Button
                key={vuln.name}
                variant="secondary"
                className="text-xs"
                disabled={createFinding.isPending}
                onClick={() => handleCreateFinding(vuln.name, vuln.cwe)}
              >
                {createFinding.isPending ? "Creating…" : `Create finding: ${vuln.name}`}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
