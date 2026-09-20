# PwnDesk

PwnDesk is a **penetration-test knowledge workbench** — a desktop app for organizing engagement notes, evidence, and findings in one place instead of scattering them across a text editor, a screenshot folder, and a report template.

It's built around one idea: free-form notes and structured data shouldn't be separate tools. Write a page of raw notes during an engagement, then "promote" the useful parts into a structured Finding, Asset, or piece of Evidence without retyping anything — and keep them linked back to the page they came from.

> **Status:** early-stage, single-user, local-only. No encryption at rest yet, no report generation, no team/collaboration features. See [Roadmap](#roadmap) below.

## Features

- **Block-based notebook** — a rich text editor (headings, tables, code blocks with syntax highlighting, task lists, `@mention` links to pages/findings/assets) for engagement notes, recon logs, and scratch work.
- **Evidence gallery** — capture screenshots (native screen/window/region capture, or paste/drag from anywhere), annotate them (outline, highlight, arrow, with a select/edit mode to move or resize shapes before saving), and keep every evidence file content-addressed by SHA-256. Redacted or annotated copies are always saved as new files — the original is never modified.
- **Findings** — CVSS 3.1 scoring, a CWE/methodology category picker, linked evidence and assets, and a promotion flow from a raw note to a fully-formed finding.
- **Methodology catalog** — a built-in library of test cases across PTES, OWASP WSTG/MASTG, OWASP IoT Top 10, ICS/OT, OSSTMM, NIST SP 800-115, and ISSAF, each mapped to relevant CWEs.
- **Relationship graph** — a top-to-bottom layered view of how pages, findings, evidence, and assets reference each other.
- **Full-text search** — one search bar (`Ctrl+K`) across pages, findings, evidence, and assets.

## Tech stack

| Layer | Technology |
|---|---|
| Desktop shell | [Tauri v2](https://tauri.app/) (Rust) |
| Frontend | React 19 + TypeScript + Vite |
| Editor | [Tiptap](https://tiptap.dev/) (ProseMirror) |
| Styling | Tailwind CSS |
| Storage | SQLite (one file per project, no server) |
| Screen capture | [xcap](https://github.com/nashaofu/xcap) + OS clipboard for region selection |

Everything runs locally — there is no backend server and no network calls beyond what the OS-native capture/clipboard APIs need.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (stable toolchain)
- Platform build tools required by Tauri — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/) for your OS

### Development

```bash
npm install
npm run tauri dev
```

This starts the Vite dev server and launches the Tauri window with hot reload.

### Building a release binary

```bash
npm run tauri build
```

Output artifacts land under `src-tauri/target/release/bundle/`.

## Project structure

```
src/
  app/          # routing, shell layout, top-level pages
  modules/      # one folder per domain area (evidence, finding, page, graph, ...)
  db/           # SQLite schema migrations and client
  shared/       # cross-cutting UI components and utilities
src-tauri/      # Rust backend: Tauri commands, native screen capture
```

Each `modules/<name>` folder groups its own types, repository (SQL access), service/hook layer, and UI components together.

## Roadmap

Not yet implemented, roughly in priority order:

- Report generation (assembling findings/evidence into a client deliverable)
- Encryption at rest for the local SQLite files and evidence store
- Import pipelines (Nmap, Burp, Nuclei, etc.)
- CVSS v4 scoring
- Multi-user collaboration / auth
- Attack-path graph analytics beyond the current reference graph

## License

Apache License 2.0 — see [LICENSE](LICENSE).
