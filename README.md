<div align="center">

<img src="logo.svg" alt="Cycy" width="300" height="250">

<h1 align="center">Cycy</h1>

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://choosealicense.com/licenses/mit/)
[![Live Demo](https://img.shields.io/badge/Live_Demo-cy--cy.vercel.app-black?style=for-the-badge&logo=vercel)](https://cy-cy.vercel.app)

**Study like you know what you're bad at.**

AI course agents inside a real-time learning space — study, practice, and review in one continuous loop, with chat, DMs, and live audio/video.

<br />

**Live app:** [https://cy-cy.vercel.app](https://cy-cy.vercel.app)

<br />
<hr />

</div>

## Problem Statement

Students who study alone often can't tell if they actually understand something until it's too late — the exam. Existing tools each solve one slice and leave the rest to the student to stitch together:

| Tool category | Gap |
|---------------|-----|
| **Quizlet / flashcard apps** | Drill without diagnosis. Wrong is wrong; no insight into *why*. |
| **ChatGPT / generic AI tutors** | Answer questions but have no persistent model of what a specific learner does and doesn't understand. |
| **Duolingo** | Excellent gamification and retention, but content is broad/hobbyist — not mapped to real coursework. |
| **Study groups / Discord servers** | Social accountability exists, but no structured curriculum or diagnostic layer underneath the chat. |

**Nobody combines** real subject teaching + targeted, diagnostic practice + optional social accountability in a single loop.

## Solution

Cycy turns every course into an **AI agent** living inside its own server. Studying, practicing, and reviewing happen in one guided loop — not across five disconnected apps — and the platform names the specific misconception, not just "wrong."

### How it works

1. **Join a course** — Onboarding lands you in a course server with a dedicated AI agent.
2. **Learn concept by concept** — The agent runs a focused loop: study → quick check → practice → explain-back → spaced review.
3. **Get diagnosed, not just graded** — Misses surface typed misconceptions and micro-drills instead of a vague "incorrect."
4. **Stay in one place** — Mention the agent (`@Agent`) in a DM or channel; the same tutor meets you where you already chat.
5. **Optional social layer** — Peer DMs, invites, and real-time voice/video when you want accountability without leaving the platform.

### What this gives learners

- **"I know exactly what I'm bad at"** — Misconceptions are typed and diagnosed, not just marked wrong.
- **"I won't forget it in three weeks"** — Spaced repetition tuned to individual gaps.
- **"I'm not doing this alone — unless I want to be"** — Solo practice by default; social features optional.
- **"It's built for my actual course"** — Curriculum-mapped content, not generic trivia.

### Platform capabilities

Built on a full real-time communication stack so learning and community share the same space:

- Servers, text / audio / video channels, and member roles
- Real-time chat (Socket.io) with edit/delete sync
- Direct messages and invite links
- LiveKit audio & video calls
- File attachments (UploadThing)
- Auth via Clerk

## Screenshots

<p align="center">
  <img src="mockup-desktop.png" alt="Cycy desktop mockup" width="100%">
</p>

<p align="center">
  <img src="mockup-mobile.png" alt="Cycy mobile mockup" width="60%">
</p>

## Live Demo

Try Cycy here: **[https://cy-cy.vercel.app](https://cy-cy.vercel.app)**

## Built With

Cycy is not just chat — each study circle gets a **generated course** and a **personal agent tutor**:

| Step | User experience | Backend |
|------|-----------------|---------|
| Onboarding | Name circle, set goal, upload PDFs/DOCX | — |
| Bootstrap | “Generating curriculum…” on roadmap | `POST /api/v1/servers/:id/bootstrap` |
| Learn | Agent DM: study → MCQ → practice → gates | Mastra 8-agent workflow |
| Complete | Mock interview + certificate | Goal verification agents |

```mermaid
flowchart TB
  subgraph Cycy["cycy (this app)"]
    ON[Onboarding wizard]
    CH[Channels + Socket.io chat]
    WH["Webhook /api/internal/agent-response"]
  end

  subgraph Nest["AI backend"]
    API[NestJS REST]
    MA[Mastra agents]
  end

  ON -->|bootstrap trigger| API
  CH -->|POST /process| API
  API --> MA
  MA -->|agent messages| WH
  WH --> CH
```

**Integration files**

| Path | Role |
|------|------|
| `src/lib/learning/trigger-agent-process.ts` | Fire backend `/process` after user message |
| `src/pages/api/internal/agent-response.ts` | Receive AI replies, persist + socket emit |
| `src/lib/learning/load-curriculum-content.ts` | Pull full curriculum from Nest after `READY` |
| `src/lib/prismadb.ts` | Shared Neon DB with pooler params |

Full wiring guide: [backend/docs/FRONTEND_INTEGRATION.md](../backend/docs/FRONTEND_INTEGRATION.md)

---

## Community features

- 🔒 **Authentication** with Clerk (+ Google)
- 🎉 **Server** creation, invites, roles (Guest / Moderator / Admin)
- 📱 **Real-time messaging** via Socket.io (polling fallback)
- 🚀 **Text, audio, and video channels** (LiveKit)
- 📨 **Direct messages** between members
- 🎁 **Attachments** via UploadThing
- 🧨 **Edit / delete** messages in real time
- 🔍 **Search** command palette
- 🎨 **Light / dark** theme
- 📱 **Responsive** layout

---

### Built with

- ![Next.js](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
- ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
- ![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
- ![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io)
- ![LiveKit](https://img.shields.io/badge/livekit-black?style=for-the-badge&logo=livekit)
- ![Prisma](https://img.shields.io/badge/Prisma-011627?style=for-the-badge&logo=prisma&logoColor=white)
- ![Clerk](https://img.shields.io/badge/Clerk-765eff.svg?style=for-the-badge&logo=clerk&logoColor=white)

Plus **NestJS + Mastra** in [`../backend`](../backend) for AI orchestration.

- 🔒 **Authentication + Google Auth** with **Clerk**
- 🧠 **AI course agents** with a concept-by-concept learning loop
- 🎉 **Server** creation and customization (each course = a server)
- 📱 **Real-time** messaging using **Socket.io**
- 📳 **Websocket fallback**: polling with alerts
- 🚀 **Text**, **Audio**, and **Video** channels
- 📨 **Conversations** between members and with the agent
- 🎬 **Video** and 🔊 **Audio** calls (LiveKit)
- 🎁 **Attachments** via **UploadThing**
- 🧨 **Delete & edit** messages in real time
- 🔰 **Member management** (kick, Guest / Moderator roles)
- 🔗 **Invite links** with a full invite flow
- ⛓ **Infinite loading** for messages (**@tanstack/query**)
- 🔍 **Search** command palette
- 🎨 **Light / dark** theme
- 🎊 **Responsive** design

- Node.js 22+, pnpm (or npm)
- Neon PostgreSQL (shared with backend)
- Clerk app
- Running [AI backend](../backend) on port 4000 for full learning flow

1. Clone the repo

   ```sh
   git clone https://github.com/Peliah/cycy.git
   cd cycy
   ```

2. Install dependencies

### 2. Database

3. Copy `.env.example` to `.env` and fill in the required keys

4. Start the dev server

   ```sh
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) to view the app locally.

## Deploy on Vercel

The easiest way to deploy is the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Production demo: [https://cy-cy.vercel.app](https://cy-cy.vercel.app)

## Contributing

Contributions are welcome. Fork the repo, open a feature branch, and submit a pull request. You can also open an issue with the tag `enhancement`.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.
