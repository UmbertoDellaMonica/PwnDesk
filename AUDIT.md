# PwnDesk — Feature Audit & Change Log

Living document. Updated whenever a feature area is audited or changed. Organized by module (current state), then a chronological change log, then known gaps that are intentionally out of scope for now.

## 1. Feature audit by module

### Workspace / Projects (left sidebar)
- One SQLite file per project (`project.sqlite`) + a global `catalog.sqlite` listing all projects.
- New project dialog: name, client, methodology (seeds Scope/Recon/Assets/Test Matrix/Findings/Evidence/Timeline pages).
- Project sidebar is **collapsible** (VS Code-style, `«`/`»` toggle) and **resizable** by dragging its right edge; state persists in `localStorage`.
- Delete project requires an explicit confirmation checkbox (unchanged, was already careful).

### Knowledge Base (center sidebar + page editor)
- Page tree: create, rename, delete (with confirmation), **drag-and-drop reorder and reparent** (drop on the top/bottom third of a row to reorder as sibling, drop on the middle to nest as a child; blocks dropping a page into its own descendant).
- Rich text editor (Tiptap), all of the below verified working:
  - Headings **H1–H5** (own slash-menu entries + distinct font sizes; H6 also styled defensively even though not in the menu).
  - Bold / Italic / Strikethrough / Inline code — toolbar buttons are selection-aware (disabled with no selection unless toggling off an already-active mark).
  - Bullet list / numbered list, with native shortcuts (Ctrl+Shift+8 / Ctrl+Shift+7) surfaced in tooltips and in the slash menu.
  - Blockquote, divider (`---` or slash menu).
  - **Code blocks with syntax highlighting** (lowlight/highlight.js, atom-one-dark theme) and a per-block language dropdown: bash, shell, PowerShell, Python, C, C++, C#, Java, JavaScript, TypeScript, PHP, Ruby, Go, Rust, SQL, YAML, JSON, XML/HTML, INI, Diff, Markdown, plain text.
  - **Tables**: insert with a chosen row/column count (not fixed 3×3); a contextual toolbar appears with the cursor inside a table offering live numeric row/col resize (grows/shrinks via `prosemirror-tables` primitives, not one click at a time), +/− row/col, header toggle, merge/split, delete table. Column-drag resize handle and cell-selection highlight are styled (were invisible by default).
  - **Links**: insert/edit via a small modal; **Ctrl/Cmd+Click opens the link in the system browser** via `@tauri-apps/plugin-opener` (plain click just places the cursor for editing).
  - **Timestamps**: format is "12 Sep, 14:32" (was time-only); always starts a new line if the current one isn't empty; inserted text is bold; Ctrl/Cmd+Shift+T shortcut plus a dedicated "+ Timestamp" toolbar button.
  - `@mention` resolves pages, Findings (shown as `FIND-001 Title`), and Assets — not just pages.
  - Evidence chips and Vulnerability Note blocks (see Findings below) for inline evidence with captions.
- All of the above required explicit CSS fixes: Tailwind's preflight reset strips default browser styling for `ul/ol` markers, `blockquote`, `hr`, `<a>`, and headings (`font-size: inherit` on every level) — none of this is cosmetic-only, it made several features look broken/invisible even though the underlying data model worked.

### Evidence
- Content-addressed (SHA-256) capture via browse / paste / drag-and-drop. Drag-and-drop required disabling Tauri's native OS-level drag interception (`dragDropEnabled: false` in `tauri.conf.json`) — otherwise the webview intercepts the drop before any HTML5 `drop` event fires.
- Gallery grid + preview modal (metadata, "Referenced in" pages/findings, classification panel).
- **Redaction**: canvas-based tool — draw black boxes over sensitive regions, saves as a **brand new evidence row** linked via `derivedFromId` (original file/row is never touched, per the immutable-evidence rule). Preview modal shows "Derived from" and "Redacted / derived copies" links.
- Delete requires confirmation; soft-deleted (file stays on disk, row hidden from the app).
- Per-evidence captions (in the Finding evidence panel, inline evidence chips, and Vulnerability Note thumbnails) are all multi-line textareas now, not single-line inputs — was inconsistent before.

