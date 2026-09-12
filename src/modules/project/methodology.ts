export type MethodologyId =
  | "ptes"
  | "owasp-wstg"
  | "owasp-mastg"
  | "owasp-iot"
  | "ics-ot"
  | "osstmm"
  | "nist-800-115"
  | "issaf"
  | "none";

export interface Methodology {
  id: MethodologyId;
  label: string;
  description: string;
  /** Top-level test categories used to seed the "Test Matrix" page as a checklist. */
  categories: string[];
}

export const METHODOLOGIES: Record<MethodologyId, Methodology> = {
  ptes: {
    id: "ptes",
    label: "PTES (generic)",
    description: "Penetration Testing Execution Standard phases.",
    categories: [
      "Intelligence Gathering",
      "Threat Modeling",
      "Vulnerability Analysis",
      "Exploitation",
      "Post Exploitation",
      "Reporting",
    ],
  },
  "owasp-wstg": {
    id: "owasp-wstg",
    label: "OWASP WSTG (web)",
    description: "OWASP Web Security Testing Guide top-level categories.",
    categories: [
      "Information Gathering",
      "Configuration and Deployment Management Testing",
      "Identity Management Testing",
      "Authentication Testing",
      "Authorization Testing",
      "Session Management Testing",
      "Input Validation Testing",
      "Testing for Error Handling",
      "Testing for Weak Cryptography",
      "Business Logic Testing",
      "Client-side Testing",
      "API Testing",
    ],
  },
  "owasp-mastg": {
    id: "owasp-mastg",
    label: "OWASP MASTG (mobile)",
    description: "OWASP Mobile Application Security Testing Guide top-level categories.",
    categories: [
      "Architecture, Design and Threat Modeling",
      "Data Storage",
      "Cryptography",
      "Authentication and Session Management",
      "Network Communication",
      "Platform Interaction",
      "Code Quality and Build Settings",
      "Resilience Against Reverse Engineering",
    ],
  },
  "owasp-iot": {
    id: "owasp-iot",
    label: "OWASP IoT (IoT devices)",
    description: "OWASP IoT Top 10 — connected device, firmware, and ecosystem security.",
    categories: [
      "Weak, Guessable, or Hardcoded Passwords",
      "Insecure Network Services",
      "Insecure Ecosystem Interfaces",
      "Lack of Secure Update Mechanism",
      "Use of Insecure or Outdated Components",
      "Insufficient Privacy Protection",
      "Insecure Data Transfer and Storage",
      "Lack of Device Management",
      "Insecure Default Settings",
      "Lack of Physical Hardening",
    ],
  },
  "ics-ot": {
    id: "ics-ot",
    label: "ICS/OT (industrial & operational technology)",
    description: "Industrial control systems / operational technology security, informed by NIST SP 800-82 and IEC 62443.",
    categories: [
      "Network Architecture & Segmentation",
      "Industrial Protocol Security",
      "HMI & Engineering Workstation Security",
      "Controller (PLC/RTU) Security",
      "Remote & Vendor Access",
      "Safety and Availability Impact",
    ],
  },
  osstmm: {
    id: "osstmm",
    label: "OSSTMM",
    description: "Open Source Security Testing Methodology Manual scope areas.",
    categories: [
      "Human Security Testing",
      "Physical Security Testing",
      "Wireless Security Testing",
      "Telecommunications Security Testing",
      "Data Networks Security Testing",
      "Compliance",
    ],
  },
  "nist-800-115": {
    id: "nist-800-115",
    label: "NIST SP800-115",
    description: "NIST Technical Guide to Information Security Testing and Assessment cycle.",
    categories: ["Planning", "Discovery", "Attack", "Reporting"],
  },
  issaf: {
    id: "issaf",
    label: "ISSAF",
    description: "Information System Security Assessment Framework phases.",
    categories: [
      "Planning and Preparation",
      "Assessment",
      "Reporting, Clean-up and Artifact Destruction",
    ],
  },
  none: {
    id: "none",
    label: "None / custom",
    description: "No starter checklist — start from a blank Test Matrix page.",
    categories: [],
  },
};

export const DEFAULT_SECTION_TITLES = [
  "Scope",
  "Recon",
  "Assets",
  "Test Matrix",
  "Findings",
  "Evidence",
  "Timeline",
] as const;

/** One-line purpose per default section — shown in ProjectHome's page list, kept short (the full versions live as in-page paragraphs seeded by project.bootstrap.ts). */
export const SECTION_DESCRIPTIONS: Record<string, string> = {
  Scope: "What's in play and what isn't, plus rules of engagement.",
  Recon: "Everything learned about the target before attacking it.",
  Assets: "A scratch list of things worth tracking.",
  "Test Matrix": "Your methodology's checklist — what's covered, what's not.",
  Findings: "Quick triage notes before something becomes a structured Finding.",
  Evidence: "Notes about what you've captured — files live in the Evidence gallery.",
  Timeline: "A chronological log of what you did and when.",
};
