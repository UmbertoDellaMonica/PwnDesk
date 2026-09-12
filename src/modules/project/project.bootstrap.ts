import type Database from "@tauri-apps/plugin-sql";
import type { JsonValue } from "../../shared/types";
import { createPage, updatePageBlocks } from "../page/page.repository";
import { DEFAULT_SECTION_TITLES, METHODOLOGIES, type Methodology, type MethodologyId } from "./methodology";

function headingBlock(text: string): JsonValue {
  return {
    type: "heading",
    attrs: { level: 2 },
    content: [{ type: "text", text }],
  };
}

function paragraphBlock(text?: string): JsonValue {
  return text
    ? { type: "paragraph", content: [{ type: "text", text }] }
    : { type: "paragraph" };
}

// Example content is italicized so it's visually obvious it's a placeholder
// to edit/delete, not real data already collected.
function exampleParagraph(text: string): JsonValue {
  return {
    type: "paragraph",
    content: [{ type: "text", text: `Example: ${text}`, marks: [{ type: "italic" }] }],
  };
}

function exampleBulletList(examples: string[]): JsonValue {
  return {
    type: "bulletList",
    content: examples.map((text) => ({
      type: "listItem",
      content: [exampleParagraph(text)],
    })),
  };
}

function taskListBlock(items: string[]): JsonValue {
  return {
    type: "taskList",
    content: items.map((item) => ({
      type: "taskItem",
      attrs: { checked: false },
      content: [paragraphBlock(item)],
    })),
  };
}

function exampleTaskList(examples: string[]): JsonValue {
  return {
    type: "taskList",
    content: examples.map((text) => ({
      type: "taskItem",
      attrs: { checked: false },
      content: [exampleParagraph(text)],
    })),
  };
}

function tableBlock(headers: string[], exampleRows: string[][]): JsonValue {
  const headerRow = {
    type: "tableRow",
    content: headers.map((header) => ({
      type: "tableHeader",
      content: [paragraphBlock(header)],
    })),
  };
  const bodyRows = exampleRows.map((row) => ({
    type: "tableRow",
    content: row.map((cell, index) => ({
      type: "tableCell",
      content: [index === 0 ? exampleParagraph(cell) : paragraphBlock(cell)],
    })),
  }));
  return { type: "table", content: [headerRow, ...bodyRows] };
}

function docOf(...nodes: JsonValue[]): JsonValue {
  return { type: "doc", content: nodes };
}

function buildSeedContent(title: string, methodology: Methodology): JsonValue | null {
  switch (title) {
    case "Scope":
      return docOf(
        paragraphBlock(
          "What's in play and what isn't for this engagement, plus any rules of engagement worth remembering mid-test. Delete the example lines below and replace them with the real scope.",
        ),
        headingBlock("In scope"),
        exampleTaskList(["app.example.com — production web app", "10.0.5.0/24 — internal network segment"]),
        headingBlock("Out of scope"),
        exampleTaskList(["legacy-app.example.com — explicitly excluded per RoE"]),
        headingBlock("Rules of engagement notes"),
        exampleTaskList(["Testing window 09:00–18:00 CET, no DoS, emergency contact: Jane Doe +1-555-0100"]),
      );
    case "Recon":
      return docOf(
        paragraphBlock(
          "Everything you learn about the target before you start attacking it — hosts, ports, tech stack — so you don't have to re-discover it later. Delete the examples and fill in what you actually find.",
        ),
        headingBlock("Hosts & subdomains"),
        exampleTaskList(["api.example.com → 203.0.113.10"]),
        headingBlock("Ports & services"),
        exampleTaskList(["443/tcp → nginx 1.24 (TLS 1.2)"]),
        headingBlock("Technology stack"),
        exampleTaskList(["WordPress 6.4, PHP 8.1, MySQL 8.0"]),
        headingBlock("Other findings"),
        exampleTaskList(["robots.txt discloses /admin-legacy/"]),
      );
    case "Assets":
      return docOf(
        headingBlock("Assets discovered"),
        paragraphBlock(
          "A running scratch list of things you've found worth tracking, separate from evidence or findings — promote important ones to a Finding's \"affected assets\" when needed. Replace the example row, add one row per asset.",
        ),
        tableBlock(
          ["Name", "Type", "Notes"],
          [["app.example.com", "Web app", "Primary target, login at /admin"]],
        ),
      );
    case "Test Matrix":
      if (methodology.categories.length === 0) return null;
      return docOf(
        paragraphBlock(
          "Your methodology's checklist, so you can see at a glance what's been covered and what hasn't. Tick items off as you go; add sub-notes under any item as needed.",
        ),
        headingBlock(methodology.label),
        taskListBlock(methodology.categories),
      );
    case "Findings":
      return docOf(
        headingBlock("Findings — triage notes"),
        paragraphBlock(
          "Quick triage notes on anything that looks like a real issue, before it's worth the ceremony of a full structured Finding. Type \"/\" and pick \"Vulnerability note\" to log one inline with severity and evidence attached; promote it to a structured Finding from the Findings section in the sidebar once it's confirmed.",
        ),
        exampleBulletList([
          "Login form on /admin might be vulnerable to brute force — check lockout policy",
        ]),
      );
    case "Evidence":
      return docOf(
        headingBlock("Evidence — capture notes"),
        paragraphBlock(
          "Context for what you've captured — the Evidence gallery (sidebar) holds the actual files; this page is for notes about them. Paste a screenshot directly into this page, or use the + Evidence button, to link a file here.",
        ),
        exampleBulletList(["screenshot_01.png — shows a verbose stack trace on /api/error"]),
      );
    case "Timeline":
      return docOf(
        headingBlock("Activity log"),
        paragraphBlock(
          "A chronological log of what you did and when. Click + Timestamp (or type \"/\" and pick Timestamp) anywhere to insert the current time, then type what you just did.",
        ),
        exampleParagraph("09:15 — Started recon, ran nmap against 10.0.5.0/24"),
      );
    default:
      return null;
  }
}

/**
 * Creates the standard set of top-level pages for a freshly created project
 * (design doc §8 "Bootstrap" step), each seeded with a lightweight starter
 * skeleton so note-taking has a prompt instead of starting from a blank page.
 * Runs once, right after project creation — never re-applied to existing projects.
 */
export async function bootstrapProjectPages(
  db: Database,
  projectId: string,
  methodologyId: MethodologyId,
): Promise<{ firstPageId: string }> {
  const methodology = METHODOLOGIES[methodologyId];
  let firstPageId: string | null = null;

  for (const title of DEFAULT_SECTION_TITLES) {
    const page = await createPage(db, projectId, title);
    if (!firstPageId) firstPageId = page.id;
    const blocks = buildSeedContent(title, methodology);
    if (blocks) {
      await updatePageBlocks(db, page.id, blocks);
    }
  }

  return { firstPageId: firstPageId as string };
}