### Findings
- CRUD, with an auto-generated, gap-free `displayId` (`FIND-001`, `FIND-002`, ...) computed from the highest existing numeric suffix (stable across deletions).
- CVSS 3.1 calculator (hand-implemented, verified against reference vectors).
- Category field uses the same `CweCategoryPicker` everywhere (manual creation and Vulnerability Note promotion) — search matches CWE code, name, *and description*, and shows which methodologies use each CWE.
- Evidence panel (link/unlink, caption, preview) and Assets panel (add/remove, typed).
- Vulnerability Note → Finding promotion is a confirm step (`PromoteToFindingModal`), not a silent one-click action: shows editable title, CWE (via picker), severity/CVSS (re-assessable), only creates the Finding on explicit confirm.
- "Referenced in pages" panel shows which pages `@mention` this finding.
- Delete requires confirmation (previously one click, hard delete, no way back).
- If a promoted Finding is later deleted, the originating Vulnerability Note block detects it live and shows a "⚠️ Finding was deleted" state with an "Unlink & re-edit" action, instead of silently keeping a stale "✅ Promoted" summary whose "View Finding →" link 404s.

### Assets
- Global list page (`/projects/:id/assets`) — create directly, see finding-link counts, navigate to each.
- Detail page — rename, change type, see linked findings and referencing pages, delete (with confirmation).
- Reachable via `@mention`, the graph, or the global list — previously only existed implicitly inside a Finding's panel.

### Methodology / Test catalog
- 9 methodologies: PTES, OWASP WSTG, OWASP MASTG, OWASP IoT Top 10 (new), ICS/OT (new, informed by NIST SP 800-82 / IEC 62443), OSSTMM, NIST SP 800-115, ISSAF, plus "None/custom".
- 157 test cases, 91 distinct CWEs. PTES/OSSTMM/NIST/ISSAF previously had phases listed in their category list with **zero** test cases behind some of them (e.g. PTES "Threat Modeling"/"Reporting" were empty) — filled in.
- **CWE accuracy pass**: cross-checked every non-obvious CWE mapping against cwe.mitre.org. Found and fixed 4 wrong mappings (two uses of CWE-1327 "Binding to an Unrestricted IP Address" misused for "unnecessary open service" → corrected to CWE-16; CWE-620 "Unverified Password Change" misused for registration identity → removed rather than force a bad fit; CWE-315 "Cleartext Storage... in a Cookie" misused for URL-exposed session data → corrected to CWE-598).

