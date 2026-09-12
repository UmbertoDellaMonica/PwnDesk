import type { FindingSeverity } from "../finding/finding.types";

export type MetricId = "AV" | "AC" | "PR" | "UI" | "S" | "C" | "I" | "A";

export interface MetricOption {
  code: string;
  label: string;
  icon: string;
  description: string;
}

export interface MetricGroup {
  id: MetricId;
  name: string;
  options: MetricOption[];
}

export const CVSS_METRICS: MetricGroup[] = [
  {
    id: "AV",
    name: "Attack Vector",
    options: [
      { code: "N", label: "Network", icon: "🌐", description: "Exploitable remotely over a network, no local/physical access needed." },
      { code: "A", label: "Adjacent", icon: "🏠", description: "Requires access to the same local network segment (e.g. same LAN/Wi-Fi)." },
      { code: "L", label: "Local", icon: "💻", description: "Requires local access — logged in locally, or via SSH." },
      { code: "P", label: "Physical", icon: "🖐️", description: "Requires physical access to or touching the vulnerable device." },
    ],
  },
  {
    id: "AC",
    name: "Attack Complexity",
    options: [
      { code: "L", label: "Low", icon: "🟢", description: "No special conditions needed beyond the attack vector — repeatable at will." },
      { code: "H", label: "High", icon: "🔴", description: "Requires specific conditions to line up (timing, race, specific config, MITM)." },
    ],
  },
  {
    id: "PR",
    name: "Privileges Required",
    options: [
      { code: "N", label: "None", icon: "⭕", description: "No prior access or authorization needed." },
      { code: "L", label: "Low", icon: "🔑", description: "Requires basic/low-privileged authenticated access." },
      { code: "H", label: "High", icon: "🔐", description: "Requires significant/administrative privileges before the attack can start." },
    ],
  },
  {
    id: "UI",
    name: "User Interaction",
    options: [
      { code: "N", label: "None", icon: "🚫", description: "No action from another user is required." },
      { code: "R", label: "Required", icon: "👆", description: "Some action from a user (e.g. clicking a link) is required." },
    ],
  },
  {
    id: "S",
    name: "Scope",
    options: [
      { code: "U", label: "Unchanged", icon: "📦", description: "Impact is limited to the vulnerable component itself." },
      { code: "C", label: "Changed", icon: "💥", description: "Impact reaches beyond the vulnerable component into other components." },
    ],
  },
  {
    id: "C",
    name: "Confidentiality Impact",
    options: [
      { code: "N", label: "None", icon: "⬜", description: "No loss of confidentiality." },
      { code: "L", label: "Low", icon: "🟨", description: "Some limited disclosure of information." },
      { code: "H", label: "High", icon: "🟥", description: "Total disclosure of all data on the affected component." },
    ],
  },
  {
    id: "I",
    name: "Integrity Impact",
    options: [
      { code: "N", label: "None", icon: "⬜", description: "No loss of integrity." },
      { code: "L", label: "Low", icon: "🟨", description: "Some data modification possible, limited impact." },
      { code: "H", label: "High", icon: "🟥", description: "Total loss of integrity — any data can be modified." },
    ],
  },
  {
    id: "A",
    name: "Availability Impact",
    options: [
      { code: "N", label: "None", icon: "⬜", description: "No impact on availability." },
      { code: "L", label: "Low", icon: "🟨", description: "Reduced performance or intermittent availability loss." },
      { code: "H", label: "High", icon: "🟥", description: "Total loss of availability of the affected component." },
    ],
  },
];

const AV_WEIGHTS: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC_WEIGHTS: Record<string, number> = { L: 0.77, H: 0.44 };
const PR_WEIGHTS_UNCHANGED: Record<string, number> = { N: 0.85, L: 0.62, H: 0.27 };
const PR_WEIGHTS_CHANGED: Record<string, number> = { N: 0.85, L: 0.68, H: 0.5 };
const UI_WEIGHTS: Record<string, number> = { N: 0.85, R: 0.62 };
const CIA_WEIGHTS: Record<string, number> = { N: 0, L: 0.22, H: 0.56 };

export type Cvss31Selection = Record<MetricId, string>;

export interface Cvss31Result {
  score: number;
  severity: FindingSeverity;
  vector: string;
}

// CVSS spec's "Roundup" — round up to 1 decimal place with float-error correction.
function roundUp(value: number): number {
  const intInput = Math.round(value * 100000);
  if (intInput % 10000 === 0) return intInput / 100000;
  return (Math.floor(intInput / 10000) + 1) / 10;
}

function severityFromScore(score: number): FindingSeverity {
  if (score === 0) return "none";
  if (score < 4) return "low";
  if (score < 7) return "medium";
  if (score < 9) return "high";
  return "critical";
}

export function isSelectionComplete(selection: Partial<Cvss31Selection>): selection is Cvss31Selection {
  return CVSS_METRICS.every((metric) => Boolean(selection[metric.id]));
}

export function parseCvss31Vector(vector: string | null | undefined): Partial<Cvss31Selection> {
  if (!vector) return {};
  const selection: Partial<Cvss31Selection> = {};
  for (const part of vector.split("/")) {
    const [key, value] = part.split(":");
    if (key && value && CVSS_METRICS.some((m) => m.id === key)) {
      selection[key as MetricId] = value;
    }
  }
  return selection;
}

export function computeCvss31(selection: Cvss31Selection): Cvss31Result {
  const scopeChanged = selection.S === "C";

  const av = AV_WEIGHTS[selection.AV];
  const ac = AC_WEIGHTS[selection.AC];
  const pr = (scopeChanged ? PR_WEIGHTS_CHANGED : PR_WEIGHTS_UNCHANGED)[selection.PR];
  const ui = UI_WEIGHTS[selection.UI];
  const c = CIA_WEIGHTS[selection.C];
  const i = CIA_WEIGHTS[selection.I];
  const a = CIA_WEIGHTS[selection.A];

  const iss = 1 - (1 - c) * (1 - i) * (1 - a);
  const exploitability = 8.22 * av * ac * pr * ui;

  let impact: number;
  let score: number;
  if (scopeChanged) {
    impact = 7.52 * (iss - 0.029) - 3.25 * (iss - 0.02) ** 15;
    score = impact <= 0 ? 0 : roundUp(Math.min(1.08 * (impact + exploitability), 10));
  } else {
    impact = 6.42 * iss;
    score = impact <= 0 ? 0 : roundUp(Math.min(impact + exploitability, 10));
  }

  const vector = `CVSS:3.1/${CVSS_METRICS.map((m) => `${m.id}:${selection[m.id]}`).join("/")}`;

  return { score, severity: severityFromScore(score), vector };
}
