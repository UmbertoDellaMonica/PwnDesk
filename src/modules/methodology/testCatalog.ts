import type { MethodologyId } from "../project/methodology";

export interface SuggestedVulnerability {
  name: string;
  /** Not every category maps cleanly to a single CWE (e.g. OSSTMM's Human channel) — omit rather than force a bad fit. */
  cwe?: string;
  description: string;
}

export interface TestCase {
  id: string;
  category: string;
  label: string;
  /**
   * WSTG/MASTG test cases are taken from the guide itself. PTES/OSSTMM/NIST/
   * ISSAF don't enumerate vulnerabilities in the standard the way WSTG/MASTG
   * do — those methodologies are phase/channel-based, not test-case-based —
   * so their entries below are curated common findings per phase/channel,
   * not verbatim guide content. This flag makes that distinction visible
   * in the UI instead of silently presenting both as equally authoritative.
   */
  fromGuide: boolean;
  suggestedVulnerabilities: SuggestedVulnerability[];
}

/**
 * Starter catalog — a representative subset per methodology, not exhaustive.
 * Meant to prove the "evidence/note -> presumed vulnerability" mapping
 * mechanism; extend as needed rather than treating this as complete.
 */
export const TEST_CATALOG: Record<MethodologyId, TestCase[]> = {
  "owasp-wstg": [
    {
      id: "WSTG-IDNT-04",
      category: "Identity Management Testing",
      label: "Testing for Account Enumeration and Guessable User Account",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Account Enumeration",
          cwe: "CWE-204",
          description:
            "Differences in application responses (error messages, timing, HTTP codes) let an attacker determine whether a given username/account exists.",
        },
        {
          name: "Observable Discrepancy",
          cwe: "CWE-203",
          description:
            "The application behaves detectably differently (response content, timing, error code) depending on a secret or hidden condition, letting an attacker infer that condition through repeated probing.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-04",
      category: "Authentication Testing",
      label: "Testing for Bypassing Authentication Schema",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Authentication",
          cwe: "CWE-287",
          description:
            "The authentication mechanism can be bypassed or subverted, letting an attacker assume another user's identity without valid credentials.",
        },
        {
          name: "Authentication Bypass by Capture-replay",
          cwe: "CWE-294",
          description:
            "An attacker captures a valid authentication credential/token exchange and replays it later to authenticate without knowing the actual credential.",
        },
        {
          name: "Improper Handling of Case Sensitivity",
          cwe: "CWE-178",
          description:
            "The application treats input as case-sensitive (or insensitive) inconsistently with how a downstream component treats it, letting an attacker bypass a filter or check by changing letter case.",
        },
      ],
    },
    {
      id: "WSTG-ATHZ-01",
      category: "Authorization Testing",
      label: "Testing Directory Traversal / File Include",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Path Traversal",
          cwe: "CWE-22",
          description:
            "User-controlled input is used to build a file path without proper sanitization, allowing access to files/directories outside the intended folder.",
        },
        {
          name: "Improper Link Resolution Before File Access ('Link Following')",
          cwe: "CWE-59",
          description:
            "The application accesses a file via a path without checking whether it's a symlink, letting an attacker redirect the operation to an unintended file by pre-planting a symlink.",
        },
      ],
    },
    {
      id: "WSTG-ATHZ-04",
      category: "Authorization Testing",
      label: "Testing for Insecure Direct Object References",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure Direct Object Reference (IDOR)",
          cwe: "CWE-639",
          description:
            "The application exposes a direct reference to an internal object (e.g. an ID) and fails to verify the requesting user is authorized to access that specific object.",
        },
      ],
    },
    {
      id: "WSTG-SESS-01",
      category: "Session Management Testing",
      label: "Testing for Session Management Schema",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Session Fixation",
          cwe: "CWE-384",
          description:
            "An attacker can set or predict a victim's session identifier before authentication, then hijack the session once the victim logs in.",
        },
      ],
    },
    {
      id: "WSTG-SESS-05",
      category: "Session Management Testing",
      label: "Testing for Cross Site Request Forgery",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Cross-Site Request Forgery (CSRF)",
          cwe: "CWE-352",
          description:
            "The application doesn't verify that a state-changing request genuinely originated from the user's own session, letting an attacker trick a logged-in user into submitting unwanted actions.",
        },
      ],
    },
    {
      id: "WSTG-INPV-01",
      category: "Input Validation Testing",
      label: "Testing for Reflected Cross Site Scripting",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Reflected XSS",
          cwe: "CWE-79",
          description:
            "User input is echoed back in the HTTP response without proper encoding, allowing attacker-controlled script to execute in the victim's browser.",
        },
        {
          name: "Improper Encoding or Escaping of Output",
          cwe: "CWE-116",
          description:
            "Output is written to a downstream context (HTML, SQL, shell) without the encoding that context requires — the general root cause behind most injection/XSS findings.",
        },
        {
          name: "Inappropriate Encoding for Output Context",
          cwe: "CWE-838",
          description:
            "Data is encoded for one output context (e.g. HTML) but actually rendered into a different context (e.g. a JavaScript string or an HTML attribute) that requires different encoding rules, letting the mismatched encoding be bypassed.",
        },
      ],
    },
    {
      id: "WSTG-INPV-05",
      category: "Input Validation Testing",
      label: "Testing for SQL Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "SQL Injection",
          cwe: "CWE-89",
          description:
            "Unsanitized user input is concatenated into a SQL query, letting an attacker alter query logic and read/modify/delete database data.",
        },
      ],
    },
    {
      id: "WSTG-INPV-12",
      category: "Input Validation Testing",
      label: "Testing for Command Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "OS Command Injection",
          cwe: "CWE-78",
          description:
            "Unsanitized user input is passed to a system shell command, allowing arbitrary command execution on the host.",
        },
        {
          name: "Command Injection",
          cwe: "CWE-77",
          description:
            "Unsanitized user input reaches a command interpreter other than the OS shell (a scripting engine, a CLI tool invoked with a crafted argument, etc.), letting an attacker inject additional commands.",
        },
        {
          name: "Argument Injection",
          cwe: "CWE-88",
          description:
            "User input reaches a command's argument list without neutralizing argument delimiters, letting an attacker inject additional command-line flags/arguments the developer didn't intend to expose.",
        },
      ],
    },
    {
      id: "WSTG-ERRH-01",
      category: "Testing for Error Handling",
      label: "Testing for Improper Error Handling",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Exposure Through an Error Message",
          cwe: "CWE-209",
          description:
            "Verbose error messages or stack traces reveal internal implementation details (paths, queries, versions) useful to an attacker.",
        },
        {
          name: "Improper Check for Unusual or Exceptional Conditions",
          cwe: "CWE-754",
          description:
            "The code doesn't check for an unusual condition that can occur during normal operation, leading to undefined behavior when it does.",
        },
        {
          name: "Improper Handling of Exceptional Conditions",
          cwe: "CWE-755",
          description:
            "An exceptional condition is detected but handled incorrectly (swallowed, logged and ignored, or handled with the wrong recovery logic), leaving the application in an inconsistent state.",
        },
        {
          name: "Unchecked Return Value",
          cwe: "CWE-252",
          description:
            "The return value of a security-relevant function call is not checked, so the calling code proceeds as if it had succeeded regardless.",
        },
      ],
    },
    {
      id: "WSTG-CRYP-02",
      category: "Testing for Weak Cryptography",
      label: "Testing for Padding Oracle",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Padding Oracle",
          cwe: "CWE-327",
          description:
            "Differences in error responses or timing when decrypting padded ciphertext let an attacker decrypt data or forge valid ciphertext without the key.",
        },
      ],
    },
    {
      id: "WSTG-CLNT-01",
      category: "Client-side Testing",
      label: "Testing for DOM-Based Cross Site Scripting",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "DOM-Based XSS",
          cwe: "CWE-79",
          description:
            "Client-side JavaScript writes attacker-controlled data into the DOM in an unsafe way (e.g. innerHTML) without sanitization, executing arbitrary script in the victim's browser.",
        },
      ],
    },
    {
      id: "WSTG-INFO-01",
      category: "Information Gathering",
      label: "Conduct Search Engine Discovery and Reconnaissance for Information Leakage",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Disclosure via Public Sources",
          cwe: "CWE-200",
          description:
            "Search engine caches, code repositories, or public documents leak internal details (paths, credentials, infrastructure) about the target.",
        },
      ],
    },
    {
      id: "WSTG-INFO-02",
      category: "Information Gathering",
      label: "Fingerprint Web Server",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Exposure Through Server Banner",
          cwe: "CWE-200",
          description:
            "The web server/framework reveals its exact name and version in headers or error pages, helping an attacker target known vulnerabilities.",
        },
      ],
    },
    {
      id: "WSTG-CONF-01",
      category: "Configuration and Deployment Management Testing",
      label: "Test Network Infrastructure Configuration",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Security Misconfiguration",
          cwe: "CWE-16",
          description:
            "Infrastructure components are deployed with insecure defaults, unnecessary open services, or missing hardening.",
        },
        {
          name: "Use of Incorrectly-Resolved Name or Reference",
          cwe: "CWE-706",
          description:
            "The application resolves a name (hostname, file path, DNS entry) to the wrong resource because the resolution logic doesn't account for how that name can be manipulated.",
        },
      ],
    },
    {
      id: "WSTG-CONF-05",
      category: "Configuration and Deployment Management Testing",
      label: "Enumerate Infrastructure and Application Admin Interfaces",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Exposed Administrative Interface",
          cwe: "CWE-284",
          description:
            "An admin panel or management interface is reachable without adequate network or authentication restrictions.",
        },
      ],
    },
    {
      id: "WSTG-CONF-07",
      category: "Configuration and Deployment Management Testing",
      label: "Test HTTP Strict Transport Security",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing HTTP Strict Transport Security",
          cwe: "CWE-319",
          description:
            "The application doesn't send an HSTS header, leaving users open to protocol-downgrade / SSL-stripping attacks.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-01",
      category: "Authentication Testing",
      label: "Testing for Credentials Transported over an Encrypted Channel",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Cleartext Transmission of Credentials",
          cwe: "CWE-319",
          description: "Login credentials are sent over an unencrypted channel, exposing them to interception.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-02",
      category: "Authentication Testing",
      label: "Testing for Default Credentials",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of Default Credentials",
          cwe: "CWE-1392",
          description: "An account still uses its vendor-supplied or installation-time default password.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-03",
      category: "Authentication Testing",
      label: "Testing for Weak Lock Out Mechanism",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Restriction of Excessive Authentication Attempts",
          cwe: "CWE-307",
          description:
            "The application doesn't lock out or throttle repeated failed login attempts, enabling password brute-forcing.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-07",
      category: "Authentication Testing",
      label: "Testing for Weak Password Policy",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Weak Password Requirements",
          cwe: "CWE-521",
          description: "The application allows short, common, or otherwise easily guessable passwords.",
        },
        {
          name: "Use of Password Hash With Insufficient Computational Effort",
          cwe: "CWE-916",
          description:
            "Passwords are hashed with a fast, general-purpose hash instead of a slow, purpose-built one (bcrypt/scrypt/Argon2), making offline cracking of a leaked hash database far cheaper.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-09",
      category: "Authentication Testing",
      label: "Testing for Weak Security Question/Answer",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Weak Password Recovery Mechanism",
          cwe: "CWE-640",
          description:
            "The password reset/recovery flow relies on guessable security questions or a predictable process an attacker can abuse.",
        },
      ],
    },
    {
      id: "WSTG-ATHZ-02",
      category: "Authorization Testing",
      label: "Testing for Bypassing Authorization Schema",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Authorization",
          cwe: "CWE-285",
          description:
            "The application fails to correctly enforce access control checks, letting a user perform actions or view data outside their permission level.",
        },
        {
          name: "Missing Authorization",
          cwe: "CWE-862",
          description:
            "An endpoint or action performs no authorization check at all (as opposed to performing one incorrectly), so any authenticated — or even unauthenticated — request succeeds.",
        },
        {
          name: "Incorrect Authorization",
          cwe: "CWE-863",
          description:
            "An authorization check exists but is logically wrong (checks the wrong role, compares against the wrong resource owner, etc.), granting access it shouldn't.",
        },
        {
          name: "Direct Request ('Forced Browsing')",
          cwe: "CWE-425",
          description:
            "A resource or function is reachable directly by URL/endpoint without going through the intended access-controlled workflow that would normally gate it.",
        },
      ],
    },
    {
      id: "WSTG-ATHZ-03",
      category: "Authorization Testing",
      label: "Testing for Privilege Escalation",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Privilege Escalation",
          cwe: "CWE-269",
          description: "A low-privileged user can gain higher (e.g. admin) privileges through a flaw or missing check.",
        },
        {
          name: "Improper Check for Dropped Privileges",
          cwe: "CWE-273",
          description:
            "After voluntarily dropping elevated privileges, the application doesn't verify the drop actually succeeded before continuing, potentially proceeding with privileges it believes it no longer has.",
        },
      ],
    },
    {
      id: "WSTG-SESS-02",
      category: "Session Management Testing",
      label: "Testing for Cookies Attributes",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure Cookie (Missing Secure/HttpOnly)",
          cwe: "CWE-614",
          description:
            "Session cookies are missing the Secure and/or HttpOnly attributes, exposing them to interception or client-side script access.",
        },
        {
          name: "Reliance on Cookies without Validation and Integrity Checking",
          cwe: "CWE-565",
          description:
            "Security-relevant decisions are made based on a cookie's value without verifying it hasn't been tampered with client-side.",
        },
      ],
    },
    {
      id: "WSTG-SESS-07",
      category: "Session Management Testing",
      label: "Testing Session Timeout",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficient Session Expiration",
          cwe: "CWE-613",
          description: "Sessions remain valid indefinitely or for too long after inactivity, extending the window for session hijacking.",
        },
      ],
    },
    {
      id: "WSTG-INPV-02",
      category: "Input Validation Testing",
      label: "Testing for Stored Cross Site Scripting",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Stored XSS",
          cwe: "CWE-79",
          description:
            "Attacker-controlled input is persisted (e.g. in a comment or profile field) and later rendered without encoding, executing script for any viewer.",
        },
      ],
    },
    {
      id: "WSTG-INPV-11",
      category: "Input Validation Testing",
      label: "Testing for HTTP Parameter Pollution",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "HTTP Parameter Pollution",
          cwe: "CWE-235",
          description:
            "Supplying the same parameter multiple times causes inconsistent handling between components, which can bypass validation or filters.",
        },
      ],
    },
    {
      id: "WSTG-INPV-16",
      category: "Input Validation Testing",
      label: "Testing for Host Header Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Host Header Injection",
          cwe: "CWE-644",
          description:
            "The application trusts the client-supplied Host header (e.g. for password reset links or caching), letting an attacker manipulate it.",
        },
      ],
    },
    {
      id: "WSTG-INPV-18",
      category: "Input Validation Testing",
      label: "Testing for XML Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "XML External Entity (XXE) Injection",
          cwe: "CWE-611",
          description:
            "An XML parser resolves externally-defined entities from untrusted input, allowing file disclosure or server-side request forgery.",
        },
        {
          name: "Improper Restriction of Recursive Entity References in DTDs ('XML Entity Expansion')",
          cwe: "CWE-776",
          description:
            "An XML parser expands nested entity references without a depth/count limit, letting a small malicious document (a 'billion laughs' attack) exhaust memory or CPU.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-05",
      category: "Business Logic Testing",
      label: "Test Upload of Unexpected File Types",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Unrestricted Upload of File with Dangerous Type",
          cwe: "CWE-434",
          description:
            "The upload feature doesn't validate file type/content, allowing an attacker to upload and potentially execute a malicious file.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-09",
      category: "Business Logic Testing",
      label: "Test for Circumvention of Work Flows",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Enforcement of Behavioral Workflow",
          cwe: "CWE-840",
          description:
            "A multi-step process (e.g. checkout, approval) can be reordered or steps skipped, bypassing intended business rules.",
        },
      ],
    },
    {
      id: "WSTG-CLNT-05",
      category: "Client-side Testing",
      label: "Testing for Cross Origin Resource Sharing",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure CORS Configuration",
          cwe: "CWE-942",
          description:
            "The CORS policy is overly permissive (e.g. reflects any Origin with credentials allowed), letting untrusted sites read authenticated responses.",
        },
      ],
    },
    {
      id: "WSTG-CLNT-09",
      category: "Client-side Testing",
      label: "Testing for Clickjacking",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Clickjacking (UI Redressing)",
          cwe: "CWE-1021",
          description:
            "The page can be framed by another site and doesn't prevent it, letting an attacker trick users into clicking hidden UI elements.",
        },
      ],
    },
    {
      id: "WSTG-APIT-01",
      category: "API Testing",
      label: "Testing GraphQL",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "GraphQL Introspection / Excessive Data Exposure",
          cwe: "CWE-200",
          description:
            "GraphQL introspection is left enabled in production and/or resolvers return more data than the client needs, exposing schema and sensitive fields.",
        },
      ],
    },
    {
      id: "WSTG-CRYP-01",
      category: "Testing for Weak Cryptography",
      label: "Testing for Weak Transport Layer Security",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Weak TLS Configuration",
          cwe: "CWE-326",
          description:
            "The server supports outdated TLS versions, weak cipher suites, or an invalid certificate chain.",
        },
      ],
    },
    {
      id: "WSTG-CRYP-04",
      category: "Testing for Weak Cryptography",
      label: "Testing for Weak Encryption",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficient Entropy",
          cwe: "CWE-331",
          description:
            "Keys, tokens, or nonces are generated with insufficient randomness, making them predictable or brute-forceable.",
        },
        {
          name: "Use of Insufficiently Random Values",
          cwe: "CWE-330",
          description:
            "A value that must be unpredictable (token, ID, nonce) is generated with a source of randomness that isn't unpredictable enough, making it guessable.",
        },
        {
          name: "Incorrect Usage of Seeds in Pseudo-Random Number Generator (PRNG)",
          cwe: "CWE-335",
          description:
            "A PRNG is seeded with a predictable or reused value, making its entire output sequence predictable despite using an otherwise adequate algorithm.",
        },
      ],
    },
    {
      id: "WSTG-INPV-07",
      category: "Input Validation Testing",
      label: "Testing for LDAP Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "LDAP Injection",
          cwe: "CWE-90",
          description:
            "Unsanitized user input is used to build an LDAP query/filter, letting an attacker alter directory query logic.",
        },
      ],
    },
    {
      id: "WSTG-INPV-08",
      category: "Input Validation Testing",
      label: "Testing for XPath Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "XPath Injection",
          cwe: "CWE-643",
          description:
            "Unsanitized user input is used to build an XPath expression, letting an attacker alter XML document query logic.",
        },
        {
          name: "XML Injection (aka Blind XPath Injection)",
          cwe: "CWE-91",
          description:
            "Untrusted input is embedded into XML content or structure without proper escaping, letting an attacker alter the XML document's meaning even without a full XPath query being built.",
        },
      ],
    },
    {
      id: "WSTG-INPV-17",
      category: "Input Validation Testing",
      label: "Testing for Server-Side Request Forgery",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Server-Side Request Forgery (SSRF)",
          cwe: "CWE-918",
          description:
            "The server can be made to issue attacker-controlled requests to internal or arbitrary destinations, exposing internal services or cloud metadata.",
        },
        {
          name: "Externally Controlled Reference to a Resource in Another Sphere",
          cwe: "CWE-610",
          description:
            "A reference to a resource (URL, file path, hostname) is taken from attacker-controlled input and dereferenced without restricting which resources it may point to.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-07",
      category: "Business Logic Testing",
      label: "Test Defenses Against Application Misuse",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficient Anti-automation / Rate Limiting",
          cwe: "CWE-799",
          description:
            "The application doesn't limit the rate/frequency of sensitive actions (login, checkout, API calls), enabling abuse or brute-forcing.",
        },
      ],
    },
    {
      id: "WSTG-CLNT-07",
      category: "Client-side Testing",
      label: "Testing for Client-side Storage",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure Client-side Storage",
          cwe: "CWE-922",
          description:
            "Sensitive data is stored in browser localStorage/sessionStorage/IndexedDB, where it's accessible to any script running on the page (e.g. via XSS).",
        },
      ],
    },
    {
      id: "WSTG-CONF-06",
      category: "Configuration and Deployment Management Testing",
      label: "Test HTTP Methods",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Trusting HTTP Permission Methods on the Server Side",
          cwe: "CWE-650",
          description:
            "The server accepts dangerous or unnecessary HTTP methods (PUT, DELETE, TRACE) that should be disabled.",
        },
      ],
    },
    {
      id: "WSTG-CONF-10",
      category: "Configuration and Deployment Management Testing",
      label: "Review Old Backup and Unreferenced Files",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Exposure of Backup File to Unauthorized Control Sphere",
          cwe: "CWE-530",
          description:
            "Backup, temp, or unreferenced files (.bak, .old, .zip) are left reachable on the web server, potentially exposing source code or data.",
        },
        {
          name: "Files or Directories Accessible to External Parties",
          cwe: "CWE-552",
          description:
            "Files or directories not meant to be publicly reachable (source control metadata, config, backups) are placed within the web root or another externally-reachable location.",
        },
        {
          name: "Incomplete Cleanup",
          cwe: "CWE-459",
          description:
            "Temporary files, cached credentials, or other artifacts created during an operation aren't removed once no longer needed, remaining reachable on disk indefinitely.",
        },
      ],
    },
    {
      id: "WSTG-INFO-03",
      category: "Information Gathering",
      label: "Review Webserver Metafiles for Information Leakage",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Disclosure via robots.txt / sitemap.xml",
          cwe: "CWE-200",
          description:
            "Metafiles (robots.txt, sitemap.xml, .well-known) list hidden paths or admin sections that weren't meant to be advertised.",
        },
      ],
    },
    {
      id: "WSTG-INFO-04",
      category: "Information Gathering",
      label: "Enumerate Applications on Webserver",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Unintended Virtual Host / Application Exposure",
          cwe: "CWE-200",
          description:
            "Virtual hosts or applications sharing the same server IP are discoverable and reachable even though they weren't intended to be public-facing.",
        },
      ],
    },
    {
      id: "WSTG-INFO-05",
      category: "Information Gathering",
      label: "Review Webpage Content for Information Leakage",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Exposure Through Comments or Metadata",
          cwe: "CWE-540",
          description:
            "HTML/JS source, comments, or file metadata leak internal paths, usernames, or implementation notes not meant for end users.",
        },
      ],
    },
    {
      id: "WSTG-INFO-08",
      category: "Information Gathering",
      label: "Fingerprint Web Application Framework",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Exposure Through Framework Fingerprint",
          cwe: "CWE-200",
          description:
            "Response headers, cookie names, or error pages reveal the exact web framework in use, helping an attacker target known framework vulnerabilities.",
        },
      ],
    },
    {
      id: "WSTG-INFO-09",
      category: "Information Gathering",
      label: "Fingerprint Web Application",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Exposure Through Application Fingerprint",
          cwe: "CWE-200",
          description:
            "The specific CMS/application and version are identifiable (paths, generator meta tags), narrowing an attacker's exploit search to known CVEs.",
        },
      ],
    },
    {
      id: "WSTG-CONF-02",
      category: "Configuration and Deployment Management Testing",
      label: "Test Application Platform Configuration",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Security Misconfiguration in Application Platform",
          cwe: "CWE-16",
          description:
            "The application server/runtime (e.g. verbose debug mode, sample apps, directory listing) is left in an insecure default state.",
        },
      ],
    },
    {
      id: "WSTG-CONF-03",
      category: "Configuration and Deployment Management Testing",
      label: "Test File Extensions Handling for Sensitive Information",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Exposure Through Sensitive File Extension",
          cwe: "CWE-200",
          description:
            "Source or config file extensions (.php.bak, .env, .git) are served as plaintext instead of being blocked or processed, leaking their contents.",
        },
        {
          name: "Improper Removal of Sensitive Information Before Storage or Transfer",
          cwe: "CWE-212",
          description:
            "Sensitive data embedded in a file, document, or object (metadata, hidden fields, revision history) isn't stripped before the file is shared or exported.",
        },
      ],
    },
    {
      id: "WSTG-CONF-08",
      category: "Configuration and Deployment Management Testing",
      label: "Test RIA Cross Domain Policy",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Overly Permissive Cross-domain Whitelist",
          cwe: "CWE-942",
          description:
            "crossdomain.xml / clientaccesspolicy.xml grants overly broad cross-domain access, letting untrusted domains read the application's data.",
        },
      ],
    },
    {
      id: "WSTG-CONF-09",
      category: "Configuration and Deployment Management Testing",
      label: "Test File Permission",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Incorrect Permission Assignment for Critical Resource",
          cwe: "CWE-732",
          description:
            "Application files, config, or key material have overly permissive filesystem permissions, allowing unintended local access.",
        },
        {
          name: "Exposure of Resource to Wrong Sphere",
          cwe: "CWE-668",
          description:
            "A resource is made accessible to an actor or component that shouldn't have access to it, due to a mistake in how access boundaries were set up.",
        },
        {
          name: "Incorrect Default Permissions",
          cwe: "CWE-276",
          description:
            "A resource is created with default permissions that are broader than necessary, and nothing in the deployment process tightens them.",
        },
        {
          name: "Improper Preservation of Permissions",
          cwe: "CWE-281",
          description:
            "Permissions are not correctly carried over when a resource is copied, moved, or its ownership changes, potentially leaving it more exposed than intended.",
        },
        {
          name: "Incorrect Resource Transfer Between Spheres",
          cwe: "CWE-669",
          description:
            "A resource is transferred from one trust boundary or component to another without the checks appropriate for crossing that boundary, letting untrusted data or a privileged handle end up somewhere it shouldn't.",
        },
      ],
    },
    {
      id: "WSTG-CONF-11",
      category: "Configuration and Deployment Management Testing",
      label: "Test for Subdomain Takeover",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Subdomain Takeover",
          cwe: "CWE-284",
          description:
            "A DNS record points to a decommissioned third-party service (CDN, SaaS, cloud host), letting an attacker claim it and serve content under the organization's domain.",
        },
      ],
    },
    {
      id: "WSTG-CONF-12",
      category: "Configuration and Deployment Management Testing",
      label: "Test Cloud Storage",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure Cloud Storage Bucket Permissions",
          cwe: "CWE-284",
          description:
            "A cloud storage bucket (S3, GCS, Azure Blob) is misconfigured for public or overly broad read/write access, exposing or endangering its contents.",
        },
      ],
    },
    {
      id: "WSTG-IDNT-01",
      category: "Identity Management Testing",
      label: "Test Role Definitions",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficiently Defined or Overlapping Roles",
          cwe: "CWE-269",
          description:
            "Application roles are poorly separated or overlap in privilege, making least-privilege access control impossible to enforce correctly.",
        },
      ],
    },
    {
      id: "WSTG-IDNT-02",
      category: "Identity Management Testing",
      label: "Test User Registration Process",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficient Verification of Registration Identity",
          description:
            "Self-registration doesn't verify ownership of the supplied identity (email/phone) or allows registering privileged/reserved account names.",
        },
      ],
    },
    {
      id: "WSTG-IDNT-05",
      category: "Identity Management Testing",
      label: "Testing for Weak or Unenforced Username Policy",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Predictable Username Scheme",
          cwe: "CWE-200",
          description:
            "Usernames follow a predictable sequential or formulaic pattern (e.g. employee IDs), making account enumeration and targeted attacks easier.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-05",
      category: "Authentication Testing",
      label: "Testing for Vulnerable Remember Password",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Weak Password Recovery/Persistence Mechanism",
          cwe: "CWE-539",
          description:
            "The \"remember me\" feature stores a long-lived, predictable, or unencrypted token/cookie that can be replayed to impersonate the user.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-06",
      category: "Authentication Testing",
      label: "Testing for Browser Cache Weaknesses",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Sensitive Information Cached by Browser",
          cwe: "CWE-525",
          description:
            "Pages containing sensitive data are missing Cache-Control/Pragma headers, letting the browser cache them where a shared/public machine's next user could retrieve them.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-10",
      category: "Authentication Testing",
      label: "Testing for Weaker Authentication in Alternative Channel",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Inconsistent Authentication Strength Across Channels",
          cwe: "CWE-307",
          description:
            "A secondary channel (IVR, legacy API, mobile-only endpoint) enforces weaker authentication than the primary web flow, giving an attacker an easier path in.",
        },
      ],
    },
    {
      id: "WSTG-ATHN-11",
      category: "Authentication Testing",
      label: "Testing Multi-Factor Authentication",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing or Bypassable Multi-Factor Authentication",
          cwe: "CWE-308",
          description:
            "MFA is absent, optional for sensitive accounts, or can be bypassed (e.g. by skipping a step, response manipulation, or backup-code brute force).",
        },
      ],
    },
    {
      id: "WSTG-SESS-03",
      category: "Session Management Testing",
      label: "Testing for Exposed Session Variables",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Session Data Exposed in URL or Client-Readable Storage",
          cwe: "CWE-598",
          description:
            "Session identifiers or sensitive session data appear in the URL, browser history, or logs instead of being confined to a secure cookie.",
        },
      ],
    },
    {
      id: "WSTG-SESS-04",
      category: "Session Management Testing",
      label: "Testing for Logout Functionality",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficient Logout",
          cwe: "CWE-613",
          description:
            "Logging out doesn't invalidate the session server-side (or other active sessions), so a stolen session token remains usable afterward.",
        },
      ],
    },
    {
      id: "WSTG-SESS-06",
      category: "Session Management Testing",
      label: "Testing for Session Puzzling",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Session Variable Overloading (Session Puzzling)",
          cwe: "CWE-841",
          description:
            "A session attribute set in one workflow is reused with different trust assumptions in another, letting an attacker manipulate application logic.",
        },
      ],
    },
    {
      id: "WSTG-SESS-08",
      category: "Session Management Testing",
      label: "Testing for Session Hijacking",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Session Hijacking",
          cwe: "CWE-384",
          description:
            "A predictable, leaked, or unencrypted session token lets an attacker take over an authenticated user's session.",
        },
      ],
    },
    {
      id: "WSTG-SESS-10",
      category: "Session Management Testing",
      label: "Testing JSON Web Tokens",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Verification of JWT Signature",
          cwe: "CWE-347",
          description:
            "The JWT implementation accepts tokens with the alg set to 'none', a weak/guessable HMAC secret, or fails to verify the signature at all.",
        },
      ],
    },
    {
      id: "WSTG-INPV-03",
      category: "Input Validation Testing",
      label: "Testing for HTTP Verb Tampering",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Restriction of HTTP Verbs",
          cwe: "CWE-650",
          description:
            "Access control is enforced only for specific HTTP methods (e.g. GET), letting an attacker bypass it by switching verb (e.g. HEAD, POST).",
        },
      ],
    },
    {
      id: "WSTG-INPV-06",
      category: "Input Validation Testing",
      label: "Testing for NoSQL Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "NoSQL Injection",
          cwe: "CWE-943",
          description:
            "Unsanitized input is passed into a NoSQL query operator/object (e.g. MongoDB $where/$ne), letting an attacker alter query logic or extract data.",
        },
      ],
    },
    {
      id: "WSTG-INPV-09",
      category: "Input Validation Testing",
      label: "Testing for IMAP/SMTP Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "IMAP/SMTP Injection",
          cwe: "CWE-93",
          description:
            "Unsanitized input reaches a mail command (e.g. a contact form building a raw SMTP/IMAP command), letting an attacker inject additional commands or headers.",
        },
      ],
    },
    {
      id: "WSTG-INPV-10",
      category: "Input Validation Testing",
      label: "Testing for Code Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Code Injection",
          cwe: "CWE-94",
          description:
            "Untrusted input is passed to a dynamic code evaluation function (eval, deserialization, template rendering), allowing arbitrary code execution.",
        },
        {
          name: "Expression Language Injection",
          cwe: "CWE-917",
          description:
            "Untrusted input is evaluated as part of a server-side expression language statement (e.g. OGNL, SpEL), letting an attacker execute arbitrary expressions — often leading to remote code execution.",
        },
        {
          name: "Improper Control of Dynamically-Managed Code Resources",
          cwe: "CWE-913",
          description:
            "The application loads or executes code/resources selected dynamically based on attacker-influenceable input, without restricting what can be loaded.",
        },
        {
          name: "Unsafe Reflection",
          cwe: "CWE-470",
          description:
            "A class or method to instantiate/invoke is selected using attacker-controlled input via reflection, letting an attacker execute arbitrary classes present on the classpath.",
        },
      ],
    },
    {
      id: "WSTG-INPV-13",
      category: "Input Validation Testing",
      label: "Testing for Format String Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Format String Vulnerability",
          cwe: "CWE-134",
          description:
            "User input is passed directly as a format string argument, allowing memory disclosure or a crash/DoS in native-code components.",
        },
      ],
    },
    {
      id: "WSTG-INPV-15",
      category: "Input Validation Testing",
      label: "Testing for HTTP Splitting/Smuggling",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "HTTP Request/Response Smuggling",
          cwe: "CWE-444",
          description:
            "Inconsistent parsing of Content-Length/Transfer-Encoding between front-end proxy and back-end server lets an attacker smuggle a second hidden request.",
        },
        {
          name: "Interpretation Conflict",
          cwe: "CWE-436",
          description:
            "Two components in the request path (e.g. a proxy and a backend server) parse the same input differently, and an attacker crafts input that means one thing to the first component and another to the second.",
        },
      ],
    },
    {
      id: "WSTG-INPV-19",
      category: "Input Validation Testing",
      label: "Testing for Mass Assignment",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Mass Assignment",
          cwe: "CWE-915",
          description:
            "The API binds client-supplied JSON directly onto an internal object without an allow-list, letting an attacker set fields (e.g. isAdmin) that shouldn't be client-controlled.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-01",
      category: "Business Logic Testing",
      label: "Test Business Logic Data Validation",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Business Logic Data Validation",
          cwe: "CWE-20",
          description:
            "The application validates input for syntax but not for real-world business plausibility (e.g. negative quantities, absurd dates), allowing logic abuse.",
        },
        {
          name: "Improper Validation of Specified Quantity in Input",
          cwe: "CWE-1284",
          description:
            "A quantity supplied in input (an amount, a count, a size) is used without validating it's within a sane range, letting an attacker submit an absurd value that breaks downstream logic.",
        },
        {
          name: "Improper Neutralization of Formula Elements in a CSV File",
          cwe: "CWE-1236",
          description:
            "Data a user controls is written into an exported CSV/spreadsheet without neutralizing leading formula characters (=, +, -, @), letting the formula execute when the file is opened in a spreadsheet application.",
        },
        {
          name: "Incorrect Calculation",
          cwe: "CWE-682",
          description:
            "A calculation central to a security decision (a price, a permission bitmask, a checksum) is implemented incorrectly, producing a wrong result that's then trusted.",
        },
        {
          name: "Incorrect Comparison",
          cwe: "CWE-697",
          description:
            "A comparison used for a security decision (equality of a token, a permission level) is implemented incorrectly, silently weakening the check.",
        },
        {
          name: "Always-Incorrect Control Flow Implementation",
          cwe: "CWE-670",
          description:
            "A block of logic meant to implement a specific control-flow decision is structured so it can never actually produce the intended outcome, silently defeating whatever check it was meant to enforce.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-02",
      category: "Business Logic Testing",
      label: "Test Ability to Forge Requests",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "External Control of Assumed-Immutable Web Parameter",
          cwe: "CWE-472",
          description:
            "A parameter the server treats as fixed (price, role, account ID) is actually accepted from client input, letting an attacker forge a request that tampers with it.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-03",
      category: "Business Logic Testing",
      label: "Test Integrity Checks",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficient Verification of Data Authenticity",
          cwe: "CWE-345",
          description:
            "Client-supplied values that should be tamper-proof (price, discount, signed state) aren't verified server-side, letting a client just change them.",
        },
        {
          name: "Improper Validation of Integrity Check Value",
          cwe: "CWE-354",
          description:
            "An integrity check value (checksum, HMAC, signature) is present but not actually validated correctly, giving a false sense of tamper protection.",
        },
        {
          name: "Improper Enforcement of Message Integrity During Transmission",
          cwe: "CWE-924",
          description:
            "Messages sent over a communication channel aren't protected against in-transit tampering, letting a network-positioned attacker modify them without detection.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-04",
      category: "Business Logic Testing",
      label: "Test for Process Timing",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Observable Timing Discrepancy",
          cwe: "CWE-208",
          description:
            "Response-time differences between valid and invalid inputs (usernames, tokens, OTPs) let an attacker infer information via timing analysis.",
        },
      ],
    },
    {
      id: "WSTG-BUSL-06",
      category: "Business Logic Testing",
      label: "Test for the Circumvention of Work Flows Leading to Denial of Service",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Uncontrolled Resource Consumption",
          cwe: "CWE-400",
          description:
            "An expensive operation (report generation, search, file processing) has no rate or resource limit, letting a single user exhaust server resources.",
        },
        {
          name: "Allocation of Resources Without Limits or Throttling",
          cwe: "CWE-770",
          description:
            "The application allocates a resource (memory, file handles, DB connections, background jobs) in response to a request without capping how much a single client can consume.",
        },
        {
          name: "Inefficient Regular Expression Complexity",
          cwe: "CWE-1333",
          description:
            "A regular expression used against user-controlled input has catastrophic backtracking behavior, letting an attacker craft a short input that takes an extremely long time to match (ReDoS).",
        },
        {
          name: "Uncontrolled Recursion",
          cwe: "CWE-674",
          description:
            "A recursive function has no depth limit tied to untrusted input, letting an attacker trigger a stack exhaustion crash with deeply nested or self-referential input.",
        },
        {
          name: "Excessive Iteration",
          cwe: "CWE-834",
          description:
            "A loop's iteration count is derived from attacker-controlled input with no upper bound, letting an attacker force an excessively long-running operation.",
        },
        {
          name: "Loop with Unreachable Exit Condition ('Infinite Loop')",
          cwe: "CWE-835",
          description:
            "A loop's exit condition can never be satisfied for certain attacker-controlled input, hanging the thread/process indefinitely.",
        },
        {
          name: "Inefficient Algorithmic Complexity",
          cwe: "CWE-407",
          description:
            "An algorithm's time or space complexity scales poorly with attacker-controlled input size, letting a modestly sized input cause disproportionate resource consumption.",
        },
      ],
    },
    {
      id: "WSTG-CLNT-02",
      category: "Client-side Testing",
      label: "Testing for JavaScript Execution",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Inclusion of Functionality from Untrusted Control Sphere",
          cwe: "CWE-829",
          description:
            "The page loads and executes third-party JavaScript without integrity checks (no SRI, no vetting), letting a compromised third party run arbitrary script in-context.",
        },
        {
          name: "Prototype Pollution",
          cwe: "CWE-1321",
          description:
            "Attacker-controlled input is merged into an object without guarding against keys like __proto__, letting the attacker inject properties onto the base Object prototype shared by the whole application.",
        },
      ],
    },
    {
      id: "WSTG-CLNT-03",
      category: "Client-side Testing",
      label: "Testing for HTML Injection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "HTML Injection",
          cwe: "CWE-80",
          description:
            "User input is rendered as raw HTML without encoding, letting an attacker inject markup that alters page structure or content (even without executable script).",
        },
      ],
    },
    {
      id: "WSTG-CLNT-04",
      category: "Client-side Testing",
      label: "Testing for Client-side URL Redirect",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Open Redirect",
          cwe: "CWE-601",
          description:
            "A redirect parameter accepts an arbitrary destination URL, letting an attacker craft a link that appears trusted but lands the victim on a phishing site.",
        },
      ],
    },
    {
      id: "WSTG-CLNT-08",
      category: "Client-side Testing",
      label: "Testing for WebSockets",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure WebSocket Implementation",
          cwe: "CWE-346",
          description:
            "The WebSocket handshake doesn't validate the Origin header or use authentication, letting a malicious page open a connection on the victim's behalf (cross-site WebSocket hijacking).",
        },
      ],
    },
    {
      id: "WSTG-CLNT-12",
      category: "Client-side Testing",
      label: "Testing for Client-side Resource Manipulation",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Client-side Resource Manipulation",
          cwe: "CWE-829",
          description:
            "Client-side code builds a resource reference (script src, API endpoint) from attacker-influenceable data, letting it be redirected to an untrusted source.",
        },
      ],
    },
    {
      id: "WSTG-CRYP-03",
      category: "Testing for Weak Cryptography",
      label: "Testing for Sensitive Information Sent via Unencrypted Channels",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Cleartext Transmission of Sensitive Information",
          cwe: "CWE-319",
          description:
            "Sensitive data beyond just login credentials (session tokens, PII, payment data) travels over an unencrypted channel at some point in the flow.",
        },
      ],
    },
    {
      id: "WSTG-ERRH-02",
      category: "Testing for Error Handling",
      label: "Testing for Stack Traces",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Exposure of Sensitive System Information via Stack Trace",
          cwe: "CWE-497",
          description:
            "Unhandled exceptions return a full stack trace to the client, revealing internal file paths, library versions, and code structure.",
        },
      ],
    },
  ],
  "owasp-mastg": [
    {
      id: "MSTG-STORAGE-1",
      category: "Data Storage",
      label: "Testing Local Data Storage for Sensitive Data",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure Storage of Sensitive Information",
          cwe: "CWE-312",
          description:
            "Sensitive data (credentials, tokens, PII) is stored on the device in cleartext or in a location accessible to other apps/processes.",
        },
        {
          name: "SQL Injection (Local Database)",
          cwe: "CWE-89",
          description:
            "Unsanitized input is concatenated into a query against the app's local SQLite database, letting a malicious input source (e.g. a shared file, IPC) manipulate on-device data.",
        },
      ],
    },
    {
      id: "MSTG-CRYPTO-1",
      category: "Cryptography",
      label: "Verifying the Configuration of Cryptographic Standard Algorithms",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of a Broken or Risky Cryptographic Algorithm",
          cwe: "CWE-327",
          description:
            "The app uses a weak, deprecated, or custom cryptographic algorithm/mode that can be broken or bypassed.",
        },
      ],
    },
    {
      id: "MSTG-AUTH-1",
      category: "Authentication and Session Management",
      label: "Verifying that Users Are Logged Out on Client-Side",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Session Invalidation",
          cwe: "CWE-613",
          description:
            "Logging out client-side doesn't properly invalidate the session/token server-side, allowing continued use of the old credentials.",
        },
        {
          name: "Insufficiently Protected Credentials",
          cwe: "CWE-522",
          description:
            "Credentials or tokens are stored in SharedPreferences/UserDefaults/plist without hardware-backed encryption, recoverable by any process with local/root access.",
        },
      ],
    },
    {
      id: "MSTG-NETWORK-1",
      category: "Network Communication",
      label: "Verifying Data Encryption on the Network",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Cleartext Transmission of Sensitive Information",
          cwe: "CWE-319",
          description:
            "The app sends sensitive data over the network without adequate transport encryption (e.g. plain HTTP), exposing it to interception.",
        },
        {
          name: "Improper Restriction of XML External Entity Reference",
          cwe: "CWE-611",
          description:
            "The app parses XML received from the server without disabling external entity resolution, letting a compromised or MITM'd server trigger local file disclosure or SSRF from the device.",
        },
      ],
    },
    {
      id: "MSTG-PLATFORM-1",
      category: "Platform Interaction",
      label: "Testing App Permissions",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Excessive Platform Permissions",
          cwe: "CWE-250",
          description:
            "The app requests more device/OS permissions than it needs to function, increasing the impact if the app is compromised.",
        },
        {
          name: "Improper Restriction of Rendered UI Layers or Frames",
          cwe: "CWE-1021",
          description:
            "The app doesn't defend against another app drawing an overlay on top of its UI (tapjacking), which can trick the user into tapping something other than what's displayed.",
        },
      ],
    },
    {
      id: "MSTG-CODE-2",
      category: "Code Quality and Build Settings",
      label: "Testing for Insecure Data Storage in Build Configuration",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Hardcoded Credentials",
          cwe: "CWE-798",
          description:
            "Credentials, API keys, or secrets are embedded directly in the app binary/config and can be extracted via reverse engineering.",
        },
        {
          name: "Download of Code Without Integrity Check",
          cwe: "CWE-494",
          description:
            "The app fetches and executes a plugin, script, or code update at runtime without verifying its signature, letting a compromised CDN or MITM position push malicious code.",
        },
      ],
    },
    {
      id: "MSTG-RESILIENCE-1",
      category: "Resilience Against Reverse Engineering",
      label: "Testing Root/Jailbreak Detection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing Anti-Tampering / Root Detection",
          cwe: "CWE-693",
          description:
            "The app doesn't detect or react to running on a rooted/jailbroken device or under tampering, weakening its other security controls.",
        },
        {
          name: "On-Chip Debug Interface With Improper Access Control",
          cwe: "CWE-1191",
          description:
            "The device's JTAG/debug interface is left enabled and accessible, letting anyone with physical access to the hardware extract firmware or bypass software protections.",
        },
      ],
    },
    {
      id: "MSTG-STORAGE-2",
      category: "Data Storage",
      label: "Testing for Sensitive Data in Logs",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Sensitive Information in Log Files",
          cwe: "CWE-532",
          description: "The app writes credentials, tokens, or PII to system/app logs, where other apps or processes may read them.",
        },
      ],
    },
    {
      id: "MSTG-STORAGE-3",
      category: "Data Storage",
      label: "Testing Whether Sensitive Data Is Sent to Third Parties",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Sensitive Data Exposure to Unintended Third Party",
          cwe: "CWE-359",
          description:
            "Sensitive data is unintentionally shared with third-party SDKs/services (analytics, ads) bundled in the app.",
        },
      ],
    },
    {
      id: "MSTG-CRYPTO-2",
      category: "Cryptography",
      label: "Testing the Random Number Generator",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of a Weak Pseudo-Random Number Generator",
          cwe: "CWE-338",
          description:
            "The app uses a non-cryptographic PRNG for security-sensitive values (tokens, keys), making them predictable.",
        },
        {
          name: "Use of Insufficiently Random Values",
          cwe: "CWE-330",
          description:
            "A mobile-generated value that must be unpredictable (session token, one-time code) is derived from a source of randomness that isn't unpredictable enough.",
        },
      ],
    },
    {
      id: "MSTG-AUTH-2",
      category: "Authentication and Session Management",
      label: "Testing the Local Authentication",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Authentication (Local)",
          cwe: "CWE-287",
          description:
            "Local authentication (PIN/biometric gate) can be bypassed, e.g. because it's enforced only in the UI and not backed by the OS keystore.",
        },
      ],
    },
    {
      id: "MSTG-NETWORK-2",
      category: "Network Communication",
      label: "Testing the TLS Settings",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Weak TLS Configuration",
          cwe: "CWE-326",
          description: "The app accepts outdated TLS versions, weak ciphers, or invalid certificates.",
        },
      ],
    },
    {
      id: "MSTG-NETWORK-3",
      category: "Network Communication",
      label: "Testing Endpoint Identify Verification",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Certificate Validation",
          cwe: "CWE-295",
          description:
            "The app doesn't properly validate/pin the server's TLS certificate, allowing a man-in-the-middle to intercept traffic.",
        },
        {
          name: "Improper Validation of Certificate with Host Mismatch",
          cwe: "CWE-297",
          description:
            "The app validates that a certificate is signed by a trusted CA but never checks it was issued for the hostname it's actually connecting to, letting any valid cert from any domain be accepted.",
        },
      ],
    },
    {
      id: "MSTG-PLATFORM-3",
      category: "Platform Interaction",
      label: "Testing WebViews",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure WebView Configuration",
          cwe: "CWE-79",
          description:
            "A WebView loads untrusted content or has JavaScript/file access enabled unnecessarily, allowing script injection or local file access.",
        },
      ],
    },
    {
      id: "MSTG-CODE-4",
      category: "Code Quality and Build Settings",
      label: "Testing for Debugging Symbols",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Information Exposure Through Debug Information",
          cwe: "CWE-215",
          description: "The release build ships debug symbols or verbose logging, easing reverse engineering.",
        },
      ],
    },
    {
      id: "MSTG-CODE-8",
      category: "Code Quality and Build Settings",
      label: "Testing for Debuggable Apps",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Debuggable Release Build",
          cwe: "CWE-489",
          description: "The release build is flagged as debuggable, letting an attacker attach a debugger and inspect/modify runtime behavior.",
        },
      ],
    },
    {
      id: "MSTG-CODE-3",
      category: "Code Quality and Build Settings",
      label: "Testing Exception Handling",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Uncaught Exception",
          cwe: "CWE-248",
          description: "Unhandled exceptions crash the app or leak stack traces/internal state, aiding an attacker or degrading availability.",
        },
      ],
    },
    {
      id: "MSTG-CODE-5",
      category: "Code Quality and Build Settings",
      label: "Testing for Weaknesses in Third-Party Libraries",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of Unmaintained Third Party Components",
          cwe: "CWE-1104",
          description:
            "The app bundles a third-party SDK or library with known, unpatched vulnerabilities, or one that has stopped receiving security updates entirely.",
        },
        {
          name: "Embedded Malicious Code",
          cwe: "CWE-506",
          description:
            "A bundled third-party SDK or library contains code that behaves maliciously (exfiltrating data, ad fraud, backdoor behavior) beyond its stated purpose.",
        },
      ],
    },
    {
      id: "MSTG-PLATFORM-5",
      category: "Platform Interaction",
      label: "Testing the Security Provider",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Outdated or Insecure Cryptographic Provider",
          cwe: "CWE-327",
          description:
            "The app relies on an outdated platform crypto provider instead of requesting/verifying an up-to-date one, inheriting any weaknesses already patched upstream.",
        },
      ],
    },
    {
      id: "MSTG-STORAGE-8",
      category: "Data Storage",
      label: "Testing Backups for Sensitive Data",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Sensitive Data in App Backups",
          cwe: "CWE-530",
          description: "Device/cloud backups include sensitive app data that isn't excluded or encrypted, exposing it outside the app's sandbox.",
        },
      ],
    },
    {
      id: "MSTG-PLATFORM-2",
      category: "Platform Interaction",
      label: "Testing Deep Links",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of Implicit Intent for Sensitive Communication",
          cwe: "CWE-927",
          description:
            "A deep link/intent handler accepts sensitive actions from any calling app without validating the caller, letting a malicious app trigger it.",
        },
        {
          name: "URL Redirection to Untrusted Site ('Open Redirect')",
          cwe: "CWE-601",
          description:
            "A deep link handler redirects to a URL taken from the link's parameters without validating it stays within the app's trusted domains.",
        },
      ],
    },
    {
      id: "MSTG-PLATFORM-4",
      category: "Platform Interaction",
      label: "Testing for Sensitive Functionality Exposure Through IPC",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Export of Application Components",
          cwe: "CWE-926",
          description:
            "An app component (activity, service, content provider) is exported and reachable by other apps without proper permission checks.",
        },
        {
          name: "Missing Authentication for Critical Function",
          cwe: "CWE-306",
          description:
            "An exported app component (activity, service, broadcast receiver) performs a sensitive action without requiring the caller to authenticate first.",
        },
      ],
    },
    {
      id: "MSTG-RESILIENCE-2",
      category: "Resilience Against Reverse Engineering",
      label: "Testing Anti-Debugging Detection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing Anti-Debugging Controls",
          description: "The app doesn't detect or react to an attached debugger, easing dynamic analysis and runtime manipulation.",
        },
      ],
    },
    {
      id: "MSTG-STORAGE-4",
      category: "Data Storage",
      label: "Testing for Sensitive Data Disclosure Through the User Interface",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Sensitive Data Exposure Through UI",
          cwe: "CWE-200",
          description:
            "Sensitive fields (passwords, card numbers, tokens) are shown in plaintext on screen or in the task switcher/app preview snapshot.",
        },
      ],
    },
    {
      id: "MSTG-STORAGE-5",
      category: "Data Storage",
      label: "Testing Memory for Sensitive Data",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Cleartext Storage of Sensitive Information in Memory",
          cwe: "CWE-316",
          description:
            "Sensitive values remain in process memory as plaintext longer than necessary, exposing them to a memory dump on a rooted/jailbroken or compromised device.",
        },
      ],
    },
    {
      id: "MSTG-STORAGE-14",
      category: "Data Storage",
      label: "Checking for Sensitive Data in the Keyboard Cache",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Sensitive Data Cached by Keyboard/Autocorrect",
          cwe: "CWE-200",
          description:
            "Input fields carrying sensitive data don't disable autocorrect/suggestion caching, letting the OS keyboard persist that data outside the app's sandbox.",
        },
      ],
    },
    {
      id: "MSTG-CRYPTO-3",
      category: "Cryptography",
      label: "Verifying that Sensitive Data is Not Stored in Custom Keystores",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of Hard-coded or Custom Key Storage Instead of OS Keystore",
          cwe: "CWE-320",
          description:
            "Cryptographic keys are managed by custom, homegrown storage instead of the platform's hardware-backed keystore (Keychain/Keystore), weakening key protection.",
        },
        {
          name: "Improper Access Control",
          cwe: "CWE-284",
          description:
            "Cryptographic key material is accessible to other components or processes on the device beyond the ones that legitimately need it, because access to the keystore entry isn't restricted enough.",
        },
      ],
    },
    {
      id: "MSTG-CRYPTO-5",
      category: "Cryptography",
      label: "Testing Key Management",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Poor Key Management",
          cwe: "CWE-320",
          description:
            "Encryption keys are hardcoded, derived from a static seed, or never rotated, undermining the cryptography they're supposed to protect.",
        },
      ],
    },
    {
      id: "MSTG-AUTH-3",
      category: "Authentication and Session Management",
      label: "Testing Session Management",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Session Handling (Mobile)",
          cwe: "CWE-613",
          description:
            "Mobile session/refresh tokens never expire or aren't invalidated server-side on logout, letting a stolen device or token stay usable indefinitely.",
        },
      ],
    },
    {
      id: "MSTG-AUTH-9",
      category: "Authentication and Session Management",
      label: "Testing Biometric Authentication",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Biometric Authentication Implementation",
          cwe: "CWE-287",
          description:
            "Biometric unlock is implemented as a UI-only gate (not backed by the OS biometric API and hardware-backed key), letting it be bypassed by hooking or patching the app.",
        },
      ],
    },
    {
      id: "MSTG-NETWORK-4",
      category: "Network Communication",
      label: "Testing Custom Certificate Stores and Certificate Pinning",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing or Bypassable Certificate Pinning",
          cwe: "CWE-295",
          description:
            "The app has no certificate pinning (or it can be trivially bypassed, e.g. via a known Frida script), allowing MITM interception once a proxy CA is trusted on the device.",
        },
      ],
    },
    {
      id: "MSTG-PLATFORM-6",
      category: "Platform Interaction",
      label: "Testing Object Persistence for Sensitive Data",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Deserialization of Untrusted Data",
          cwe: "CWE-502",
          description:
            "The app deserializes objects from an untrusted source (IPC, file, network) without validation, potentially allowing object injection or code execution.",
        },
      ],
    },
    {
      id: "MSTG-CODE-1",
      category: "Code Quality and Build Settings",
      label: "Verifying That the App is Properly Signed",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Improper Verification of Application Signature",
          cwe: "CWE-347",
          description:
            "The app isn't signed with a proper release key, or the app itself doesn't verify its own signing certificate, allowing a re-signed/modified APK/IPA to run undetected.",
        },
        {
          name: "Missing Support for Integrity Check",
          cwe: "CWE-353",
          description:
            "The app has no mechanism to verify its own resources or runtime code haven't been modified since signing, so a repackaged/tampered APK/IPA runs without detection.",
        },
      ],
    },
    {
      id: "MSTG-CODE-9",
      category: "Code Quality and Build Settings",
      label: "Testing for Injection Flaws",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Injection Flaw in Native/Bridge Code",
          cwe: "CWE-74",
          description:
            "Untrusted input reaches a native SQL query, WebView JS bridge, or shell command inside the app, allowing injection in the mobile execution context.",
        },
        {
          name: "Improper Input Validation",
          cwe: "CWE-20",
          description:
            "The app processes data from an untrusted source (IPC, deep link, file, clipboard) without validating its structure or content before acting on it.",
        },
      ],
    },
    {
      id: "MSTG-RESILIENCE-4",
      category: "Resilience Against Reverse Engineering",
      label: "Detecting Reverse Engineering Tools and Frameworks",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing Detection of Reverse-Engineering Frameworks",
          cwe: "CWE-693",
          description:
            "The app doesn't detect common instrumentation frameworks (Frida, Xposed, Substrate) at runtime, easing dynamic hooking and logic bypass.",
        },
      ],
    },
    {
      id: "MSTG-RESILIENCE-10",
      category: "Resilience Against Reverse Engineering",
      label: "Testing Emulator Detection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing Emulator Detection",
          cwe: "CWE-693",
          description:
            "The app doesn't detect that it's running in an emulator, easing large-scale automated analysis, fraud, or credential-stuffing farms.",
        },
      ],
    },
  ],
  // The OWASP IoT Top 10 (2018) is itself the enumerated list — each category
  // below is one of its 10 items, so this is treated as guide content like
  // WSTG/MASTG rather than a curated derivation.
  "owasp-iot": [
    {
      id: "IOT-I1",
      category: "Weak, Guessable, or Hardcoded Passwords",
      label: "I1: Weak, Guessable, or Hardcoded Passwords",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of Hard-coded Credentials",
          cwe: "CWE-798",
          description:
            "The device ships with a hardcoded or undocumented account/password baked into firmware, letting anyone with the same model gain access.",
        },
        {
          name: "Weak Password Requirements",
          cwe: "CWE-521",
          description:
            "The device's admin interface accepts weak, default, or easily guessable passwords with no enforced complexity or forced change on first use.",
        },
        {
          name: "Insufficiently Protected Credentials",
          cwe: "CWE-522",
          description:
            "Device credentials are stored on-device or in the cloud backend without adequate protection, recoverable by anyone who gains access to the storage.",
        },
        {
          name: "Device Unlock Credential Sharing",
          cwe: "CWE-1273",
          description:
            "The same unlock/debug credential is shared across an entire product line or batch, so recovering it from one unit compromises every other unit of that model.",
        },
      ],
    },
    {
      id: "IOT-I2",
      category: "Insecure Network Services",
      label: "I2: Insecure Network Services",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Unnecessary Exposed Network Service",
          cwe: "CWE-16",
          description:
            "The device exposes network services (Telnet, unauthenticated debug ports, UPnP) beyond what its function requires, widening the remote attack surface.",
        },
        {
          name: "Improper Access Control",
          cwe: "CWE-284",
          description:
            "A network service exposed by the device performs a sensitive action without adequately verifying the caller is authorized to request it.",
        },
      ],
    },
    {
      id: "IOT-I3",
      category: "Insecure Ecosystem Interfaces",
      label: "I3: Insecure Ecosystem Interfaces",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Missing Authentication on Companion API/Cloud Interface",
          cwe: "CWE-306",
          description:
            "The web/mobile/cloud API the device talks to lacks authentication or authorization checks, letting an attacker control or query devices they don't own.",
        },
        {
          name: "Hardcoded API Key in Companion App",
          cwe: "CWE-798",
          description:
            "The mobile/web companion app embeds a shared API key or secret directly in its code, extractable by anyone who decompiles the app.",
        },
      ],
    },
    {
      id: "IOT-I4",
      category: "Lack of Secure Update Mechanism",
      label: "I4: Lack of Secure Update Mechanism",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Download of Code Without Integrity Check",
          cwe: "CWE-494",
          description:
            "Firmware updates aren't signed/verified before being applied, and often travel unencrypted, letting an attacker push malicious firmware via MITM or a fake update server.",
        },
        {
          name: "Firmware Not Updateable",
          cwe: "CWE-1277",
          description:
            "The device has no mechanism to receive firmware updates at all, so any vulnerability found after release can never be patched in already-deployed units.",
        },
      ],
    },
    {
      id: "IOT-I5",
      category: "Use of Insecure or Outdated Components",
      label: "I5: Use of Insecure or Outdated Components",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Use of Outdated Third-Party Components/Libraries",
          cwe: "CWE-1104",
          description:
            "The firmware bundles an outdated OS, kernel, or library (BusyBox, OpenSSL, etc.) with publicly known, unpatched vulnerabilities.",
        },
        {
          name: "Inclusion of Functionality from Untrusted Control Sphere",
          cwe: "CWE-829",
          description:
            "The firmware bundles a third-party component or library pulled in without vetting, inheriting whatever vulnerabilities or backdoors it contains.",
        },
        {
          name: "Reliance on Component That is Not Updateable",
          cwe: "CWE-1329",
          description:
            "The device depends on a third-party chip, module, or library that itself cannot be independently updated, tying the whole device's security lifecycle to a component the vendor doesn't control.",
        },
      ],
    },
    {
      id: "IOT-I6",
      category: "Insufficient Privacy Protection",
      label: "I6: Insufficient Privacy Protection",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insufficient Privacy Protection",
          cwe: "CWE-359",
          description:
            "The device or its companion app collects more personal data than necessary, or shares it with third parties, without adequate protection or user consent.",
        },
        {
          name: "Improper Removal of Sensitive Information Before Storage or Transfer",
          cwe: "CWE-212",
          description:
            "Telemetry or diagnostic data uploaded to the vendor's cloud retains more identifying/sensitive detail than the stated purpose requires.",
        },
      ],
    },
    {
      id: "IOT-I7",
      category: "Insecure Data Transfer and Storage",
      label: "I7: Insecure Data Transfer and Storage",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Cleartext Transmission of Sensitive Information",
          cwe: "CWE-319",
          description: "The device transmits credentials, telemetry, or personal data unencrypted, exposing it to interception on the local network or in transit to the cloud.",
        },
        {
          name: "Insecure Storage of Sensitive Information",
          cwe: "CWE-312",
          description: "Credentials, Wi-Fi PSKs, or tokens are stored on-device in plaintext or reversible form, recoverable from flash/firmware extraction.",
        },
      ],
    },
    {
      id: "IOT-I8",
      category: "Lack of Device Management",
      label: "I8: Lack of Device Management",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Lack of Device Management / Fleet Visibility",
          description:
            "There's no inventory, patch status tracking, or decommissioning process for deployed devices, so compromised or end-of-life units go unnoticed indefinitely.",
        },
        {
          name: "Improper Scrubbing of Sensitive Data from Decommissioned Device",
          cwe: "CWE-1266",
          description:
            "A device being retired, resold, or returned for warranty still contains recoverable credentials or user data because there's no secure wipe procedure before it leaves the owner's custody.",
        },
      ],
    },
    {
      id: "IOT-I9",
      category: "Insecure Default Settings",
      label: "I9: Insecure Default Settings",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "Insecure Default Configuration",
          cwe: "CWE-1188",
          description:
            "The device ships with insecure defaults (open admin port, weak default Wi-Fi, debug mode) that most deployments never change.",
        },
        {
          name: "Predictable Default Wi-Fi Credentials",
          cwe: "CWE-1391",
          description:
            "The device's default Wi-Fi password is derived from a public identifier (serial number, MAC address) using a known algorithm, making it guessable at scale across all units of that model.",
        },
      ],
    },
    {
      id: "IOT-I10",
      category: "Lack of Physical Hardening",
      label: "I10: Lack of Physical Hardening",
      fromGuide: true,
      suggestedVulnerabilities: [
        {
          name: "On-Chip Debug Interface With Improper Access Control",
          cwe: "CWE-1191",
          description:
            "JTAG/UART/SWD debug interfaces are left enabled and accessible on the board, letting anyone with physical access dump firmware, extract keys, or gain a root shell.",
        },
        {
          name: "Improper Protection of Physical Side Channels",
          cwe: "CWE-1300",
          description:
            "The device's power consumption, electromagnetic emissions, or timing leak information about secret data being processed, letting an attacker recover keys or PINs via side-channel analysis without breaking the algorithm itself.",
        },
        {
          name: "Improper Physical Access Control",
          cwe: "CWE-1263",
          description:
            "Physical access to the device's internals (case, ports, test points) isn't restricted enough to prevent tampering, chip removal, or direct bus access.",
        },
        {
          name: "Sensitive Non-Volatile Information Not Protected During Debug",
          cwe: "CWE-1243",
          description:
            "Keys or other sensitive data stored in non-volatile memory remain readable through the debug interface instead of being locked out once debug access is enabled.",
        },
        {
          name: "Internal Asset Exposed to Unsafe Debug Access Level or State",
          cwe: "CWE-1244",
          description:
            "An internal asset (key material, memory region) is reachable at a debug access level that's less restrictive than what that asset actually requires.",
        },
        {
          name: "Exposure of Sensitive System Information Due to Uncleared Debug Information",
          cwe: "CWE-1258",
          description:
            "Debug registers or buffers retain sensitive data from normal operation and are readable after switching into a debug state, without being cleared first.",
        },
        {
          name: "Missing Immutable Root of Trust in Hardware",
          cwe: "CWE-1326",
          description:
            "The device has no hardware-anchored root of trust to bootstrap a secure boot chain, so its entire software stack can be replaced by an attacker with no cryptographic anchor to detect it.",
        },
      ],
    },
  ],
  // ICS/OT categories are informed by NIST SP 800-82 and IEC 62443 zone/conduit
  // concepts rather than a single numbered test-case guide — curated common
  // findings per domain, not verbatim guide content.
  "ics-ot": [
    {
      id: "OT-NET-01",
      category: "Network Architecture & Segmentation",
      label: "IT/OT boundary and zone segmentation",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Flat Network Allows IT-to-OT Pivoting",
          cwe: "CWE-284",
          description:
            "The IT and OT networks aren't segmented (or the boundary firewall/DMZ is misconfigured), letting an attacker who compromises the corporate network reach control-system assets directly.",
        },
        {
          name: "Missing Zone/Conduit Model Enforcement",
          cwe: "CWE-284",
          description:
            "Traffic between security zones (per IEC 62443 zone/conduit design) isn't restricted to the specific conduits and protocols actually needed.",
        },
        {
          name: "Exposure of Resource to Wrong Sphere",
          cwe: "CWE-668",
          description:
            "An OT-segment resource (HMI, historian, engineering workstation) is reachable from the IT network or the internet due to a segmentation boundary that isn't actually enforced.",
        },
      ],
    },
    {
      id: "OT-PROTO-01",
      category: "Industrial Protocol Security",
      label: "Modbus, DNP3, S7comm, BACnet and other OT protocols",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Unauthenticated Industrial Protocol Commands",
          cwe: "CWE-306",
          description:
            "The industrial protocol in use (Modbus/DNP3/S7comm/BACnet) has no built-in authentication, so anyone who can reach the port can issue read/write commands to the controller.",
        },
        {
          name: "Cleartext Industrial Protocol Traffic",
          cwe: "CWE-319",
          description:
            "Control traffic travels unencrypted across the OT network, letting an attacker on the same segment observe or replay commands.",
        },
        {
          name: "Insufficient Verification of Data Authenticity",
          cwe: "CWE-345",
          description:
            "The industrial protocol accepts control commands without verifying they genuinely originated from an authorized engineering station.",
        },
      ],
    },
    {
      id: "OT-HMI-01",
      category: "HMI & Engineering Workstation Security",
      label: "Human-machine interface and engineering workstation hardening",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Engineering Workstation Running Outdated/Unsupported OS",
          cwe: "CWE-1104",
          description:
            "The HMI or engineering workstation runs an end-of-life OS (e.g. Windows XP/7) that can no longer receive security patches, chosen for compatibility with legacy control software.",
        },
        {
          name: "Default Vendor Credentials on HMI/SCADA Software",
          cwe: "CWE-1392",
          description:
            "The HMI or SCADA supervisory software still uses its vendor-supplied default account and password.",
        },
        {
          name: "Insufficiently Protected Credentials",
          cwe: "CWE-522",
          description:
            "Operator/engineer credentials for the HMI or SCADA software are stored or transmitted without adequate protection, recoverable from the workstation.",
        },
      ],
    },
    {
      id: "OT-CTRL-01",
      category: "Controller (PLC/RTU) Security",
      label: "PLC/RTU logic and firmware integrity",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "PLC Logic Modification Without Authentication",
          cwe: "CWE-306",
          description:
            "The controller accepts logic/program uploads from the engineering software without authenticating the requester, letting anyone on the network reprogram it.",
        },
        {
          name: "Missing Firmware Integrity Verification",
          cwe: "CWE-494",
          description:
            "The controller doesn't verify a cryptographic signature before accepting a firmware update, allowing malicious firmware to be flashed.",
        },
        {
          name: "Inclusion of Functionality from Untrusted Control Sphere",
          cwe: "CWE-829",
          description:
            "A PLC program block or library from an untrusted or unverified source is loaded onto the controller without review.",
        },
        {
          name: "Improper Protection against Electromagnetic Fault Injection (EM-FI)",
          cwe: "CWE-1319",
          description:
            "The controller's security logic (authentication check, safety interlock) can be disrupted by an electromagnetic fault injected from outside the chip package, skipping or corrupting the check.",
        },
        {
          name: "Improper Protection Against Voltage and Clock Glitches",
          cwe: "CWE-1247",
          description:
            "The controller doesn't detect or react to out-of-spec voltage or clock glitches, which an attacker can use to skip security-critical instructions (a classic technique against safety/authentication logic).",
        },
      ],
    },
    {
      id: "OT-REMOTE-01",
      category: "Remote & Vendor Access",
      label: "Third-party and remote maintenance access",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Insecure Remote Access to OT Network",
          cwe: "CWE-284",
          description:
            "Remote access into the OT environment (VPN, remote desktop, vendor jump box) lacks MFA or is broader in scope than the specific maintenance task requires.",
        },
        {
          name: "Vendor Backdoor / Undocumented Maintenance Account",
          cwe: "CWE-798",
          description:
            "An integrator or vendor left an undocumented remote-access account or modem active after commissioning, unknown to the asset owner's security team.",
        },
        {
          name: "Use of Single-factor Authentication",
          cwe: "CWE-308",
          description:
            "Remote access into the OT environment relies on a password alone, with no second factor, for an access path that reaches safety-critical systems.",
        },
      ],
    },
    {
      id: "OT-SAFETY-01",
      category: "Safety and Availability Impact",
      label: "Impact on safety instrumented systems and process availability",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Denial of Service Impacting Safety Instrumented System",
          cwe: "CWE-400",
          description:
            "A discovered network/protocol weakness could be used to flood or crash a safety instrumented system (SIS) or its communication path, risking an unsafe process state.",
        },
        {
          name: "Missing Fail-Safe State on Communication Loss",
          description:
            "A controller or actuator doesn't fall back to a defined safe state when it loses communication with its controlling system, risking unpredictable physical behavior during an attack or outage.",
        },
        {
          name: "Improper Restriction of Power Consumption",
          cwe: "CWE-920",
          description:
            "The device doesn't limit operations that consume significant power, letting an attacker remotely drain a battery-powered device's power supply well ahead of its expected lifetime.",
        },
      ],
    },
  ],
  // PTES phases don't enumerate vulnerabilities themselves — these are common
  // findings typically associated with each phase, curated for this catalog.
  ptes: [
    {
      id: "PTES-TM",
      category: "Threat Modeling",
      label: "Business asset and threat-agent identification",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Missing Business-Critical Asset Identification",
          description:
            "The engagement scope was defined without first mapping which assets are actually business-critical, risking effort spent on low-value targets while real crown jewels go untested.",
        },
        {
          name: "Threat Model Ignores Realistic Attacker Profile",
          description:
            "Defenses are designed against a generic attacker rather than the threat agents realistically motivated to target this organization (competitors, insiders, organized crime).",
        },
      ],
    },
    {
      id: "PTES-IG",
      category: "Intelligence Gathering",
      label: "Open-source / passive reconnaissance",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Information Disclosure via Public Sources",
          cwe: "CWE-200",
          description:
            "Sensitive internal details (employee names, tech stack, subdomains, leaked credentials) are exposed through public sources, aiding an attacker's planning.",
        },
        {
          name: "DNS Zone Transfer Misconfiguration",
          cwe: "CWE-200",
          description:
            "A DNS server allows unauthenticated zone transfers (AXFR), dumping the organization's entire internal/external DNS record set to anyone who asks.",
        },
        {
          name: "Excessive Employee Metadata Exposure",
          cwe: "CWE-200",
          description:
            "Document metadata, code commit history, or job postings reveal internal usernames, software versions, or infrastructure details useful for a targeted attack.",
        },
        {
          name: "Improper Removal of Sensitive Information Before Storage or Transfer",
          cwe: "CWE-212",
          description:
            "Publicly available documents or exported files retain metadata (author names, internal paths, revision history) that wasn't stripped before release.",
        },
      ],
    },
    {
      id: "PTES-VA",
      category: "Vulnerability Analysis",
      label: "Active/passive vulnerability scanning",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Missing Security Patches / Known-Vulnerable Component",
          cwe: "CWE-1104",
          description:
            "The target runs outdated software with publicly known vulnerabilities that haven't been patched.",
        },
        {
          name: "Security Misconfiguration",
          cwe: "CWE-16",
          description:
            "A component is deployed with insecure default settings, unnecessary features enabled, or missing hardening.",
        },
        {
          name: "Unencrypted Sensitive Data at Rest",
          cwe: "CWE-311",
          description: "Sensitive data on disk or in a database is stored without encryption, exposing it if the storage is accessed directly.",
        },
        {
          name: "Default Configuration Left Unchanged",
          cwe: "CWE-1188",
          description:
            "A component is deployed and put into production with its insecure factory-default configuration never reviewed or hardened.",
        },
        {
          name: "Weak Encryption Algorithm in Use",
          cwe: "CWE-327",
          description:
            "A scanned service negotiates or defaults to a broken/deprecated cryptographic algorithm or protocol version.",
        },
        {
          name: "Exposure of Resource to Wrong Sphere",
          cwe: "CWE-668",
          description:
            "A scan turns up a resource (share, service, admin panel) reachable by a broader audience than intended, due to a boundary that was never correctly set up.",
        },
      ],
    },
    {
      id: "PTES-EXP",
      category: "Exploitation",
      label: "Gaining access",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Remote Code Execution",
          cwe: "CWE-94",
          description: "A flaw allows an attacker to execute arbitrary code on the target system.",
        },
        {
          name: "Authentication Bypass",
          cwe: "CWE-287",
          description: "A flaw in the authentication logic lets an attacker gain access without valid credentials.",
        },
        {
          name: "SQL Injection Leading to Full Compromise",
          cwe: "CWE-89",
          description:
            "A SQL injection point is exploitable to the point of reading credentials, writing a webshell, or achieving OS command execution via the database.",
        },
        {
          name: "Deserialization of Untrusted Data",
          cwe: "CWE-502",
          description:
            "An endpoint deserializes attacker-controlled data without validation, allowing object injection that leads to remote code execution.",
        },
        {
          name: "Improper Restriction of XML External Entity Reference",
          cwe: "CWE-611",
          description:
            "An exposed endpoint parses attacker-supplied XML without disabling external entity resolution, providing a path to file disclosure or internal network access.",
        },
        {
          name: "Server-Side Request Forgery (SSRF)",
          cwe: "CWE-918",
          description:
            "An exploitable endpoint can be made to issue requests to internal or arbitrary destinations on the attacker's behalf.",
        },
      ],
    },
    {
      id: "PTES-POST",
      category: "Post Exploitation",
      label: "Maintaining/expanding access",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Privilege Escalation",
          cwe: "CWE-269",
          description:
            "A flaw or misconfiguration lets an attacker with limited access gain higher (e.g. admin/root) privileges.",
        },
        {
          name: "Insufficient Logging & Monitoring",
          cwe: "CWE-778",
          description:
            "Security-relevant events aren't logged or alerted on, letting an attacker's activity go undetected.",
        },
        {
          name: "Lateral Movement via Credential Reuse",
          cwe: "CWE-522",
          description:
            "Credentials harvested from one system are insufficiently protected/rotated and work across other systems, letting an attacker move laterally.",
        },
        {
          name: "Domain Admin Compromise via Kerberoasting",
          cwe: "CWE-521",
          description:
            "Service accounts hold weak passwords crackable offline from requested Kerberos service tickets, providing a path to domain-wide compromise.",
        },
        {
          name: "Persistence via Scheduled Task or Service",
          cwe: "CWE-269",
          description:
            "An attacker with initial access can install a scheduled task, service, or startup entry that survives reboot, without this being detected or alerted on.",
        },
        {
          name: "Use of Hard-coded Credentials",
          cwe: "CWE-798",
          description:
            "Credentials hardcoded in a config file, script, or binary found on a compromised host provide a path to further systems.",
        },
      ],
    },
    {
      id: "PTES-REPORT",
      category: "Reporting",
      label: "Deliverable quality and evidence traceability",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Incomplete Evidence Chain of Custody",
          description:
            "Findings in the report can't be traced back to concrete evidence (request/response, screenshot, hash), weakening credibility and making retesting harder.",
        },
      ],
    },
  ],
  // OSSTMM channels are about measuring operational security (visibility,
  // access, trust), not an enumerated vulnerability list — these are common
  // findings per channel, curated for this catalog.
  osstmm: [
    {
      id: "OSSTMM-HUMAN",
      category: "Human Security Testing",
      label: "Social engineering / employee awareness",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Social Engineering Susceptibility",
          description:
            "Staff can be manipulated (phishing, pretexting, tailgating) into bypassing security controls or disclosing sensitive information.",
        },
        {
          name: "Weak Identity Verification Procedures",
          cwe: "CWE-290",
          description:
            "Staff/help-desk processes don't adequately verify a requester's identity before granting access or resetting credentials.",
        },
        {
          name: "Insufficient Security Awareness Training",
          description:
            "Staff haven't received (or don't retain) security awareness training, leaving them unprepared to recognize common social engineering attempts.",
        },
        {
          name: "Weak Password Recovery Mechanism for Forgotten Password",
          cwe: "CWE-640",
          description:
            "Help-desk or self-service password recovery relies on information an attacker can obtain through social engineering or public research.",
        },
      ],
    },
    {
      id: "OSSTMM-PHYSICAL",
      category: "Physical Security Testing",
      label: "Access to buildings, rooms and equipment",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Inadequate Physical Access Controls",
          description:
            "Physical barriers, locks, badges, or surveillance are insufficient to prevent unauthorized entry to sensitive areas or equipment.",
        },
        {
          name: "Unattended Equipment / Unlocked Workstations",
          description:
            "Devices are left logged in and unattended in accessible areas, letting anyone nearby use them directly.",
        },
        {
          name: "Inadequate Visitor Management Process",
          description:
            "Visitors/contractors can move through the facility unescorted or without a verifiable badge/log, undermining any other physical control in place.",
        },
        {
          name: "Use of Weak Credentials",
          cwe: "CWE-1391",
          description:
            "Physical access codes (door PINs, badge system defaults) are weak, shared, or never rotated after staff turnover.",
        },
      ],
    },
    {
      id: "OSSTMM-WIRELESS",
      category: "Wireless Security Testing",
      label: "Wi-Fi, Bluetooth, RFID and other radio signals",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Insecure Wireless Encryption Configuration",
          cwe: "CWE-326",
          description:
            "A wireless network uses weak/no encryption or authentication, allowing eavesdropping or unauthorized access from within range.",
        },
        {
          name: "Rogue Access Point / Evil Twin Exposure",
          description:
            "Clients can be tricked into associating with an attacker-controlled access point impersonating a legitimate network.",
        },
        {
          name: "Weak Wireless Client Isolation",
          cwe: "CWE-284",
          description:
            "Devices on the same wireless network/SSID can reach each other directly, letting a compromised guest device attack other clients on the same network.",
        },
        {
          name: "Use of Hard-coded Credentials",
          cwe: "CWE-798",
          description:
            "Wireless access point or IoT radio firmware ships with a hardcoded pre-shared key or admin credential common to an entire product line.",
        },
      ],
    },
    {
      id: "OSSTMM-TELECOM",
      category: "Telecommunications Security Testing",
      label: "Telephony, VoIP, fax and other voice connections",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Insecure VoIP/Telephony Configuration",
          cwe: "CWE-16",
          description:
            "Voice infrastructure (VoIP servers, PBX, fax lines) is misconfigured or unauthenticated, allowing eavesdropping, toll fraud, or unauthorized access.",
        },
        {
          name: "Toll Fraud via Insecure PBX",
          description: "A PBX/voicemail system allows unauthorized external call routing, incurring fraudulent charges.",
        },
        {
          name: "Unencrypted SIP/RTP Traffic",
          cwe: "CWE-319",
          description:
            "VoIP signaling and/or media streams travel unencrypted, allowing eavesdropping on calls or SIP credential theft from the same network segment.",
        },
        {
          name: "Missing Authentication for Critical Function",
          cwe: "CWE-306",
          description:
            "A PBX or telephony management interface performs administrative actions without requiring authentication.",
        },
      ],
    },
    {
      id: "OSSTMM-DATANET",
      category: "Data Networks Security Testing",
      label: "Network segmentation and access boundaries",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Network Segmentation Weakness",
          cwe: "CWE-284",
          description:
            "Insufficient network segmentation lets an attacker who compromises one segment reach more sensitive segments than intended.",
        },
        {
          name: "Weak Firewall Ruleset",
          cwe: "CWE-16",
          description: "Overly permissive firewall rules allow traffic that should be restricted between zones.",
        },
        {
          name: "Missing Network Access Control (802.1X/NAC)",
          cwe: "CWE-287",
          description:
            "Any device plugged into a wired port (or joining the network) gets network access without authenticating first, letting a rogue device onto the internal network.",
        },
        {
          name: "Incorrect Permission Assignment for Critical Resource",
          cwe: "CWE-732",
          description:
            "Network device configuration/management access is left with overly permissive file or service permissions, letting a local low-privilege account read or alter it.",
        },
      ],
    },
    {
      id: "OSSTMM-COMPLIANCE",
      category: "Compliance",
      label: "Regulatory and policy compliance",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Non-Compliance with Data Protection Requirements",
          description:
            "Handling of regulated data (PII, cardholder data, health records) doesn't meet applicable regulatory requirements.",
        },
        {
          name: "Undocumented Data Retention Policy",
          description:
            "There's no documented (or enforced) policy for how long sensitive data is retained, risking indefinite accumulation of data that increases breach impact.",
        },
        {
          name: "Insufficient Logging & Monitoring",
          cwe: "CWE-778",
          description:
            "Actions on regulated data aren't logged in enough detail to reconstruct who accessed what, failing common compliance audit requirements.",
        },
      ],
    },
  ],
  // NIST SP800-115's phases describe the assessment lifecycle, not a
  // vulnerability list — these are common findings per phase, curated here.
  "nist-800-115": [
    {
      id: "NIST-PLANNING",
      category: "Planning",
      label: "Scoping, authorization and rules of engagement",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Undefined Rules of Engagement Leading to Scope Creep",
          description:
            "Testing boundaries, allowed techniques, and timing windows weren't documented and agreed upfront, risking out-of-scope impact or disputed findings later.",
        },
        {
          name: "Missing Written Authorization for Testing Activities",
          description:
            "Testing began without a signed authorization letter covering the specific targets and techniques used, exposing both parties legally.",
        },
      ],
    },
    {
      id: "NIST-DISCOVERY",
      category: "Discovery",
      label: "Information gathering and scanning",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Information Disclosure via Reconnaissance",
          cwe: "CWE-200",
          description:
            "Banner grabbing, DNS, or service enumeration reveals more about the target's internals than intended.",
        },
        {
          name: "Unnecessary Open Ports/Services",
          cwe: "CWE-16",
          description: "Services are reachable on the network that aren't required for the system's function, widening the attack surface.",
        },
      ],
    },
    {
      id: "NIST-ATTACK",
      category: "Attack",
      label: "Validating and exploiting discovered weaknesses",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Unpatched Software",
          cwe: "CWE-1104",
          description: "A known, patchable vulnerability in a component was never remediated.",
        },
        {
          name: "Weak Authentication",
          cwe: "CWE-287",
          description: "Authentication can be bypassed, guessed, or brute-forced.",
        },
        {
          name: "Injection Flaw",
          cwe: "CWE-74",
          description:
            "Untrusted input is interpreted as code/commands by a downstream component (SQL, OS command, LDAP, etc.).",
        },
        {
          name: "Sensitive Data Exposure",
          cwe: "CWE-200",
          description: "Sensitive data is accessible to an attacker who has gained a foothold, due to missing access controls.",
        },
        {
          name: "Privilege Escalation",
          cwe: "CWE-269",
          description: "A flaw or misconfiguration discovered during the attack phase lets the tester (and a real attacker) escalate from a foothold to elevated privileges.",
        },
        {
          name: "Uncontrolled Resource Consumption (Denial of Service)",
          cwe: "CWE-400",
          description: "A discovered weakness can be pushed to exhaust a service's resources, denying it to legitimate users.",
        },
        {
          name: "Race Condition",
          cwe: "CWE-362",
          description:
            "Two or more threads/processes access a shared resource without proper synchronization, letting an attacker win a timing race to corrupt data or bypass a check.",
        },
        {
          name: "Time-of-check Time-of-use (TOCTOU) Race Condition",
          cwe: "CWE-367",
          description:
            "A security check and the actual use of that resource happen at different times, letting an attacker swap the resource out in between.",
        },
        {
          name: "Improper Synchronization",
          cwe: "CWE-662",
          description:
            "Concurrent access to a shared resource isn't properly synchronized, leading to inconsistent or corrupted state under concurrent load.",
        },
        {
          name: "Improper Locking",
          cwe: "CWE-667",
          description:
            "A lock intended to protect a shared resource is acquired or released incorrectly, allowing a race condition or deadlock.",
        },
        {
          name: "Missing Release of Memory after Effective Lifetime",
          cwe: "CWE-401",
          description:
            "Allocated memory is never freed once it's no longer needed, letting an attacker who can trigger the allocation repeatedly exhaust available memory.",
        },
        {
          name: "Missing Release of Resource after Effective Lifetime",
          cwe: "CWE-772",
          description:
            "A non-memory resource (file handle, socket, DB connection) is never released once no longer needed, letting an attacker exhaust that resource pool.",
        },
        {
          name: "Untrusted Search Path",
          cwe: "CWE-426",
          description:
            "The application searches for an executable/library/config file using a path influenced by an untrusted source, letting an attacker plant a malicious file earlier in the search order.",
        },
        {
          name: "Uncontrolled Search Path Element",
          cwe: "CWE-427",
          description:
            "An element of the search path used to locate executables/libraries is writable by users with lower privilege than the application, letting them hijack what gets loaded.",
        },
        {
          name: "Unquoted Search Path or Element",
          cwe: "CWE-428",
          description:
            "A path containing spaces is used without quoting, letting an attacker who can write to an intermediate directory have their own executable run instead of the intended one.",
        },
      ],
    },
    {
      id: "NIST-REPORTING",
      category: "Reporting",
      label: "Findings documentation and remediation guidance",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Incomplete Evidence Chain of Custody",
          description:
            "Findings can't be traced back to concrete, timestamped evidence, weakening the report's credibility and making later retesting harder to verify.",
        },
      ],
    },
  ],
  // ISSAF's phases are procedural (plan/assess/cleanup), not a vulnerability
  // list — these are common findings during the assessment phase, curated here.
  issaf: [
    {
      id: "ISSAF-PLANNING",
      category: "Planning and Preparation",
      label: "Scope agreement and engagement setup",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Inadequate Scope Definition",
          description:
            "Target lists, exclusions, and testing windows weren't precisely agreed before testing began, risking accidental impact to out-of-scope systems.",
        },
        {
          name: "Missing Emergency Contact / Escalation Procedure",
          description:
            "No agreed point of contact exists for the client to reach the testing team (or vice versa) if something unexpected happens mid-engagement.",
        },
      ],
    },
    {
      id: "ISSAF-ASSESS",
      category: "Assessment",
      label: "Network, host and application assessment",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Missing Security Patch",
          cwe: "CWE-1104",
          description: "A system or application component is missing a vendor-released security patch.",
        },
        {
          name: "Weak Password Policy",
          cwe: "CWE-521",
          description:
            "Accounts allow weak, default, or easily guessable passwords due to a lax or unenforced password policy.",
        },
        {
          name: "Default/Weak SNMP Community Strings",
          cwe: "CWE-1392",
          description: "Network devices respond to well-known or easily guessed SNMP community strings, exposing device configuration.",
        },
        {
          name: "Insecure Remote Administration Protocol",
          cwe: "CWE-319",
          description: "Devices are administered over an unencrypted protocol (Telnet, FTP, HTTP), exposing admin credentials in transit.",
        },
        {
          name: "SQL Injection",
          cwe: "CWE-89",
          description: "Unsanitized user input is concatenated into a SQL query, letting an attacker alter query logic and read/modify/delete database data.",
        },
        {
          name: "Cross-Site Scripting",
          cwe: "CWE-79",
          description: "User input is rendered without proper encoding, allowing attacker-controlled script to execute in a victim's browser.",
        },
        {
          name: "Buffer Overflow in Legacy Service",
          cwe: "CWE-120",
          description: "A network service copies attacker-controlled input into a fixed-size buffer without bounds checking, potentially allowing memory corruption and code execution.",
        },
        {
          name: "Stack-based Buffer Overflow",
          cwe: "CWE-121",
          description: "A stack-allocated buffer is overrun by attacker-controlled input, letting an attacker overwrite the return address or adjacent stack data to hijack control flow.",
        },
        {
          name: "Heap-based Buffer Overflow",
          cwe: "CWE-122",
          description: "A heap-allocated buffer is overrun by attacker-controlled input, corrupting heap metadata or adjacent allocations in a way that can lead to code execution.",
        },
        {
          name: "Out-of-bounds Write",
          cwe: "CWE-787",
          description: "The service writes data past the boundary of an allocated buffer, a memory-corruption primitive that underlies most native-code buffer overflow exploits.",
        },
        {
          name: "Out-of-bounds Read",
          cwe: "CWE-125",
          description: "The service reads data past the boundary of an allocated buffer, potentially disclosing adjacent memory (credentials, keys, pointers useful for further exploitation).",
        },
        {
          name: "Use After Free",
          cwe: "CWE-416",
          description: "The service continues to use a pointer after the memory it references has been freed, which an attacker can exploit by reallocating that memory with controlled content.",
        },
        {
          name: "NULL Pointer Dereference",
          cwe: "CWE-476",
          description: "The service dereferences a pointer expected to be non-null without checking, crashing the process — at minimum a denial-of-service, and a common precursor to further exploitation on some platforms.",
        },
        {
          name: "Insecure Deserialization",
          cwe: "CWE-502",
          description: "An assessed application or service deserializes untrusted data without validation, allowing object injection or remote code execution.",
        },
        {
          name: "Improper Validation of Array Index",
          cwe: "CWE-129",
          description:
            "An array is accessed using an index computed from untrusted input without validating it's within bounds, allowing out-of-bounds reads or writes.",
        },
        {
          name: "Improper Restriction of Operations within the Bounds of a Memory Buffer",
          cwe: "CWE-119",
          description:
            "The umbrella weakness behind most buffer overflows: an operation reads or writes memory outside the buffer's allocated bounds.",
        },
        {
          name: "Access of Uninitialized Pointer",
          cwe: "CWE-824",
          description:
            "A pointer is dereferenced before being initialized to a valid memory location, leading to a crash or, if the uninitialized value is attacker-influenceable, arbitrary code execution.",
        },
        {
          name: "Improper Initialization",
          cwe: "CWE-665",
          description:
            "A resource (variable, object, security control) is used before it has been properly initialized, potentially leaving it in an insecure default state.",
        },
        {
          name: "Use of Uninitialized Resource",
          cwe: "CWE-908",
          description:
            "A resource is used before its value or state has been explicitly set, which can expose leftover data from a previous use or cause unpredictable behavior.",
        },
        {
          name: "Missing Initialization of Resource",
          cwe: "CWE-909",
          description:
            "A resource that requires explicit initialization before use is never initialized, leaving it in an undefined or insecure state.",
        },
        {
          name: "Incorrect Calculation of Buffer Size",
          cwe: "CWE-131",
          description:
            "A buffer is allocated using a size computed incorrectly (off-by-one, wrong unit, integer overflow in the size expression), leaving too little space for what's later written into it.",
        },
        {
          name: "Integer Overflow or Wraparound",
          cwe: "CWE-190",
          description:
            "An arithmetic operation produces a value larger than the integer type can hold, wrapping around to a small or negative number that can then be used unsafely as a buffer size or index.",
        },
        {
          name: "Integer Underflow (Wrap or Wraparound)",
          cwe: "CWE-191",
          description:
            "An arithmetic operation produces a value smaller than the integer type's minimum, wrapping around to a large positive number that can then be used unsafely.",
        },
        {
          name: "Off-by-one Error",
          cwe: "CWE-193",
          description:
            "A loop, buffer index, or size calculation is off by exactly one element, commonly causing a one-byte buffer overflow or a skipped/duplicated iteration.",
        },
        {
          name: "Divide By Zero",
          cwe: "CWE-369",
          description:
            "The application divides a value by a quantity that can be attacker-controlled and reach zero, crashing the process.",
        },
        {
          name: "Incorrect Type Conversion or Cast",
          cwe: "CWE-704",
          description:
            "A value is cast or converted between incompatible types without proper validation, which can corrupt data or, in native code, memory.",
        },
        {
          name: "Incorrect Conversion between Numeric Types",
          cwe: "CWE-681",
          description:
            "Converting between numeric types (signed to unsigned, wide to narrow) truncates or reinterprets the value in a way the code didn't account for.",
        },
        {
          name: "Access of Resource Using Incompatible Type ('Type Confusion')",
          cwe: "CWE-843",
          description:
            "Memory or an object allocated as one type is later accessed as a different, incompatible type, letting an attacker manipulate the misinterpreted memory layout.",
        },
        {
          name: "Double Free",
          cwe: "CWE-415",
          description:
            "The same block of allocated memory is freed twice, corrupting the memory allocator's internal state in a way that can be leveraged for code execution.",
        },
        {
          name: "Operation on a Resource after Expiration or Release",
          cwe: "CWE-672",
          description:
            "The application continues to operate on a resource (memory, file handle, session) after it has already been released or expired.",
        },
        {
          name: "Reachable Assertion",
          cwe: "CWE-617",
          description:
            "An assertion intended only to catch programming errors during development is reachable with attacker-controlled input in production, crashing the process when it fires.",
        },
        {
          name: "Improper Resource Shutdown or Release",
          cwe: "CWE-404",
          description:
            "A resource (network connection, file handle, lock) isn't properly shut down or released after its use ends — the general weakness behind more specific memory/handle leak findings.",
        },
        {
          name: "Release of Invalid Pointer or Reference",
          cwe: "CWE-763",
          description:
            "A pointer or reference is released to a memory management routine that doesn't actually own it, corrupting the allocator's internal state.",
        },
      ],
    },
    {
      id: "ISSAF-CLEANUP",
      category: "Reporting, Clean-up and Artifact Destruction",
      label: "Post-engagement clean-up verification",
      fromGuide: false,
      suggestedVulnerabilities: [
        {
          name: "Leftover Testing Artifacts on Target Systems",
          description:
            "Tools, webshells, test accounts, or scheduled tasks planted during the engagement weren't fully removed afterward, leaving an exploitable backdoor behind.",
        },
      ],
    },
  ],
  none: [],
};