### Graph
- **Layered, top-to-bottom layout** (topological sort / longest-path-from-root by referencer→referenced direction: page → finding/evidence/asset, finding → evidence/asset) — replaced the earlier force-directed/circular layout.
- Draggable nodes; manual drag positions now **reset whenever the underlying data changes**, so the graph always reflects the layered rule after new links are added instead of mixing stale hand-placed nodes with freshly-laid-out ones.
- Every node type is navigable, including Assets (previously a dead click).
- Fixed several React Query cache-invalidation gaps that could leave the graph showing stale edges (linking evidence/assets to a finding, or saving a page's `@mention`/evidence content, only invalidated narrow per-item caches, not the aggregate lists the graph reads).

### Search
- `Ctrl+K` opens a modal covering pages, findings, evidence (by filename), and assets (by name) — was pages+findings only.
- Keyboard navigation (↑↓ + Enter), kind filter chips with per-kind counts.
- Sidebar entry point is a full search bar with a visible "Ctrl+K" hint, not just a small icon.

### Layout
- Three-pane VS Code-style shell: collapsible project sidebar, resizable page-tree sidebar, main content. Drag-resize follows the pointer 1:1 (fixed a stale-closure bug where width was computed from a value captured at drag-start instead of read live) and only persists to `localStorage` once per drag (was persisting on every pointermove, i.e. dozens of synchronous disk writes per drag).

### Safety / consistency
- **Destructive-action confirmation**: deleting a Finding, Asset, Evidence item, or Page now requires an explicit confirm step (`ConfirmDialog`) — previously all four were one click with no warning, and Finding/Asset deletes are hard deletes with no recovery path.
- **Toast notifications**: a lightweight, consistent success/error toast (bottom-right, auto-dismiss) now confirms deletions, asset creation, and evidence redaction — several of these previously gave no feedback beyond the list silently updating.

## 2. Change log (chronological, by theme)

1. Vulnerability Note rework: fixed caption focus-loss (Tiptap NodeView re-render bug), added a separate `cwe` attribute and "How I found it" field, added guided promotion via `PromoteToFindingModal` + `CweCategoryPicker`.
2. Fixed evidence drag-and-drop capture (Tauri's native OS drag interception was swallowing the drop event before it reached the app).
3. Auto-generated Finding `displayId`.
4. Extended `@mention` to Findings and Assets (previously pages only); fixed a bug where every mention was silently tagged `targetType: "page"` regardless of what was picked.
5. CWE/methodology catalog expansion (round 1): 78 → 154 test cases, 44 → 91 distinct CWEs; added OWASP IoT Top 10 and ICS/OT as new methodologies; filled empty phases in PTES/OSSTMM/NIST/ISSAF.
6. Table formatting: arbitrary insert size, then live runtime resize + contextual toolbar; Link extension + Ctrl/Cmd+Click-to-open fix; formatting toolbar (bold/italic/strike/code/lists/quote); evidence-and-asset-aware search; page tree drag reorder/reparent.
7. Fixed graph drag-resize jank (stale closure + per-frame localStorage writes) and made the panel layout collapsible/resizable, VS Code-style.
8. Fixed bullet/numbered list markers, table resize-handle/cell-selection styling, blockquote styling, `<a>` styling, `hr` styling, heading font-sizing — all invisible-but-functional due to Tailwind preflight resets.
9. Added multi-language code blocks (syntax highlighting); heading levels 1–5 in the slash menu; improved timestamp (date+time, bold, new-line, shortcut, button); graph layered top-to-bottom layout + cache-invalidation fixes.
10. Expanded Finding evidence captions from single-line inputs to textareas (Finding panel, inline evidence chips, Vulnerability Note thumbnails).
11. Evidence redaction (canvas tool, immutable derived copies); global Asset list + CRUD; `CweCategoryPicker` reused for manually-created Findings' category field.
12. CWE mapping search enhanced (searches description too, shows source methodologies); further catalog depth pass + 4-mapping accuracy fix against cwe.mitre.org; destructive-action confirmation dialogs; toast notification system.
13. Fixed a Vulnerability Note left in a stale "Promoted" state (broken link) after its Finding was deleted — now detects the deletion live and offers to unlink/re-edit.

## 3. Known gaps (intentionally not addressed)

- **Reporting module** — explicitly out of scope per user decision; the app has no way to assemble Findings/evidence into a client deliverable.
- **Encryption at rest** — deferred earlier in the project; SQLite files and evidence are stored unencrypted on disk.
- **CVSS v4** — only CVSS 3.1 is implemented.
- **Attack Path / Attack Graph analytics** — the Graph view is a link/reference graph, not a modeled attack-path/kill-chain feature (planned as V1.1 in the original design doc).
- **Importers** (Nmap/Burp/Nuclei/etc.) — not implemented.
- **Findings/Evidence list filtering** — `FindingsListPage` and `EvidenceGalleryPage` have no filter/sort controls (severity, status, date, type); only the global search covers them.
- **`evidence.paths.ts` MIME→extension coverage** — only png/jpeg/gif/webp/pdf/txt map to a real extension; anything else (e.g. `image/svg+xml`, `image/bmp`) is saved with a generic `.bin` extension.
- **Accessibility** — not audited; many icon-only buttons have no `aria-label`, no keyboard-only pass done beyond the search modal and slash/mention menus.
- **No bulk actions** — no multi-select delete/promote/tag anywhere.
