# Frontend Integration Guide

Complete guide for wiring any frontend (cycy or other) to the AI backend: curriculum generation, agent chat, assessments, progress, and course completion.

**Backend base URL (dev):** `http://localhost:4000/api/v1`  
**Interactive API docs:** `http://localhost:4000/api/docs`  
**Related docs:** [API.md](./API.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CONTENT_MODEL.md](./CONTENT_MODEL.md)

---

## Table of contents

1. [Overview](#1-overview)
2. [Environment setup](#2-environment-setup)
3. [Authentication](#3-authentication)
4. [Phase 1 — Onboarding prerequisites](#4-phase-1--onboarding-prerequisites)
5. [Phase 2 — Curriculum bootstrap](#5-phase-2--curriculum-bootstrap)
6. [Phase 3 — Agent conversation setup](#6-phase-3--agent-conversation-setup)
7. [Phase 4 — User sends a message (trigger AI)](#7-phase-4--user-sends-a-message-trigger-ai)
8. [Phase 5 — Receive agent replies (webhook)](#8-phase-5--receive-agent-replies-webhook)
9. [Phase 6 — Learning loop (concept by concept)](#9-phase-6--learning-loop-concept-by-concept)
10. [Phase 7 — Module gate quiz](#10-phase-7--module-gate-quiz)
11. [Phase 8 — Goal verification & certification](#11-phase-8--goal-verification--certification)
12. [Phase 9 — Mock interview & course complete](#12-phase-9--mock-interview--course-complete)
13. [Progress & sidebar APIs](#13-progress--sidebar-apis)
14. [Message metadata reference](#14-message-metadata-reference)
15. [The 8 backend agents](#15-the-8-backend-agents)
16. [Error handling](#16-error-handling)
17. [End-to-end checklist](#17-end-to-end-checklist)

---

## 1. Overview

### What the backend owns

| Responsibility | Backend | Frontend |
|----------------|---------|----------|
| Clerk JWT verification | ✅ | Sends token |
| Curriculum generation (LLM) | ✅ | Triggers + polls status |
| Content bank (Concept, StudyUnit, MCQ, Practice) | ✅ | Displays via webhook messages |
| 8-agent learning workflow (Mastra) | ✅ | Triggers via `/process` |
| Chat message persistence | ❌ | ✅ Your DB |
| Real-time delivery (WebSocket) | ❌ | ✅ Your Socket.io (or equivalent) |
| MCQ / practice UI | Render only | ✅ |
| Grading logic | ✅ | Calls `/assessments/*` |

### High-level flow

```
Onboarding → Bootstrap → Poll READY → Agent DM
    → User message saved + socket emit
    → POST /process (async)
    → Backend runs workflow (8 agents)
    → POST /internal/agent-response (webhook)
    → Frontend saves AI messages + socket emit
    → User clicks MCQ → POST /assessments/submit
    → Repeat until COURSE_COMPLETE
```

### Architecture rule

**The backend never opens WebSockets to the browser.** Agent replies are delivered via an **HTTP webhook** to your frontend server. Your frontend persists messages and emits them over your existing real-time channel.

---

## 2. Environment setup

### Frontend env vars

```env
# AI backend
AI_BACKEND_URL=http://localhost:4000

# Must match backend CYCY_INTERNAL_SECRET exactly
CYCY_INTERNAL_SECRET=change-me-to-a-long-random-string

# Your app URL (backend uses this for webhook target)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Clerk (same app as backend)
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# Shared database with backend
DATABASE_URL=postgresql://...
```

### Backend env vars (for reference)

```env
PORT=4000
DATABASE_URL=...          # same as frontend
CLERK_SECRET_KEY=...      # same as frontend
OPENAI_API_KEY=...        # or OpenRouter sk-or-v1-...
CYCY_URL=http://localhost:3000
CYCY_INTERNAL_SECRET=...  # same as frontend
```

### Health check before integrating

```http
GET http://localhost:4000/api/v1/health
```

Expected:

```json
{ "status": "ok", "database": "connected", "mastra": "ready" }
```

---

## 3. Authentication

All user-facing backend routes require:

```http
Authorization: Bearer <clerk-session-jwt>
```

**How to obtain the token (server-side):**

```typescript
import { auth } from '@clerk/nextjs/server';

const { getToken } = await auth();
const token = await getToken();
```

**Never expose the Clerk secret or internal webhook secret to the browser.** Proxy backend calls through your App Router / API routes.

The backend resolves `clerkUserId` → `profileId` from the shared `Profile` table. Users must complete onboarding first (profile exists in DB).

---

## 4. Phase 1 — Onboarding prerequisites

Before bootstrap, the shared database must contain:

| Row | Required fields |
|-----|-----------------|
| `Server` | `id`, `name`, `learningGoal`, optional `learningReason` |
| `Member` | Admin member for the user (`profileId`, `serverId`, `role: ADMIN`) |
| `Curriculum` | `status: PENDING` (created at onboarding) |
| `LearningMaterial` | At least one row with `status: UPLOADED` |

Bootstrap will **fail with 400** if `learningGoal` or materials are missing.

---

## 5. Phase 2 — Curriculum bootstrap

### 5.1 Trigger generation

**Admin only.** Call after onboarding completes.

```http
POST /api/v1/servers/:serverId/bootstrap
Authorization: Bearer <clerk-jwt>
```

**Default (async) — Response `202`:**

```json
{ "jobId": "550e8400-...", "status": "generating" }
```

**Sync mode** — set `BOOTSTRAP_SYNC=true` on the backend. Response `200`:

```json
{
  "curriculumId": "clx...",
  "moduleCount": 3,
  "conceptCount": 4,
  "goalCriteria": ["Learner can ...", "..."],
  "summary": "Personalized path covering ..."
}
```

| HTTP | Meaning |
|------|---------|
| 403 | Caller is not server admin |
| 409 | Already `GENERATING` or already `READY` |
| 400 | Missing goal or materials |

**Frontend recommendation:** Call bootstrap from a server-side route immediately after create-group. Show a loading state in the agent chat UI.

### 5.2 Poll status (lightweight)

Poll every 2–5 seconds until `status === "READY"` or `"FAILED"`.

```http
GET /api/v1/servers/:serverId/curriculum
Authorization: Bearer <clerk-jwt>
```

**Response `200`:**

```json
{
  "serverId": "clx...",
  "status": "READY",
  "summary": "3-module path covering ...",
  "modules": [
    { "id": "mod1", "order": 1, "title": "Module 1", "progressStatus": "AVAILABLE" },
    { "id": "mod2", "order": 2, "title": "Module 2", "progressStatus": "LOCKED" }
  ],
  "conceptCount": 4,
  "goalCriteria": ["Understand ...", "Analyze ..."]
}
```

**Status values:** `PENDING` → `GENERATING` → `READY` | `FAILED`

| status | UI |
|--------|-----|
| `PENDING` | "Starting curriculum generation…" |
| `GENERATING` | Spinner + "Building your course…" |
| `READY` | Enable chat — prompt user: "Say **Let's start**" |
| `FAILED` | Error + retry bootstrap button |

### 5.3 Fetch full curriculum (optional preview)

Call once when `READY` — for admin preview, syllabus panel, or debug.

```http
GET /api/v1/servers/:serverId/curriculum/content
Authorization: Bearer <clerk-jwt>
```

Returns nested modules, concepts (study units, questions, practice), gate quizzes, and final exam.

| HTTP | Meaning |
|------|---------|
| 409 | Not ready yet (`PENDING` / `GENERATING` / `FAILED`) |
| 200 | Full curriculum body |

**Note:** Non-admin members receive learner-safe payloads (no quiz answers or practice solutions). Admins get full content including `correct` flags and rubrics.

---

## 6. Phase 3 — Agent conversation setup

The backend keys workflow state by **`conversationId`** (your chat thread ID). It does not validate that ID against your DB — but you should use a stable ID per `(memberId, serverId)`.

### Requirements

1. **One agent DM per learner per course** — dedicated conversation, not a peer-to-peer DM.
2. Store `serverId`, `memberId`, `conversationId` together — every backend call needs them.
3. Redirect users to agent chat after onboarding (not a generic channel).

### IDs you need for every API call

| ID | Source |
|----|--------|
| `serverId` | `Server.id` from onboarding |
| `memberId` | `Member.id` for this user on that server |
| `profileId` | Optional in body — backend resolves from JWT |
| `conversationId` | Your agent conversation row ID |

---

## 7. Phase 4 — User sends a message (trigger AI)

When the user sends a message in the agent DM:

### Step A — Frontend (your responsibility)

1. Persist the user message in your DB.
2. Emit real-time event so the bubble appears instantly (< 100ms target).
3. Return `201` to the client.
4. **Fire-and-forget** call to the backend (do not block the socket response).

### Step B — Call backend

```http
POST /api/v1/servers/:serverId/bootstrap
```

Wrong — use:

```http
POST /api/v1/conversations/:conversationId/process
Authorization: Bearer <clerk-jwt>
Content-Type: application/json

{
  "serverId": "clxserver123",
  "memberId": "clxmember123",
  "message": {
    "id": "clxmsg123",
    "content": "Let's start",
    "type": "TEXT"
  },
  "conversationType": "AGENT"
}
```

**Response `202`:**

```json
{ "jobId": "uuid", "status": "processing" }
```

**Other statuses (still 202):**

| status | Meaning | Frontend action |
|--------|---------|-----------------|
| `processing` | Workflow started | Show typing indicator |
| `curriculum_not_ready` | Bootstrap not finished | Show banner; do not expect AI reply |
| `duplicate_ignored` | Same conversation called within 5s | Ignore |

**Rate limit:** 10 requests/minute per user on `/process`.

**Start messages** that trigger the study session greeting: `start`, `let's start`, `begin`, `continue`, `ready`, `hi`, `hello` (case-insensitive).

**Free chat:** Messages containing `@AgentHandle` or `@mention` route to the Tutor free-chat path instead of the structured loop.

### Step C — Show loading state

Emit a custom socket event while waiting for the webhook:

```
chat:{conversationId}:agent-status  →  { "status": "processing" }
```

Clear it when webhook messages arrive:

```
chat:{conversationId}:agent-status  →  { "status": "idle" }
```

Typical agent reply latency: **2–8 seconds**.

---

## 8. Phase 5 — Receive agent replies (webhook)

The backend POSTs agent messages to **your** server when the workflow completes.

### Implement this route on the frontend

```http
POST /api/internal/agent-response
X-Internal-Secret: <CYCY_INTERNAL_SECRET>
Content-Type: application/json
```

**Request body:**

```json
{
  "conversationId": "clxconv123",
  "messages": [
    {
      "authorType": "AI_AGENT",
      "content": "Welcome! I'm Algebra I. Let's work through **Intro concept** together.",
      "metadata": { "type": "GREETING" }
    },
    {
      "authorType": "AI_AGENT",
      "content": "**Intro concept**\n\nExplanation markdown...",
      "metadata": { "type": "EXPLANATION", "conceptId": "clx...", "step": "STUDY" }
    },
    {
      "authorType": "SYSTEM",
      "content": "Quick check",
      "metadata": {
        "type": "STEP_CHIP",
        "step": "QUICK_CHECK",
        "labels": ["Study", "Quick check", "Practice"]
      }
    },
    {
      "authorType": "SYSTEM",
      "content": "What is the first step?",
      "metadata": {
        "type": "MCQ",
        "questionId": "clxq...",
        "questionType": "COMPREHENSION",
        "choices": [
          { "id": "A", "text": "Wrong option" },
          { "id": "B", "text": "Correct option" }
        ],
        "step": "QUICK_CHECK"
      }
    }
  ]
}
```

**Your handler must:**

1. Validate `X-Internal-Secret` — reject with `401` if mismatch.
2. For each message: save to DB with `authorType` + `metadata` JSON.
3. Emit socket event per message: `chat:{conversationId}:messages` (same channel as user messages).
4. Return:

```json
{ "saved": 4, "emitted": true }
```

**Message schema recommendation:**

```prisma
enum MessageAuthorType {
  USER
  AI_AGENT
  SYSTEM
}

model DirectMessage {
  id             String
  content        String
  authorType     MessageAuthorType @default(USER)
  metadata       Json?
  memberId       String            // use agent member stub for AI/SYSTEM
  conversationId String
}
```

---

## 9. Phase 6 — Learning loop (concept by concept)

Each concept follows this cycle:

```
STUDY → QUICK_CHECK → PRACTICE → [EXPLAIN_BACK] → [MICRO_DRILL] → CONCEPT_COMPLETE → next concept
```

### 9.1 First message — Study + MCQ

User: `"Let's start"`

Webhook delivers (typical):

1. `GREETING` — AI_AGENT
2. `EXPLANATION` — AI_AGENT (tutor content)
3. `STEP_CHIP` — SYSTEM (progress indicator)
4. `MCQ` — SYSTEM (comprehension question, workflow **suspended**)

Poll session state (optional, for UI without parsing messages):

```http
GET /api/v1/conversations/:conversationId/session?serverId=clx...
```

```json
{
  "step": "QUICK_CHECK",
  "currentConceptTitle": "Intro concept",
  "nextAction": {
    "type": "MCQ",
    "questionId": "clxq...",
    "prompt": "What is the first step?"
  },
  "progress": { "conceptsCompleted": 0, "conceptsTotal": 4 }
}
```

### 9.2 MCQ answer — wrong

User clicks choice **or** sends choice as text via `/process`.

**Recommended:** call assessments API (sync, also webhooks follow-up messages):

```http
POST /api/v1/assessments/submit
Authorization: Bearer <clerk-jwt>

{
  "conversationId": "clxconv123",
  "serverId": "clxserver123",
  "memberId": "clxmember123",
  "questionId": "clxq...",
  "questionType": "COMPREHENSION",
  "answer": "A"
}
```

**Response `200`:**

```json
{ "status": "processed", "messageCount": 3 }
```

Webhook may deliver:

- `GAP_CALLOUT` — misconception card (code, label, description)
- `FEEDBACK` — why the answer was wrong
- New `EXPLANATION` — alternate teaching angle
- New `MCQ` — retry question (workflow suspended again)

### 9.3 MCQ answer — correct

Same `POST /assessments/submit` with correct choice ID.

Webhook delivers:

- `FEEDBACK` — positive confirmation
- `PRACTICE` — practice problem prompt (`problemId` in metadata)
- Workflow suspended at `PRACTICE`

User submits free-text practice answer:

```http
POST /api/v1/assessments/submit

{
  "conversationId": "...",
  "serverId": "...",
  "memberId": "...",
  "questionId": "<practiceProblemId>",
  "questionType": "PRACTICE",
  "answer": "x = 3"
}
```

### 9.4 Explain-back (high-stakes concepts)

If practice passes, workflow may suspend at `EXPLAIN_BACK`.

Webhook delivers `EXPLAIN_BACK` metadata with `problemId`.

User submits explanation:

```http
POST /api/v1/assessments/explain-back

{
  "conversationId": "...",
  "serverId": "...",
  "memberId": "...",
  "conceptId": "...",
  "answer": "You subtract first because..."
}
```

**Response `200`:**

```json
{
  "passed": true,
  "feedback": "Good — you identified the key step.",
  "scoreDelta": 15,
  "nextStep": "CONCEPT_COMPLETE"
}
```

On **pass**, backend also webhooks agent messages. On **fail**, only synchronous feedback — user returns to `STUDY`.

### 9.5 Concept complete → next concept

Webhook delivers:

- `CONCEPT_COMPLETE` — celebration
- `MOTIVATION` — encouragement (+ XP delta in metadata)
- `MODULE_COMPLETE` or next `EXPLANATION` — depending on position in module

Then cycle repeats for the next concept.

---

## 10. Phase 7 — Module gate quiz

After all concepts in a module, workflow suspends at `MODULE_GATE`.

Webhook delivers `MODULE_GATE` with gate quiz MCQ/STRUCTURAL questions.

User answers via:

- `POST /assessments/submit` with `questionType: "COMPREHENSION"` for MCQ gate items, **or**
- Send answer text via `POST /process`

On pass:

- `MODULE_COMPLETE` message
- Next module unlocked (`progressStatus: AVAILABLE` on next module)
- Next concept study session begins

On fail:

- `MODULE_GATE` retry message (`passed: false` in metadata)

---

## 11. Phase 8 — Goal verification & certification

After all modules, workflow enters `GOAL_VERIFICATION`.

**Certification agent** evaluates whether the learner met `goalCriteria` from bootstrap.

Webhook delivers:

- `GOAL_VERIFICATION` — pass/fail summary, gaps, recommendation
- `CERTIFICATE` or provisional cert metadata with `verificationCode`, `certificateStage`

If goal met (provisional path):

- Provisional certificate issued
- Flow continues to **mock interview**

If goal not met:

- Recommendation to review weak modules
- User can continue studying

---

## 12. Phase 9 — Mock interview & course complete

**Interview agent** runs mock interview Q&A.

Webhook metadata types:

- `MOCK_INTERVIEW` — interview question prompts
- `INTERVIEW_DEBRIEF` — pass/fail debrief

User answers interview questions via `POST /process` (free text).

On interview pass:

- **Certification agent** issues final certificate
- `COURSE_COMPLETE` — workflow ends

Session step becomes `COURSE_COMPLETE`. Further messages may route to free chat.

---

## 13. Progress & sidebar APIs

### Learner progress snapshot

```http
GET /api/v1/progress/:serverId
Authorization: Bearer <clerk-jwt>
```

Returns course XP, rank, per-concept mastery, module progress, weak/strong topics, interview status, `goalMet`.

Use for sidebar, profile panel, or progress bar alongside chat.

### Concept list (read-only)

```http
GET /api/v1/courses/:serverId/concepts
```

Returns ordered concept titles + agent handle — useful for navigation, not for lesson content (content comes via webhook messages).

---

## 14. Message metadata reference

Render `SYSTEM` messages by `metadata.type`:

| type | UI component | User action |
|------|--------------|-------------|
| `GREETING` | Agent welcome bubble | Read |
| `EXPLANATION` | Markdown study content | Read |
| `STEP_CHIP` | Chips: Study → Quick check → Practice | Informational |
| `MCQ` | Multiple-choice buttons | Click → `/assessments/submit` |
| `PRACTICE` | Problem prompt + text input | Submit → `/assessments/submit` |
| `EXPLAIN_BACK` | "Explain your reasoning" prompt | Submit → `/assessments/explain-back` |
| `GAP_CALLOUT` | Misconception highlight card | Read |
| `FEEDBACK` | Inline feedback text | Read |
| `MOTIVATION` | Encouragement + XP | Read |
| `CONCEPT_COMPLETE` | Completion celebration | Read |
| `MODULE_COMPLETE` | Module done banner | Read |
| `MODULE_GATE` | Gate quiz prompt | Answer via submit/process |
| `GOAL_VERIFICATION` | Goal pass/fail summary | Read |
| `CERTIFICATE` | Certificate card + verification code | Read |
| `MOCK_INTERVIEW` | Interview question | Answer via `/process` |
| `INTERVIEW_DEBRIEF` | Interview result | Read |
| `COURSE_COMPLETE` | Course finished banner | Read |
| `FREE_CHAT` | Tutor answer (off-loop) | Read / follow-up |
| `ERROR` | Red error banner | Retry message |
| `PROGRESS` | Progress update | Informational |

**MCQ choices never include `correct: true` in webhook payloads** — grading is server-side only.

---

## 15. The 8 backend agents

All agents run inside a single workflow — you never call them directly.

| Agent | When it runs |
|-------|--------------|
| **Curriculum** | During `POST /bootstrap` only |
| **Tutor** | Study explanations, free chat, alternate angles |
| **Assessment** | MCQ grading, practice grading, gate quizzes |
| **Progress** | Concept/module completion, unlock next module |
| **Reflection** | Post-concept reflection prompts |
| **Motivation** | XP milestones, encouragement |
| **Certification** | Goal verification, certificate issuance |
| **Interview** | Mock interview after provisional cert |

**Your integration surface is only HTTP** — bootstrap, process, assessments, session, progress, and the webhook receiver.

---

## 16. Error handling

### Standard error shape

```json
{
  "statusCode": 403,
  "message": "Not a member of this course"
}
```

### Common cases

| Situation | Backend behavior | Frontend action |
|-----------|------------------|-----------------|
| Curriculum not READY | `curriculum_not_ready` from `/process` | Show banner; keep polling `/curriculum` |
| Invalid JWT | 401 | Re-auth |
| Not server member | 403 | Redirect |
| Bootstrap already running | 409 | Poll status |
| Workflow timeout (30s) | Webhook sends `ERROR` system message | Show retry |
| Webhook secret wrong | Your route returns 401 | Fix env vars |
| Webhook unreachable | Backend logs error; user sees nothing | Fix URL / route |

### Proxy pattern (recommended)

Never call the backend from the browser with secrets. Use server routes:

```
/api/ai/bootstrap      → POST backend /servers/:id/bootstrap
/api/ai/curriculum     → GET  backend /servers/:id/curriculum
/api/ai/process        → POST backend /conversations/:id/process
/api/ai/assessments/*  → POST backend /assessments/*
/api/internal/agent-response  → webhook receiver (secret header only)
```

---

## 17. End-to-end checklist

### Setup

- [ ] Backend running on `:4000`, `GET /health` → `mastra: ready`
- [ ] Shared `DATABASE_URL` with frontend
- [ ] Matching `CYCY_INTERNAL_SECRET` on both sides
- [ ] `OPENAI_API_KEY` set on backend
- [ ] Clerk keys match on both sides

### Curriculum

- [ ] Onboarding creates Server + materials + `Curriculum PENDING`
- [ ] `POST /bootstrap` called (admin JWT)
- [ ] Poll `GET /curriculum` until `READY`
- [ ] Optional: `GET /curriculum/content` for syllabus preview

### Chat integration

- [ ] Agent DM conversation created per user+course
- [ ] User message → save + socket emit + fire-and-forget `/process`
- [ ] `POST /api/internal/agent-response` implemented
- [ ] Webhook saves messages + socket emit
- [ ] Typing indicator during `processing`

### Learning loop

- [ ] `"Let's start"` → greeting + explanation + MCQ appear
- [ ] MCQ click → `POST /assessments/submit`
- [ ] Wrong answer → `GAP_CALLOUT` renders
- [ ] Correct answer → practice prompt renders
- [ ] Practice submit → next step via webhook
- [ ] `GET /session` shows correct `step`

### Course completion

- [ ] Module gate quiz works
- [ ] Goal verification + certificate messages render
- [ ] Mock interview Q&A via `/process`
- [ ] `COURSE_COMPLETE` state reached
- [ ] `GET /progress/:serverId` reflects final mastery

---

## Quick reference — all endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health` | None | Health check |
| POST | `/servers/:id/bootstrap` | Clerk | Generate curriculum |
| GET | `/servers/:id/curriculum` | Clerk | Poll status |
| GET | `/servers/:id/curriculum/content` | Clerk | Full curriculum |
| POST | `/conversations/:id/process` | Clerk | Trigger AI workflow |
| GET | `/conversations/:id/session?serverId=` | Clerk | Step state |
| POST | `/assessments/submit` | Clerk | MCQ / practice answer |
| POST | `/assessments/explain-back` | Clerk | Explain-back grading |
| GET | `/progress/:serverId` | Clerk | Progress snapshot |
| GET | `/courses/:serverId/concepts` | Clerk | Concept list |
| POST | `{frontend}/api/internal/agent-response` | Secret header | Receive AI messages |

---

*Last updated: matches backend API as of curriculum content endpoint + OpenRouter support.*