export interface FlatVulnerability extends SuggestedVulnerability {
  methodologyId: MethodologyId;
  testCaseId: string;
  testCaseLabel: string;
  fromGuide: boolean;
}

/** Flattens the per-test-case catalog into a directly searchable vulnerability list. */
export function listVulnerabilities(methodologyId: MethodologyId): FlatVulnerability[] {
  return TEST_CATALOG[methodologyId].flatMap((testCase) =>
    testCase.suggestedVulnerabilities.map((vuln) => ({
      ...vuln,
      methodologyId,
      testCaseId: testCase.id,
      testCaseLabel: testCase.label,
      fromGuide: testCase.fromGuide,
    })),
  );
}

export interface KnownCwe {
  cwe: string;
  name: string;
  description: string;
  /** Every methodology this CWE shows up under — lets the picker surface "also used by WSTG, IoT" without a second lookup. */
  methodologyIds: MethodologyId[];
}

/** Every distinct CWE code across all methodologies, deduped by code, for use as a project-agnostic category picklist. */
export function listKnownCwes(): KnownCwe[] {
  const byCwe = new Map<string, KnownCwe>();
  for (const [methodologyId, testCases] of Object.entries(TEST_CATALOG) as [
    MethodologyId,
    TestCase[],
  ][]) {
    for (const testCase of testCases) {
      for (const vuln of testCase.suggestedVulnerabilities) {
        if (!vuln.cwe) continue;
        const existing = byCwe.get(vuln.cwe);
        if (!existing) {
          byCwe.set(vuln.cwe, {
            cwe: vuln.cwe,
            name: vuln.name,
            description: vuln.description,
            methodologyIds: [methodologyId],
          });
        } else if (!existing.methodologyIds.includes(methodologyId)) {
          existing.methodologyIds.push(methodologyId);
        }
      }
    }
  }
  return Array.from(byCwe.values()).sort((a, b) =>
    a.cwe.localeCompare(b.cwe, undefined, { numeric: true }),
  );
}
