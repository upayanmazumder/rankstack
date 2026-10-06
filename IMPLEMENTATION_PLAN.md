# Rankstack — Sprint Implementation Plan

**Duration:** Oct 7 – Oct 11, 2026 (5 working days)
**Dev freeze:** End of Oct 10 — all feature code merged
**Oct 11:** Testing, docs, final review prep

## Team

| Member | GitHub | Role | Focus |
|--------|--------|------|-------|
| Upayan Mazumder | `upayanmazumder` | Lead | Backend hardening, frontend core, integration, infra |
| Shloak Sinha | `Shloak2005` | Dev | Admin panel, problem management, team management UI |
| Aditya Rawat | `adityarawat-05` | Dev | Auth pages, app shell/layout, leaderboard UI |

## Branching Strategy

Feature branches off `main`, PRs to `main`. Each dev works on isolated file paths to minimize conflicts.

**Branch naming:** `feat/<issue-number>-<short-description>` (e.g. `feat/128-auth-middleware`)

---

## GitHub Tracking Structure

### Milestones

| Milestone | Due Date | Description | GitHub URL |
|---|---|---|---|
| **Day 1 - Foundation** | 2026-10-07 | Authentication middleware, cascade delete fixes, API hooks, UI components | [Milestone 1](https://github.com/upayanmazumder/rankstack/milestone/1) |
| **Day 2 - Core Features** | 2026-10-08 | Core application routes: contests, problems, submissions, live leaderboard, teams | [Milestone 2](https://github.com/upayanmazumder/rankstack/milestone/2) |
| **Day 3 - Admin and Tests** | 2026-10-09 | Administrative interfaces, backend integration tests, frontend unit tests | [Milestone 3](https://github.com/upayanmazumder/rankstack/milestone/3) |
| **Day 4 - Dev Freeze and Polish** | 2026-10-10 | Feature freeze, validation, error handling, responsive design, accessibility | [Milestone 4](https://github.com/upayanmazumder/rankstack/milestone/4) |
| **Day 5 - Documentation and Review Prep** | 2026-10-11 | System documentation, test suite verification, final review preparation | [Milestone 5](https://github.com/upayanmazumder/rankstack/milestone/5) |

---

## Detailed Sprint Schedule and Issue Directory

### Day 1 — Oct 7 (Tuesday): Foundation Architecture and Base Components

**Parent Epic:** #123 (`upayanmazumder`) — [Day 1 Epic](https://github.com/upayanmazumder/rankstack/issues/123)

| Issue | Title | Assignee | Labels | Milestone |
|---|---|---|---|---|
| **#128** | Implement session-based authentication middleware in FastAPI | `upayanmazumder` | `backend`, `critical`, `subissue`, `day-1` | Day 1 |
| **#129** | Correct cascading deletion and reference cleanup across collections | `upayanmazumder` | `backend`, `bug`, `critical`, `subissue`, `day-1` | Day 1 |
| **#130** | Configure frontend environment variables and application metadata | `upayanmazumder` | `frontend`, `infra`, `subissue`, `day-1` | Day 1 |
| **#131** | Construct TypeScript API definitions, TanStack Query hooks, and authentication store | `upayanmazumder` | `frontend`, `critical`, `subissue`, `day-1` | Day 1 |
| **#132** | Add fundamental UI primitive components from shadcn design system | `adityarawat-05` | `frontend`, `subissue`, `day-1` | Day 1 |
| **#133** | Build application shell with header, sidebar navigation, and route layouts | `adityarawat-05` | `frontend`, `critical`, `subissue`, `day-1` | Day 1 |
| **#134** | Create user authentication pages for login and registration with route guard | `adityarawat-05` | `frontend`, `critical`, `subissue`, `day-1` | Day 1 |
| **#135** | Develop shared contest, problem, submission, and leaderboard display components | `Shloak2005` | `frontend`, `subissue`, `day-1` | Day 1 |

---

### Day 2 — Oct 8 (Wednesday): Core Product Pages and Live Leaderboard

**Parent Epic:** #124 (`upayanmazumder`) — [Day 2 Epic](https://github.com/upayanmazumder/rankstack/issues/124)

| Issue | Title | Assignee | Labels | Milestone |
|---|---|---|---|---|
| **#136** | Build contest list catalog page with status filters and search | `upayanmazumder` | `frontend`, `subissue`, `day-2` | Day 2 |
| **#137** | Build contest overview page with problem listing and participant actions | `upayanmazumder` | `frontend`, `subissue`, `day-2` | Day 2 |
| **#138** | Build problem viewer and solution submission page for all question types | `upayanmazumder` | `frontend`, `subissue`, `day-2` | Day 2 |
| **#139** | Build user submission history page with status filters | `upayanmazumder` | `frontend`, `subissue`, `day-2` | Day 2 |
| **#140** | Add Ruff linter and code formatting enforcement to backend CI workflow | `upayanmazumder` | `backend`, `infra`, `subissue`, `day-2` | Day 2 |
| **#141** | Build live contest leaderboard page with automated polling updates | `adityarawat-05` | `frontend`, `critical`, `subissue`, `day-2` | Day 2 |
| **#142** | Replace default starter page with Rankstack product landing view | `adityarawat-05` | `frontend`, `subissue`, `day-2` | Day 2 |
| **#143** | Build team catalog and team creation modal view | `Shloak2005` | `frontend`, `subissue`, `day-2` | Day 2 |
| **#144** | Build team profile page with roster management and invitation actions | `Shloak2005` | `frontend`, `subissue`, `day-2` | Day 2 |

---

### Day 3 — Oct 9 (Thursday): Administrative Panel and Automated Test Suites

**Parent Epic:** #125 (`upayanmazumder`) — [Day 3 Epic](https://github.com/upayanmazumder/rankstack/issues/125)

| Issue | Title | Assignee | Labels | Milestone |
|---|---|---|---|---|
| **#145** | Build administrative contest management interface | `upayanmazumder` | `frontend`, `admin`, `subissue`, `day-3` | Day 3 |
| **#146** | Build administrative problem management and test case configuration interface | `upayanmazumder` | `frontend`, `admin`, `subissue`, `day-3` | Day 3 |
| **#147** | Build administrative submission review and score adjudication interface | `upayanmazumder` | `frontend`, `admin`, `subissue`, `day-3` | Day 3 |
| **#148** | Build administrative user list and access role configuration interface | `upayanmazumder` | `frontend`, `admin`, `subissue`, `day-3` | Day 3 |
| **#149** | Implement pytest backend integration test suite for authentication, data, and transactions | `upayanmazumder` | `backend`, `testing`, `critical`, `subissue`, `day-3` | Day 3 |
| **#150** | Create frontend test suites for authentication state, API hooks, and navigation | `adityarawat-05` | `frontend`, `testing`, `subissue`, `day-3` | Day 3 |
| **#151** | Build administrative dashboard summary page with aggregation metrics | `Shloak2005` | `frontend`, `admin`, `subissue`, `day-3` | Day 3 |
| **#152** | Develop reusable administrative form components with Zod schema validation | `Shloak2005` | `frontend`, `admin`, `subissue`, `day-3` | Day 3 |

---

### Day 4 — Oct 10 (Friday): Feature Freeze, Validation, and Polish

**Parent Epic:** #126 (`upayanmazumder`) — [Day 4 Epic](https://github.com/upayanmazumder/rankstack/issues/126)

| Issue | Title | Assignee | Labels | Milestone |
|---|---|---|---|---|
| **#153** | Conduct full end-to-end integration walkthrough across all user and admin journeys | `upayanmazumder` | `critical`, `testing`, `subissue`, `day-4` | Day 4 |
| **#154** | Enforce backend relational constraints and input validation on submissions and contests | `upayanmazumder` | `backend`, `bug`, `subissue`, `day-4` | Day 4 |
| **#155** | Implement global error boundary, 404 page, and session expiration interceptors | `upayanmazumder` | `frontend`, `polish`, `subissue`, `day-4` | Day 4 |
| **#156** | Optimize user interface layouts across mobile, tablet, and desktop viewports | `upayanmazumder` | `frontend`, `polish`, `subissue`, `day-4` | Day 4 |
| **#157** | Verify dark theme contrast, palette tokens, and theme switcher stability | `adityarawat-05` | `frontend`, `polish`, `subissue`, `day-4` | Day 4 |
| **#158** | Conduct accessibility audit for keyboard navigation, ARIA attributes, and form labels | `adityarawat-05` | `frontend`, `accessibility`, `subissue`, `day-4` | Day 4 |
| **#159** | Integrate motion transitions and visual state changes across routes | `Shloak2005` | `frontend`, `polish`, `subissue`, `day-4` | Day 4 |
| **#160** | Refine administrative form feedback with optimistic updates and confirmation dialogues | `Shloak2005` | `frontend`, `admin`, `polish`, `subissue`, `day-4` | Day 4 |

---

### Day 5 — Oct 11 (Saturday): System Documentation and Final Review Preparation

**Parent Epic:** #127 (`upayanmazumder`) — [Day 5 Epic](https://github.com/upayanmazumder/rankstack/issues/127)

| Issue | Title | Assignee | Labels | Milestone |
|---|---|---|---|---|
| **#161** | Update project README with architecture description, frontend setup, and endpoint guides | `upayanmazumder` | `documentation`, `subissue`, `day-5` | Day 5 |
| **#162** | Author comprehensive system architecture reference document | `upayanmazumder` | `documentation`, `subissue`, `day-5` | Day 5 |
| **#163** | Write local development and contribution guidelines in CONTRIBUTING.md | `upayanmazumder` | `documentation`, `subissue`, `day-5` | Day 5 |
| **#164** | Execute full automated verification pipelines and confirm clean CI status | `upayanmazumder` | `testing`, `infra`, `critical`, `subissue`, `day-5` | Day 5 |
| **#165** | Review OpenAPI schemas, route docstrings, and Swagger API documentation | `adityarawat-05` | `documentation`, `backend`, `subissue`, `day-5` | Day 5 |
| **#166** | Author frontend component inventory and custom React hooks documentation | `Shloak2005` | `documentation`, `frontend`, `subissue`, `day-5` | Day 5 |

---

## Team Workload Distribution

| Developer | Role | Total Assigned Issues | Day 1 | Day 2 | Day 3 | Day 4 | Day 5 |
|---|---|---|---|---|---|---|---|
| **Upayan Mazumder** (`upayanmazumder`) | Technical Lead | 21 sub-issues + 5 epics | 4 | 5 | 5 | 4 | 3 |
| **Shloak Sinha** (`Shloak2005`) | Frontend Engineer | 8 sub-issues | 1 | 2 | 2 | 2 | 1 |
| **Aditya Rawat** (`adityarawat-05`) | Frontend Engineer | 10 sub-issues | 3 | 2 | 1 | 2 | 2 |
| **Total** | | **39 sub-issues + 5 epics** | **8** | **9** | **8** | **8** | **6** |
