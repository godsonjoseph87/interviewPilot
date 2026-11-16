# InterviewPilot AI 🚀
### AI-Powered Technical Interview Management Application

**InterviewPilot AI** is a premium, modern, frontend-only technical interview management platform designed for engineering interviewers conducting structured technical interviews for **Senior Java Backend Engineers, Staff Engineers, and Backend Architects**.

Built with **React, TypeScript, Tailwind CSS, Vite, Zustand, Dexie.js (IndexedDB), Google Identity Services, Recharts, and the official Google GenAI SDK (`@google/genai`)**.

---

## 🌟 Key Capabilities

### 1. Production-Centric AI Question Generation
- **Google Gemini Integration**: Dynamically generates structured scenario questions tailored to candidate experience and selected topics.
- **Mandatory Warm-up**: Question 1 is always the required professional walkthrough:
  > *"Tell me about yourself and walk me through your professional experience, particularly your experience with backend development."*
- **Scenario-Driven Depth**: Prioritizes real production incident debugging over trivial definitions:
  - *Kafka offset commit crashes and duplicate processing prevention (Outbox pattern, idempotency)*
  - *Spring AOP dynamic proxy traps with `@Transactional(propagation = REQUIRES_NEW)` self-invocation*
  - *`ConcurrentHashMap` Java 8+ CAS vs synchronized node locking and treeification*
  - *Production Metaspace OutOfMemoryError and thread pool `ThreadLocal` memory leaks*
  - *MySQL InnoDB deadlock diagnosis and row-level locking under 5,000 req/sec write bursts*
- **Single Question Regeneration**: Replace an individual question if unsuitable or too easy without regenerating the entire session.

### 2. Full-Screen 3-Panel Interview Workspace
- **Left Sidebar**: Candidate overview, overall progress indicator, categorized question list with real-time status badges (*Completed, Partial, Incorrect, Skipped, Pending*).
- **Main Question Panel**: Question statement, collapsible **Interviewer-Only Expected Answer** (hidden by default), key evaluation points to listen for, common pitfalls, and probing follow-up questions.
- **Right Panel**: Reliable timestamp-based overall timer and question stopwatch, live candidate notes textarea with autosaving, immediate evaluation buttons (*Correct, Partial with fine-tuning slider, Incorrect, Skip*).

### 3. Dedicated DSA Assessment Module
- Generates 2 algorithmic problems calibrated for senior difficulty (e.g., *In-Memory LRU Cache with TTL*, *Merge K Sorted Event Timestamps Stream*).
- Multi-language syntax editor supporting **Java, Python, JavaScript, and C++**.
- AI Static Analysis Code Review across 6 weighted dimensions:
  1. Logical Correctness (35%)
  2. Algorithm Selection (20%)
  3. Time Complexity (15%)
  4. Space Complexity (10%)
  5. Edge-Case Handling (10%)
  6. Code Quality & Readability (10%)
- Distinguishes between static analysis findings and execution-dependent behavior.
- Allows interviewer score overrides while keeping the AI score and adjusted score separate.

### 4. Deterministic Scoring & Qualitative AI Report
- **Deterministic Math**: Category percentages, earned marks, and overall weighted score (70% technical questions, 30% DSA) are calculated deterministically in the browser. Skipped questions are safely excluded from penalizing the candidate.
- **Gemini Qualitative Synthesis**: Gemini produces qualitative competency assessments and explanations based on the deterministic scores.
- **Visual Analytics**: Interactive Category Breakdown Bar Chart and 8-dimensional Competency Radar Profile powered by **Recharts**.
- **Interviewer Authority**: Interviewer can override the hiring recommendation (*Strong Hire, Hire, Lean Hire, Lean No Hire, No Hire*) and append permanent final notes.
- **Official PDF Generation**: Export a multi-page, formatted PDF evaluation summary using **jsPDF** and **jspdf-autotable**.

