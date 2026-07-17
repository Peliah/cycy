# Product Requirements Document

## Cycy — AI Course Agents on a Learning Platform

**Version:** 1.0  
**Status:** Draft — reflects product, technical, and UX decisions through layout lock  
**Candidate tagline:** *"Study like you know what you're bad at."*

---

## Table of Contents

1. [One-Line Summary](#1-one-line-summary)
2. [Problem Statement](#2-problem-statement)
3. [Value Proposition](#3-value-proposition)
4. [Target User](#4-target-user-v1)
5. [Product Pillars](#5-product-pillars)
6. [Core Mental Model](#6-core-mental-model)
7. [Core Learning Loop](#7-core-learning-loop)
8. [Scoring & Leaderboards](#8-scoring--leaderboards)
9. [User Experience & Visual Design](#9-user-experience--visual-design)
10. [Onboarding](#10-onboarding)
11. [Functional Requirements](#11-functional-requirements)
12. [Non-Functional Requirements](#12-non-functional-requirements)
13. [Technical Architecture](#13-technical-architecture)
14. [Data Model](#14-data-model-summary)
15. [Content Strategy](#15-content-strategy)
16. [Roles & Permissions](#16-roles--permissions)
17. [Release Phases](#17-release-phases)
18. [Success Metrics](#18-success-metrics)
19. [Analytics Events](#19-analytics-events)
20. [Risks & Mitigations](#20-risks--mitigations)
21. [Out of Scope](#21-out-of-scope-v1)
22. [Open Questions](#22-open-questions)
23. [Appendix: Gap from Current Codebase](#23-appendix-gap-from-current-codebase)

---

## 1. One-Line Summary

A learning platform where every course is an AI agent living inside its own space. Studying, practicing, and reviewing happen in one continuous loop — not across five disconnected apps — and the platform tells you specifically what you don't understand, not just that you got something wrong.

---

## 2. Problem Statement

Students who study alone can't tell if they actually understand something until it's too late — the exam. Existing tools each solve one slice and leave the rest to the student to stitch together:

| Tool category | Gap |
|---------------|-----|
| **Quizlet / flashcard apps** | Drill without diagnosis. Wrong is wrong; no insight into *why*. |
| **ChatGPT / generic AI tutors** | Answer questions but have no persistent model of what a specific learner does and doesn't understand. |
| **Duolingo** | Excellent gamification and retention, but content is broad/hobbyist — not mapped to real coursework. |
| **Study groups / Discord servers** | Social accountability exists, but no structured curriculum or diagnostic layer underneath the chat. |

**Nobody combines** real subject teaching + targeted, diagnostic practice + optional social accountability in a single loop.

---

## 3. Value Proposition

**For students who study alone and can't tell if they actually understand something until the exam** — this platform is a learning space where studying, practicing, and reviewing all happen inside one AI-guided loop, instead of across disconnected apps and a group chat.

**Unlike** Quizlet or ChatGPT (which answer questions but don't know what you don't know) or Duolingo (which gamifies but doesn't teach real coursework), this platform combines actual subject teaching, targeted practice, and optional social accountability into a single loop — and names the specific misconception, not just "wrong."

### What this sells the user

1. **"I know exactly what I'm bad at, not just that I got it wrong."** — Misconceptions are typed and diagnosed, not just marked incorrect.
2. **"I won't forget it in three weeks."** — Spaced repetition tuned to individual forgetting, not a one-and-done quiz.
3. **"I'm not doing this alone — unless I want to be."** — Social pressure (leagues, groups) is optional, not mandatory.
4. **"It's built for my actual course."** — Curated, coursework-mapped content, not generic trivia.

### Known limitation (stated honestly)

Strongest for **motivated-but-directionless** learners — people who study but don't know where the gaps are. Weaker for someone who isn't studying at all; gamification alone won't create motivation from zero.

---

## 4. Target User (v1)

**Decision:** Design for all three situations, not one narrow persona:

| Situation | Example |
|-----------|---------|
| **Retaking a course** | Failed midterm; needs gap visibility before the retake |
| **Exam prep** | High-stakes test in weeks; wants efficient practice |
| **Self-study** | No structured curriculum; motivated but directionless |

**Common thread:** Already putting in effort; lacking visibility into where the gaps are.

**Implication:** Onboarding asks *why* someone is here so tone and pacing can adapt. The underlying learning loop stays identical across all three.

---

## 5. Product Pillars

| Pillar | Definition | How we address it |
|--------|------------|-------------------|
| **Personalized** | Learning adapts to the individual | Misconception typing, rank-calibrated difficulty, spaced repetition, alternate re-explanation angles |
| **Engaging** | People come back | Leagues, leaderboards, streaks — revealed *after* first genuine learning value, not before |
| **Easy to use** | Low friction to value | Join course = main onboarding step; solo practice by default; single next-action at every step; `@Agent` invocation people already know from chat |
| **Accessible** | Reachable without paywalling core value | Solo loop free forever; curated seed content; plain-language authoring standard |

---

## 6. Core Mental Model

Built on top of an **existing real-time chat platform** (Cycy) being revived — Next.js, real-time websockets, servers, communities, groups — not built from scratch.

### Platform primitive mapping

| Platform primitive (technical) | Product meaning | Phase |
|-------------------------------|-----------------|-------|
| **Server** | A **course agent** (e.g. "Calculus," "Organic Chemistry") | MVP |
| **Community** (inside a server) | Public space for that course; course leaderboard lives here | Phase 2 |
| **Group** (inside a server) | Invite-only study league among friends; scoped leaderboard | Phase 2 |
| **DM with the agent** | Private/solo practice; gated behind course membership; not counted on shared leaderboards | MVP |
| **Peer DM** | Study-buddy chat (optional social) | Keep as-is |
| **Member** | Learner enrolled in a course | MVP |
| **Channel** | Community room (Phase 2); concepts live in content bank, not channels | Phase 2 |

### Invocation

Tag/mention the agent (`@CalculusAgent ...`) whether in a DM, a group, or the community — **same trigger, different audience**.

Joining a course is the primary onboarding step. There is no separate mode-switch or room picker before first value. Solo, group, and community are different places to talk to the **same** agent.

### In-server routing

The server itself is the routing layer for MVP — you are in the server whose agent you are talking to. A lightweight directory/discovery layer can recommend courses later; it does not need to live-route conversations.

---

## 7. Core Learning Loop

Runs identically inside any room type, for **one concept at a time**.

```
Study → Quick check → Practice → Explain-back → Spaced repetition
         ↑ fail          ↑ miss                    ↑ schedule review
         └── alternate   └── misconception +       └── reset on fail
             explanation     micro-drill
```

### 7.1 Study

Agent delivers a short, focused unit: plain-language explanation + one worked example, pulled from a **curated content bank** (not freely generated).

### 7.2 Quick check

1–2 low-stakes comprehension questions before real practice.

- **Pass** → Practice
- **Fail** → back to Study using an **alternate explanation angle** (pre-authored), not a repeat of the same material

### 7.3 Practice

Agent presents a problem calibrated to the learner's current rank (tiered: easy → hard).

**Correct:**

- Explain-back check before tier increases
- Default: lightweight **multiple-choice justification**
- Escalates to **free-text** graded by the agent after a repeated miss on that concept, or for concepts flagged as **high-stakes**

**Incorrect:**

- Specific misconception tagged against a known taxonomy for that concept
- Targeted **micro-drill** follows — addresses *that* gap, not a generic re-explanation

### 7.4 Spaced repetition

Concept resurfaces before it's likely to be forgotten. Interval resets on failure.

### 7.5 Personalization detail

Each known misconception has **2–3 alternate teaching angles** authored in advance. Failing the same way twice produces a genuinely different explanation, not a repeat.

---

## 8. Scoring & Leaderboards

| Rule | Detail |
|------|--------|
| **Score unit** | One difficulty-weighted score per course per user |
| **Score sources** | Activity in any room (DM, group, community) feeds the same score |
| **ELO-style gain** | Score scales with problem difficulty relative to current rank — prevents low-value grinding |
| **Repeat attempts** | Update misconception/mastery signal but **do not** re-award rank points on same problem |
| **Leaderboard model** | Filtered views of the same underlying score — not separate systems |
| **Solo practice** | Updates personal mastery/score but **not shown** on shared leaderboards |
| **Global cross-course rank** | **Average** across courses (rewards depth over breadth), not sum |

### Leaderboard scopes (Phase 2)

| Scope | Key |
|-------|-----|
| Course community | `leaderboard:{serverId}:community` |
| Study group | `leaderboard:{serverId}:group:{groupId}` |
| Global | Average of per-course `CourseScore` |

---

## 9. User Experience & Visual Design

### 9.1 Layout decision (locked)

**Keep the current Cycy layout.** The course icon rail + sidebar + main pane feels easier on the eyes and familiar.

```
┌──┬────────────┬──────────────────────────────┐
│○ │ Sidebar    │  Main pane                   │
│○ │ (course    │  agent DM / practice / chat  │
│○ │  nav)      │                              │
│+ │            │                              │
└──┴────────────┴──────────────────────────────┘
 course rail     server sidebar     content
```

**Rejected alternatives:** thin top-bar-only shell, Cursor-style studio (canvas + agent split), killing the icon rail.

### 9.2 What changes (visual design only)

| Layer | Change |
|-------|--------|
| **Palette** | New CSS tokens; leave legacy zinc `#313338`; light-first or soft dual theme |
| **Typography** | Distinctive display + readable body; clear hierarchy for agent / user / system messages |
| **Surfaces** | Softer panels, refined borders/radius; less "gaming chat" chrome |
| **Components** | Restyle shadcn/Radix; refine circular course icons |
| **Learning accents** | Agent message style, misconception **gap callout**, progress on course items, step chips in-thread |
| **Copy** | "Course" not "Server" where easy; layout unchanged |

### 9.3 UX principles

1. **No room picker before first value** — join course → land in solo agent practice with first concept ready
2. **Single next-action** — structured buttons/MCQs for loop steps; not open-ended chat for the loop itself
3. **`@Agent` for free-form questions** — ad-hoc questions between concepts; agent stays scoped to content bank
4. **Gamification reveals after value** — no leaderboard/streak UI until first concept completed

### 9.4 Signature design moment

**Gap callout** — when a misconception is tagged, the UI names it in plain language as a first-class inline moment (e.g. *"Sign-error on the constant term"*) with a clear next action.

### 9.5 Mobile

- Keep existing sheet/toggle patterns for course rail and sidebar
- Main pane: learning loop content stacks vertically
- Agent chat and MCQ actions remain usable on small screens; no third column on mobile

---

## 10. Onboarding

### Step 1: Authentication

Clerk (existing) — Google OAuth supported.

### Step 2: Study intent

Ask why the learner is here:

| Intent | Enum |
|--------|------|
| Retaking a course | `RETAKE` |
| Exam prep | `EXAM_PREP` |
| Self-study | `SELF_STUDY` |

Stored on `Profile.studyIntent`. Adapts tone/pacing; loop is identical.

### Step 3: Join a course

Via browse, create, or invite code (existing server invite flow). Auto-create agent conversation on join.

### Step 4: First value

Redirect to solo agent practice — not empty `#general` chat.

---

## 11. Functional Requirements

### 11.1 MVP (Phase 1)

| ID | Requirement | Priority |
|----|-------------|----------|
| F1 | One fully built course agent with complete study → check → practice loop | P0 |
| F2 | Curated content bank for one pilot subject (10–15 concepts) | P0 |
| F3 | Agent-as-DM-target (schema + routing) | P0 |
| F4 | Mastra learning-loop workflow with suspend/resume for MCQs | P0 |
| F5 | Misconception taxonomy + alternate explanation angles | P0 |
| F6 | Mastery ledger (per-concept state, attempts, spaced rep scheduling) | P0 |
| F7 | `@AgentHandle` invocation in agent conversation | P0 |
| F8 | Visual design system restyle (tokens, type, surfaces) | P0 |
| F9 | Learning UI in main pane (agent bubbles, MCQ actions, gap callout) | P0 |
| F10 | Onboarding intent capture | P1 |
| F11 | Explain-back (MCQ default; free-text escalation) | P1 |

### 11.2 Phase 2

| ID | Requirement |
|----|-------------|
| F12 | Community room per course + `@Agent` in community channels |
| F13 | Study groups (invite-only leagues) + scoped leaderboards |
| F14 | Redis leaderboard sorted sets |
| F15 | Global cross-course rank (average formula) |
| F16 | ELO-style course score UI |
| F17 | Course discovery / directory (lightweight browse) |

### 11.3 Phase 3

| ID | Requirement |
|----|-------------|
| F18 | Cross-course A2A handoff (e.g. Calculus → Algebra for factoring gap) |
| F19 | Prerequisite concept mapping across courses |
| F20 | Handoff UI ("Your Algebra agent can help with this") |

---

## 12. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| **Real-time** | Socket.io for message delivery (existing); async Mastra after 201 response |
| **Auth** | Clerk; all learning data scoped to authenticated profile |
| **Performance** | Agent workflow must not block user message save; emit agent replies as ready |
| **Accessibility** | Keyboard focus, reduced motion respected; plain-language content standard |
| **Cost control** | Agent tools limited to content bank; no open web; `@Agent` for free-form only |
| **Data durability** | Postgres source of truth for mastery; Redis cache for leaderboards only |

---

## 13. Technical Architecture

### 13.1 Current stack (Cycy codebase)

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router + Pages API for sockets) |
| Auth | Clerk |
| Database | PostgreSQL + Prisma |
| Real-time | Socket.io |
| Voice/Video | LiveKit (existing; deprioritized for MVP) |
| UI | Tailwind CSS 4, Radix/shadcn, Zustand, TanStack Query |
| File uploads | UploadThing |

### 13.2 Additions

| Layer | Technology | Phase |
|-------|------------|-------|
| Agent engine | **Mastra** (`@mastra/core`) | 1 |
| Leaderboards | Upstash Redis (sorted sets) | 2 |
| LLM | OpenAI or Anthropic via Mastra model router | 1 |

### 13.3 Mastra responsibilities

| Concern | Mastra primitive |
|---------|------------------|
| Learning loop orchestration | Workflow (`.then()`, `.branch()`) |
| Content-grounded behavior | Typed tools (Prisma-backed) |
| MCQ / explain-back pauses | Workflow suspend/resume |
| Free-form `@Agent` questions | Agent (lighter than full workflow) |
| Cross-course handoff | A2A (Phase 3) |
| Local debugging | Mastra Studio |

### 13.4 Agent tool guardrails

Agents may **only** use:

| Tool | Purpose |
|------|---------|
| `fetchStudyUnit` | Curated explanation by concept + angle |
| `fetchComprehensionQuestion` | Quick check |
| `fetchPracticeProblem` | Rank-calibrated problem |
| `logMisconception` | Write to mastery ledger |
| `scheduleReview` | Spaced-rep interval |
| `logPracticeAttempt` | Attempt + score delta |

**No** open web access. **No** general-assistant behavior. LLM used for grading free-text explain-back and routing — not inventing curriculum.

### 13.5 Integration flow

```
User message / MCQ action
  → Socket.io handler saves user message, emits immediately (201)
  → Mastra workflow start or resume
  → Tools read/write Postgres (content bank + mastery ledger)
  → Agent + SYSTEM messages saved and emitted via Socket.io
```

Socket handlers stay thin: authenticate, persist user input, call Mastra, persist outputs, emit.

### 13.6 Confirmed platform gaps

| Gap | Impact | Resolution |
|-----|--------|------------|
| **Agent-as-DM-target** | Cannot solo-practice with agent today | `ConversationType: AGENT`; nullable `memberTwoId`; `serverId` on conversation |
| **Content bank** | No concepts, problems, misconceptions | New Prisma models + seed |
| **Mastery ledger** | No per-learner concept state | `LearnerConceptState`, `PracticeAttempt`, `CourseScore` |
| **Redis** | No leaderboard infra | Upstash Redis Phase 2 |
| **Community / StudyGroup** | Only generic channels exist | `StudyGroup` model + `roomScope` on channels Phase 2 |

### 13.7 Environment variables (new)

```
# Mastra / LLM
OPENAI_API_KEY=
# or ANTHROPIC_API_KEY=

# Upstash Redis (Phase 2)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

---

## 14. Data Model (summary)

### Course agent (extends `Server`)

- `description`, `subject`
- `agentName`, `agentHandle` (e.g. `@CalculusAgent`)
- `agentImageUrl`, `systemPrompt`

### Content bank (per course)

- `Concept` — slug, title, rank tier, high-stakes flag
- `StudyUnit` — explanation, worked example, `angleIndex` (0 = primary; 1–2 = alternates)
- `ComprehensionQuestion` — prompt + MCQ choices
- `PracticeProblem` — difficulty, prompt, solution, rubric
- `Misconception` — taxonomy code, label, linked alternate angles

### Mastery ledger

- `LearnerConceptState` — rank (ELO), mastery, `nextReviewAt`, active misconceptions, explain-back mode
- `PracticeAttempt` — correct, misconception code, score delta, room type
- `CourseScore` — per profile per course

### Messages

- `MessageAuthorType`: `USER` | `AI_AGENT` | `SYSTEM`
- Optional `memberId` when author is agent or system

### Learner profile

- `studyIntent`: `RETAKE` | `EXAM_PREP` | `SELF_STUDY`

### Conversations

- `ConversationType`: `PEER` | `AGENT`
- One `AGENT` conversation per `(memberId, serverId)`

---

## 15. Content Strategy

### MVP supply model

- **Platform-curated only** — one pilot course seeded by the team
- 10–15 concepts with full content per concept:
  - 1 primary + 2 alternate study angles
  - 1–2 comprehension questions
  - 3+ practice problems at varied difficulty
  - 2–3 misconceptions with labels and micro-drill paths

### Long-term supply model

- Hybrid: curated seed + community-submitted content
- Reddit-style voting to scale without abandoning quality control
- Plain-language authoring standard — no unexplained jargon
- Core solo loop free forever

### Content authoring workflow (future)

1. Platform authors seed courses
2. Community submits improvements / new problems (Phase 2+)
3. Voting + moderation queue before publication
4. Misconception taxonomy maintained per concept by subject experts

---

## 16. Roles & Permissions

Maps existing Cycy roles to learning product language:

| Technical role | Product label | Capabilities |
|----------------|---------------|--------------|
| `ADMIN` | Instructor / course owner | Create channels, manage members, edit course settings |
| `MODERATOR` | TA | Manage members, moderate community (Phase 2) |
| `GUEST` | Student | Practice, chat, join groups |

MVP focuses on student experience; instructor tooling is minimal (course creation exists via current server create flow).

---

## 17. Release Phases

### Phase 1 — One course agent, solo practice, visual restyle

**Goal:** Full learning loop for one subject inside existing Cycy layout with new visual design.

**Estimated effort:** 8–12 weeks (focused team), depending on pilot course content scope.

| # | Deliverable |
|---|-------------|
| 1 | Visual design system (tokens, palette, typography) |
| 2 | Schema: agent DM, content bank, mastery ledger |
| 3 | Mastra agent + learning-loop workflow |
| 4 | Onboarding intent |
| 5 | Learning UI in main pane (agent bubbles, MCQs, gap callout) |
| 6 | Agent DM wired to Mastra + Socket.io |
| 7 | Pilot course content seed |
| 8 | Join course → agent practice (not empty general channel) |

**Deferred:** layout IA redesign, leaderboards, groups, community, A2A, streaks/leagues UI, LiveKit as core flow.

### Phase 2 — Social rooms + leaderboards

**Estimated effort:** +4–6 weeks

- Study groups + community rooms
- `@Agent` in shared channels
- Redis leaderboards (community, group, global average)
- Gamification chrome after first concept complete
- Course discovery directory

### Phase 3 — Cross-course intelligence

**Estimated effort:** +3–4 weeks

- Misconception → prerequisite mapping across courses
- Mastra A2A handoff with explicit context payload
- Handoff UI in chat

---

## 18. Success Metrics

| Metric | What it tells us |
|--------|------------------|
| **Time-to-first-value** | Join → first quick-check completed |
| **7-day retention** | % returning for second session within 7 days |
| **Misconception recurrence rate** | % of tagged misconceptions that do *not* recur on next attempt |
| **Solo vs. social ratio** | Whether "optional social pressure" framing lands (Phase 2+) |

---

## 19. Analytics Events

| Event | Properties | Tied to metric |
|-------|------------|----------------|
| `onboarding_intent_selected` | `intent` | Segmentation |
| `course_joined` | `serverId`, `method` (invite/browse/create) | Activation |
| `concept_study_started` | `conceptId`, `serverId` | Engagement |
| `quick_check_completed` | `conceptId`, `passed` | Time-to-first-value |
| `practice_attempted` | `problemId`, `correct`, `misconceptionCode` | Loop health |
| `misconception_tagged` | `code`, `conceptId` | Personalization |
| `concept_completed` | `conceptId`, `durationMs` | Progress |
| `session_started` | `serverId`, `roomType` | Retention |
| `session_ended` | `durationMs`, `conceptsCompleted` | Retention |
| `leaderboard_viewed` | `scope` | Social engagement (P2) |

---

## 20. Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Agent DM schema breaks peer DMs | Separate `ConversationType` code paths |
| Mastra latency blocks chat | Return 201 immediately; async workflow |
| Content bank too thin | Ship one well-authored pilot course |
| Workflow feels like a form | Hybrid: structured loop + free `@Agent` chat |
| Legacy chat look persists after restyle | Dedicated token pass + agent/gap signature components |
| Gamification before value | Hide leaderboards until first concept complete |
| Redis complexity | Defer to Phase 2; Postgres interim for ranks |
| A2A handoff confuses learners | Explicit UI copy + explicit context in payload |

---

## 21. Out of Scope (v1)

- Full route rename (`/courses` vs `/servers`) — internal mapping only
- RAG / document upload for course materials
- Streaming AI responses (full response then emit first)
- LiveKit voice/video as core learning flow
- Replacing Clerk or Socket.io
- Building motivation from zero (known limitation)
- Monetization / pricing (solo free; pricing TBD)
- Legal / COPPA compliance review

---

## 22. Open Questions

| Question | Status |
|----------|--------|
| Pilot course subject | Open — Algebra vs Calculus intro |
| Light vs dark default theme | Open — pick at token pass |
| Brand accent color | Open — teal/ink recommended |
| Product name at launch | **Cycy** — confirmed |
| Instructor-authored courses | Post-MVP; platform-seeded for Phase 1 |
| Monetization model | Open |

---

## 23. Appendix: Gap from Current Codebase

Cycy today is a real-time learning-ready chat platform (Next.js 16, Clerk, Prisma/Postgres, Socket.io, LiveKit).

| Area | Today | Target |
|------|-------|--------|
| Platform shell | ~50% done (auth, chat, invites, real-time) | Restyle + learning accents |
| Learning engine | ~0% | Mastra + content bank + mastery ledger |
| Agent DM | Blocked (peer-only conversations) | Phase 1 schema work |
| Content | None | Pilot course seed |
| Leaderboards | None | Phase 2 + Redis |
| Redis | Not in stack | Upstash Phase 2 |

**Summary:** ~half the infrastructure shell exists; ~10–15% of the product vision is built. Mastra integration and content authoring are the bulk of remaining work.

### Existing features — disposition

| Feature | Disposition |
|---------|-------------|
| Course icon rail + sidebar | **Keep** — restyle |
| Real-time chat (Socket.io) | **Keep** — wire to agent |
| Peer DMs | **Keep** — study buddies |
| Invite codes | **Keep** — course enrollment |
| LiveKit A/V channels | **Hide** in MVP UI; revisit for office hours |
| Member role management | **Keep** — relabel in copy |

---

*Document synthesized from product discussions, codebase analysis, and implementation planning. Last updated: July 2026.*
