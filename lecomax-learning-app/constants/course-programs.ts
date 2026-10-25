export type CourseProgram = {
  audience: string;
  requirements: string;
  outcomes: string[];
  sequence: string[];
  next: string[];
  reviewStatus: string;
  workload: string;
};
// Editorial briefs are in English; they do not imply translated instruction.
export const coursePrograms: Record<string, CourseProgram> = {
  'full-stack': {
    audience: 'JavaScript learners ready to integrate an application across UI, server and persistence.', requirements: 'Build an accessible form, read an async request and use arrays/objects. Complete JavaScript first; React preparation is included. Use fictional data and a disposable local database.',
    outcomes: ['Trace one user operation through UI, validation, authorization and persistence.', 'Design relational constraints and test transaction failure.', 'Keep client-supplied identity and pricing outside trusted decisions.', 'Deliver a store slice with reproducible success, boundary and failure tests.'],
    sequence: ['Foundation: React state and form behavior.', 'Intermediate: routing, server data, SQL and API contracts.', 'Integration: ownership, commerce invariants and quality engineering.', 'Capstone: a local store slice, deployment rehearsal and recovery evidence.'],
    next: ['deploy', 'ai-agents', 'real-site'], reviewStatus: 'Curated sequence reusing existing substantive modules. Repository reference lessons remain in the separate real-site companion; historical examples still need environment-specific checks.', workload: 'The sum covers the selected lessons. Reserve another 8–12 hours for an independent store slice and failure testing; production deployment is not required.',
  },
  'ai-foundations': {
    audience: 'AI beginners evaluating claims before building model-powered tools.', requirements: 'Basic fractions, tables and computer literacy. Arabic introduction and English lab; JavaScript is optional for manual metric calculation.',
    outcomes: ['Distinguish training and inference.', 'Calculate confusion counts, accuracy, precision and recall.', 'Identify leakage and compare a baseline with error-specific evidence.'],
    sequence: ['Foundation: preserved data-to-model introduction.', 'Applied foundation: worked metrics and error-analysis project.', 'Capstone: frozen 12-message benchmark and a justified recommendation.'],
    next: ['llm-applications', 'python'], reviewStatus: 'Bounded introductory course. Advanced machine learning, neural networks and model training remain separate planned study.', workload: 'The lesson sum includes the small benchmark project. Add a later unseen example and revision time; no professional ML qualification is claimed.',
  },
  'llm-applications': {
    audience: 'Learners designing evidence-based document assistants.', requirements: 'AI foundations; understand a table, a conditional filter and application access permissions. The introduction is Arabic and the applied lab is English.',
    outcomes: ['Separate retrieval failure from unsupported generation.', 'Filter private evidence before context construction.', 'Evaluate citations and unsupported questions with a benchmark.'],
    sequence: ['Foundation: model generation and limitations.', 'Applied: keyword retrieval and claim-support checks.', 'Capstone: six-case evidence benchmark plus an unseen question.'],
    next: ['ai-agents', 'api'], reviewStatus: 'Introductory evidence-pipeline course. The fixture is deterministic, not a live LLM, embeddings system or production RAG deployment.', workload: 'Lesson estimates include the benchmark. A live-model integration requires separate provider, privacy, budget and runtime verification.',
  },
  'ai-agents': {
    audience: 'Developers learning to evaluate tool execution boundaries.', requirements: 'Read JavaScript functions, arrays and conditions. Explain trusted session identity versus user-supplied arguments; revise the API path if needed.',
    outcomes: ['Reject unauthorized or malformed proposals.', 'Bound a scripted execution loop including failed attempts.', 'Produce an adversarial trace and explain missing production controls.'],
    sequence: ['Foundation: preserved authorized-order tool introduction.', 'Intermediate: validation, ownership, failure and step limits.', 'Capstone: adversarial test matrix and operational-gap review.'],
    next: ['api', 'deploy'], reviewStatus: 'Read-only introductory runner with scripted proposals. Live planning, production transport and side-effect execution are outside this course’s verified scope.', workload: 'The sum includes the local runner project. Allow additional time to revise failed cases; live model costs are not required.',
  },
  'science-world': {
    audience: 'Curious learners practicing scientific reasoning and world knowledge.', requirements: 'Basic arithmetic and English reading. A ruler and safe household object are useful; supplied data is available but must be labelled simulated.',
    outcomes: ['Record measurements with units and limitations.', 'Distinguish repeatability, bias and model predictions.', 'Explain opposite hemispheric seasons with controlled comparisons.'],
    sequence: ['Foundation: measurement and uncertainty project.', 'Applied: existing World seasons laboratory.', 'Capstone: source-supported investigation with predictions, results and limitations.'],
    next: ['ai-foundations', 'python'], reviewStatus: 'A bounded scientific-reasoning foundation, not comprehensive coverage of all sciences. Existing World and Curiosity explorations remain available.', workload: 'The sum includes measurement and the investigation report. Revisit a new object or latitude later to test transfer.',
  },
  python: {
    audience: 'Beginning programmers who want to automate reliable file and data processing.',
    requirements: 'Locate files, save a draft and follow a decision table. The Computer Fundamentals path supplies this preparation. A Python runtime is needed for executable workshops.',
    outcomes: ['Trace values, conditions, loops and functions.', 'Validate records without confusing invalid input with valid zero values.', 'Separate computation from file and database effects.', 'Deliver a tested inventory importer with rejected-row evidence.'],
    sequence: ['Foundation: learning tools and the Python introduction.', 'Beginner: core exercises in values, control flow and functions.', 'Intermediate: collections, input validation and debugging.', 'Applied: professional laboratory, CSV/SQL processing and inventory capstone.'],
    next: ['database', 'api'], reviewStatus: 'Existing lessons and workshops preserved. Program structure reviewed; comprehensive lesson-by-lesson technical review remains pending.',
    workload: 'The displayed sum is the existing lesson estimate. Budget an additional 3–5 hours for an independent inventory project, tests and corrections; actual time varies.',
  },
  javascript: {
    audience: 'Learners building interactive browser interfaces.', requirements: 'File navigation and basic arithmetic. HTML and CSS preparation is included before JavaScript. Use a browser and a local practice editor.',
    outcomes: ['Trace value and object changes without accidental mutation.', 'Handle DOM events and validate forms.', 'Represent loading, success, empty and error states.', 'Build an accessible product interface with reproducible interaction tests.'],
    sequence: ['Foundation: tools, semantic HTML, CSS and responsive layout.', 'Beginner: JavaScript values, functions and collections.', 'Intermediate: DOM, forms, storage and asynchronous failures.', 'Applied: TypeScript contracts, React state and interface project.'],
    next: ['nextjs', 'api'], reviewStatus: 'Existing teaching and interface workshop preserved. Framework examples still require individual version review.',
    workload: 'Lesson estimates exclude an independent 4–6 hour interface project and review. Do not infer mastery from reading time.',
  },
  nextjs: {
    audience: 'Web learners progressing from JavaScript and React to a server-rendered application.', requirements: 'You should be able to build a form, explain an asynchronous request and distinguish client/server responsibilities. Included foundation modules can be used for revision.',
    outcomes: ['Compose routes and layouts around user tasks.', 'Keep secrets and authorization on the server.', 'Choose server/client boundaries with an explanation.', 'Test loading, failure and unauthorized cases before a release rehearsal.'],
    sequence: ['Preparation: web foundations, JavaScript, async operations and types.', 'Core: React components, state and forms before the Next.js introduction.', 'Intermediate: routing, server data and interactive boundaries.', 'Applied: access control, quality, deployment rehearsal and store capstone.'],
    next: ['real-site', 'deploy'], reviewStatus: 'Existing content retained. Server/client boundary guidance checked against current Next.js documentation; individual historical examples are not all revalidated.',
    workload: 'Lesson estimates plus approximately 6–10 hours for independent capstone implementation and error-case testing. A published production release is not required.',
  },
  'real-site': {
    audience: 'Developers integrating frontend, APIs, database access and operational evidence in a full-stack store.', requirements: 'Complete JavaScript/React basics and be able to explain HTTP, a relational key and server-side authorization. Use included introductory modules for remediation; repository exploration alone is not implementation experience.',
    outcomes: ['Trace a user action through interface, server and persistence.', 'Define data ownership and validate mutations.', 'Demonstrate a small reversible change with integration tests.', 'Document observed behavior, failure cases and a rollback procedure.'],
    sequence: ['Orientation: inspect the repository and trace a complete interaction.', 'Foundation: included programming and interface modules.', 'Integration: connect routes, validation and persistence using the repository examples.', 'Capstone: a bounded end-to-end feature with evidence and a reversal plan.'],
    next: ['deploy', 'api'], reviewStatus: 'Full-stack repository pathway; existing lessons retained. Historical reference material is not automatically certified as current implementation guidance.',
    workload: 'The sum includes repository study. Allow a separate 8–12 hours for a small independent full-stack feature and verification; a whole production store takes substantially more work.',
  },
  'academy-foundations': {
    audience: 'First-time programmers who prefer the existing Darija teaching sequence.', requirements: 'No programming knowledge. A computer and basic file access are needed for practical tasks.',
    outcomes: ['Explain saved files and relative paths.', 'Create a semantic HTML page.', 'Predict a JavaScript calculation and a decision boundary.', 'Trace a visible storefront behavior to observed source code.'],
    sequence: ['Orientation: computers, files and precise rules.', 'Beginner: HTML document structure.', 'Beginner: JavaScript values and decisions.', 'Applied: inspect a real website and build a portable product-page handoff.'],
    next: ['javascript', 'python'], reviewStatus: 'Existing authored Darija lessons, exercises and readiness checks preserved.', workload: 'Use the lesson estimates plus 2–3 hours for an independent product-page workshop and corrections.',
  },
  api: {
    audience: 'Developers designing server interfaces for applications.', requirements: 'Basic JavaScript, HTTP request/response reasoning and a local test project. Revise async JavaScript before the backend workshops.',
    outcomes: ['Specify request and response contracts.', 'Reject malformed input and unauthorized resource access.', 'Handle retries and duplicate events intentionally.', 'Test successful and failed requests with reproducible evidence.'],
    sequence: ['Foundation: Internet, JavaScript data and async behavior.', 'Core: typed contracts and API design.', 'Intermediate: SQL, ownership checks and error tests.', 'Applied: webhook and deployment reliability workshop.'],
    next: ['database', 'real-site'], reviewStatus: 'Existing lessons and API workshop retained; external service examples need version-specific verification before use.', workload: 'Lesson estimates plus 4–6 hours for the independent API workshop, including invalid and unauthorized requests.',
  },
  database: {
    audience: 'Application developers who need reliable relational persistence.', requirements: 'Understand records, identifiers and a basic request/response. SQL starts from fundamentals. Use only a local or disposable practice database.',
    outcomes: ['Model entities, keys and relationships.', 'Write queries and reason about joins.', 'Distinguish authentication from row ownership.', 'Demonstrate a transaction failure and a recoverable backup procedure.'],
    sequence: ['Foundation: web context and relational modeling.', 'Core: SQL queries and data constraints.', 'Intermediate: Supabase, access policies and database build lab.', 'Applied: security tests, recovery and operational handoff.'],
    next: ['api', 'real-site'], reviewStatus: 'Existing SQL and database labs retained. Production policy correctness is not implied by course completion.', workload: 'Lesson estimates plus 4–6 hours for independent schema, access tests and restore rehearsal.',
  },
  deploy: {
    audience: 'Developers with a working local application preparing a controlled release.', requirements: 'A disposable project that runs locally, basic Git and ability to reproduce a failing test. Do not begin with a live customer system.',
    outcomes: ['Create a traceable release candidate.', 'Separate configuration and secrets.', 'Check a deployed test environment with meaningful smoke tests.', 'Document rollback and restore limitations.'],
    sequence: ['Preparation: tools, web behavior and Git.', 'Core: security and quality checks.', 'Applied: deployment guide and operations.', 'Capstone: release evidence, failed-check response and rollback rehearsal.'],
    next: ['real-site', 'api'], reviewStatus: 'Existing release workshop retained. Hosting UI, limits and commands must be checked against the provider and project version.', workload: 'Lesson estimates plus 3–5 hours for release rehearsal and recovery evidence. Hosting purchase or production deployment is optional.',
  },
  'iptv-live': {
    audience: 'Learners building a local live-video demonstration with content they own.', requirements: 'A computer for the existing OBS, FFmpeg, VLC and Docker exercises. Take JavaScript/React preparation before building the application phase.',
    outcomes: ['Explain source, encoding, transport and playback boundaries.', 'Build and inspect a local stream and playlist.', 'Diagnose playback using observed segment and manifest behavior.', 'Present a legal local demonstration with failure and resource limits.'],
    sequence: ['Foundation: source, encoder and player responsibilities.', 'Core: local server, playlists and program guide.', 'Applied: player integration, access control and troubleshooting.', 'Capstone: owned-video demo with interruption and recovery evidence.'],
    next: ['iptv', 'deploy'], reviewStatus: 'Existing localized live-TV lessons and workshop retained. Device codecs and external tool versions need environment checks.', workload: 'Lesson estimates plus 4–8 hours for a local demo and playback diagnostics. Encoding speed depends on hardware.',
  },
  iptv: {
    audience: 'Web developers integrating an owned-video catalogue and player.', requirements: 'HTML, JavaScript, async requests and React; preparation modules are included. Supply only test media you have permission to use.',
    outcomes: ['Model channels and schedule data.', 'Render player loading and failure states.', 'Persist favorites without confusing them with server authorization.', 'Test keyboard interaction and unavailable media.'],
    sequence: ['Foundation: web, async and React skills.', 'Core: application routes and player workshop.', 'Applied: accessibility, quality and operational checks.', 'Capstone: catalogue, HLS player, favorites and evidence-backed handoff.'],
    next: ['deploy', 'api'], reviewStatus: 'Existing application workshop retained; compatibility across actual playback devices is not yet verified.', workload: 'Lesson estimates plus 5–8 hours for independent player integration and failure-case review.',
  },
  'computer-basics': {
    audience: 'New computer users preparing for programming or independent digital study.',
    requirements: 'No coding experience. Use a file manager, text editor and browser on a computer for practical evidence. The preserved introduction is Arabic; the new practical sequence is English.',
    outcomes: ['Explain CPU, memory and persistent storage.', 'Organize files and demonstrate recovery without overwriting current work.', 'Distinguish network observations from diagnoses.', 'Match risks to protections and test a precise algorithm.', 'Hand over a reproducible workspace with an honest evidence record.'],
    sequence: ['Foundation: the existing inside-a-computer lesson.', 'Level 1: files, paths and a portable workspace project.', 'Level 2: web diagnosis and a safe-recovery runbook project.', 'Level 3: decision rules, boundary tests and an integrated handoff capstone.'],
    next: ['python', 'javascript'],
    reviewStatus: 'Practical sequence checked with content, navigation, runnable-example and persistence tests. Existing Arabic introduction preserved. Physical-device assessment is not verified.',
    workload: 'Lesson estimates include practice and capstone work. Allow additional time for corrections and a later independent recall attempt; the timer is not a completion requirement.',
  },
};