### 5. Persistent Local Storage & Security Architecture
- **Zero Backend Required**: Operates 100% in the browser. Suitable for static hosting on GitHub Pages, Netlify, or Vercel.
- **IndexedDB via Dexie.js**: Versioned schemas storing `sessions`, `questions`, `evaluations`, `dsaProblems`, `dsaSubmissions`, `reports`, and `settings`.
- **Browser Refresh Recovery**: Active interviews and timers recover seamlessly on page reload.
- **Security Posture**:
  - Gemini API keys are never embedded in source code or Vite build environment variables.
  - Clear in-app warnings that browser-based keys communicate directly with Google GenAI.
  - Option to retain keys strictly in memory for the session or save locally in browser storage.
  - Full JSON backup export and import functionality.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Build & Tooling** | Node.js, Vite 6, TypeScript 5 |
| **UI & Styling** | React 18, Tailwind CSS, Lucide React, Class Variance Authority |
| **State Management** | Zustand |
| **Local Database** | Dexie.js (IndexedDB) with schema versioning |
| **AI Integration** | Official Google GenAI SDK (`@google/genai`) |
| **Schema Validation** | Zod |
| **Data Visualizations** | Recharts (Radar Chart & Bar Chart) |
| **Document Export** | jsPDF, jspdf-autotable |
| **Authentication** | Google Identity Services (GIS) & Interviewer Profile |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (tested with Node.js v24)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd InterviewPilotAi

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

### Running Logic & Schema Verification Tests
```bash
node test/e2e-logic.test.mjs
```

---

## 📁 Project Architecture

```
src/
├── components/
│   ├── common/        # ScoreBadge, StatCard, ApiKeyModal, CategoryTag
│   ├── layout/        # Navbar, Responsive Layout
│   └── ui/            # Button, Card, Badge, Modal, Input, Textarea, Select, ProgressBar
├── features/
│   ├── auth/          # LoginPage with Google Identity Services & Profile Login
│   ├── configure/     # NewInterviewPage with Duration Breakdown & Topics Selector
│   ├── dashboard/     # DashboardPage with metrics, recent interviews, hiring breakdown
│   ├── dsa/           # DsaAssessmentModal with code editor & 6-point AI review
│   ├── history/       # HistoryPage with search, filters, sorting & deletion
│   ├── report/        # ReportPage with Recharts visualizations & PDF export
│   ├── settings/      # SettingsPage for Gemini API key, model selection & backups
│   └── workspace/     # Full-screen workspace (Sidebar, Main Question Panel, Right Stopwatch)
├── lib/
│   ├── constants.ts   # 17 Technical Topics, Difficulty levels, Duration presets
│   ├── schemas.ts     # Zod schemas for AI generation, reviews, and reports
│   └── utils.ts       # Duration formatters, date formatters, cn helper
├── services/
│   ├── ai/            # AIProvider interface, GeminiProvider (@google/genai), mockData
│   ├── db/            # Dexie database schema, versioning, export/import
│   ├── pdf/           # jsPDF generation engine with jspdf-autotable
│   ├── scoring/       # Deterministic score calculator & rubric engine
│   └── storage/       # Key storage (in-memory vs local persistence)
├── store/
│   ├── useAuthStore.ts
│   ├── useInterviewSessionStore.ts
│   └── useSettingsStore.ts
├── styles/
│   └── globals.css    # Tailwind dark-first palette & glassmorphism tokens
├── types/             # TypeScript interfaces for interviews, questions, and reports
├── App.tsx            # Main application router and state coordinator
└── main.tsx           # React entrypoint
```

---

## 🔒 Security Principles

1. **No Embedded Secrets**: No API keys are bundled or baked into the Vite build.
2. **Interviewer Key Ownership**: The interviewer provides their Gemini API key via the Settings screen or connection modal.
3. **In-Memory Default**: Keys can be retained in session memory and cleared when the browser tab closes.
4. **Direct Browser Communication**: All AI requests travel directly from the interviewer's browser to Google's official Gemini endpoint.
5. **Swappable Architecture**: The `AIProvider` interface allows introducing a secure backend proxy or serverless gateway seamlessly in the future without modifying application logic.

