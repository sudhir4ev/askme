# Design System Specification: Initial Dependency

## 1. Overview & Creative North Star
**Creative North Star: "The Precision Architect"**

The design language for **Initial Dependency** is built on the principles of clarity, efficiency, and technical precision. As a tool for engineers and developers, the interface avoids decorative clutter, favoring high-density data visualization and a clean, "IDE-inspired" aesthetic. It emphasizes a clear hierarchy to help users quickly identify and remediate reachable vulnerabilities.

---

## 2. Design Tokens

### 2.1. Color Palette
The palette is dominated by neutral whites and grays to provide a clean canvas for critical information.

| Token | Value | Usage |
| :--- | :--- | :--- |
| `color-bg-primary` | `#FFFFFF` | Main background for screens and cards. |
| `color-bg-secondary` | `#F9FAFB` | Subtle background for secondary areas or page sections. |
| `color-primary` | `#3B82F6` | Primary action buttons (e.g., "Start Scan"), links, and active states. |
| `color-border` | `#E5E7EB` | Dividers, card borders, and input fields. |
| `color-text-primary` | `#111827` | Headings and primary body text. |
| `color-text-secondary` | `#4B5563` | Subtitles, labels, and secondary information. |
| `color-critical` | `#DC2626` | Critical vulnerability alerts, red severity badges. |
| `color-high` | `#F97316` | High severity warnings. |
| `color-medium` | `#EAB308` | Medium severity indicators. |
| `color-success` | `#10B981` | Reachability "Not Reachable" states or "All Clear" status. |
| `color-code-bg` | `#F3F4F6` | Background for code snippet displays and monospace blocks. |

### 2.2. Typography
A high-performance sans-serif stack is used for the UI, with a monospace font reserved for technical data and code.

*   **Primary Font Family:** `Inter`, `SF Pro`, or system sans-serif.
*   **Technical Font Family:** `JetBrains Mono`, `Fira Code`, or system monospace.

| Style | Size | Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Display 1` | 48px | 800 | 1.1 | Main Hero Title (Landing Screen) |
| `Heading 1` | 32px | 700 | 1.2 | Page titles (Results Screen) |
| `Heading 2` | 24px | 600 | 1.3 | Section headers, card titles |
| `Body Large` | 18px | 400 | 1.5 | Subtitles and intro text |
| `Body Base` | 16px | 400 | 1.5 | Main content text |
| `Label` | 14px | 500 | 1.4 | Table headers, small labels, badges |
| `Code` | 13px | 400 | 1.6 | Monospace code snippets |

### 2.3. Elevation & Spacing
*   **Shadows:** Low-intensity, diffuse shadows for cards (`0 4px 6px -1px rgb(0 0 0 / 0.1)`).
*   **Roundness:** Subtle rounding (`rounded-lg` or 8px) for buttons and cards to maintain a modern but structured feel.
*   **Spacing System:** Base 4px grid. Standard section padding: 24px (Mobile/Tablet) to 48px (Desktop).

---

## 3. Core Components

### 3.1. Navigation Bar
*   **Logo:** Bold, high-contrast text "Initial Dependency".
*   **Links:** Minimal text links for Dashboard, Inventory, and Reports.
*   **Actions:** Secondary action ("Back to Scan") always visible on sub-pages.

### 3.2. Upload Dropzone
*   **Visual:** Dotted border container with a centered "Upload" icon.
*   **Functionality:** Supports drag-and-drop or click-to-browse for ZIP/tarball files.
*   **Git Input:** A secondary text input field for repository URLs to cater to different workflows.

### 3.3. Metric Tiles
*   **Layout:** Horizontal row of clean cards.
*   **Data:** Large numerical value with a small descriptive label and change indicator (e.g., "+12 from last scan").

### 3.4. Vulnerability Card
*   **Collapsed State:** Shows Library Name, Version, Severity Badge (Colored), and Reachability Badge (Icon-based).
*   **Expanded State:**
    *   **CVE ID:** Displayed clearly for reference.
    *   **Description:** Clear explanation of the vulnerability.
    *   **Reachability Proof:** Monospace code snippet showing the execution path.
    *   **Remediation Suggestion:** Action-oriented card (e.g., "Upgrade to version X.Y.Z").

### 3.5. Badges & Status
*   **Severity:** Pill-shaped badges using semantic colors (Red = Critical, Orange = High, etc.).
*   **Reachability:** High-contrast badge with an "Impact" icon for Reachable, and a "Safe" icon for Not Reachable.

---

## 4. UX Principles
1.  **Noise Reduction:** Filter out vulnerabilities that are not reachable by default to reduce security fatigue.
2.  **Immediate Feedback:** Scan status should be clearly communicated via progress states or clear empty states.
3.  **Context is King:** Always show the *where* (code snippet) and *how* (remediation) alongside the *what* (vulnerability).
4.  **Density without Clutter:** Use generous white space between major sections while maintaining tight, organized tables for detailed analysis.