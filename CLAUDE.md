# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Memory Configuration

**Memory Storage Location**: This file (CLAUDE.md)

When entering memory mode, store all persistent memory and notes in the sections below. This ensures continuity across sessions and makes knowledge reusable.

### Memory Notes
<!-- Add persistent memory, project insights, and important decisions here -->
- Use this section to document key architectural decisions, bug fixes, and patterns discovered
- Reference this section when starting new work sessions
- Update after completing significant features or debugging sessions

### User Preferences
- Use comments sparingly. Only comment complex code, business logic, and whys — not self-evident code.
- Always reference `prisma/schema.prisma` to understand the data structure when needed.

---

## Commands

```bash
# Initial setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server (uses Turbopack)
npm run dev

# Run all tests
npm test

# Run a single test file
npx vitest run src/lib/__tests__/file-system.test.ts

# Lint
npm run lint

# Build for production
npm run build

# Reset database
npm run db:reset
```

## Environment

Copy `.env` and set `ANTHROPIC_API_KEY`. Without it, a `MockLanguageModel` is used that returns static components — useful for testing without API costs.

Auth uses JWT with `JWT_SECRET` env var (defaults to `"development-secret-key"` in dev).

## Architecture Overview

UIGen is a Next.js 15 App Router application that lets users generate React components via Claude AI chat, with a live preview and virtual file editor.

### Request Flow

1. User submits a chat message → `ChatContext` (`src/lib/contexts/chat-context.tsx`) sends it to `POST /api/chat`
2. The API route (`src/app/api/chat/route.ts`) reconstructs the `VirtualFileSystem` from the serialized `files` payload, then calls `streamText` with two AI tools: `str_replace_editor` and `file_manager`
3. Tool calls stream back to the client; `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) handles them via `handleToolCall`, mutating the in-memory VFS
4. `PreviewFrame` (`src/components/preview/PreviewFrame.tsx`) renders an `<iframe>` with a full HTML page. The preview uses `createImportMap` + `createPreviewHTML` from `src/lib/transform/jsx-transformer.ts` to transform JSX/TSX via Babel standalone and serve files as blob URLs with a native ES module import map
5. If the user is authenticated and a `projectId` is present, the final conversation state + VFS are persisted to SQLite via Prisma in the `onFinish` callback

### Key Abstractions

- **`VirtualFileSystem`** (`src/lib/file-system.ts`): In-memory tree of `FileNode` objects. Used both server-side (to execute AI tool commands) and client-side (to render the editor/preview). Serialized as `Record<string, FileNode>` for transport.
- **`FileSystemContext`** (`src/lib/contexts/file-system-context.tsx`): React context wrapping `VirtualFileSystem` for the client. Handles tool call dispatch from the AI stream, triggering re-renders via `refreshTrigger`.
- **`ChatContext`** (`src/lib/contexts/chat-context.tsx`): Wraps Vercel AI SDK's `useChat` hook. Passes the current serialized VFS in every request body so the server can reconstruct state.
- **AI Tools**: Two tools are exposed to the model: `str_replace_editor` (create/str_replace/insert/view commands) and `file_manager` (rename/delete). Defined in `src/lib/tools/`.
- **Preview Pipeline** (`src/lib/transform/jsx-transformer.ts`): Transforms all VFS files through Babel, creates blob URLs, builds an ES module import map (resolving `@/` aliases and loading third-party packages from `esm.sh`), and injects them into a full HTML document rendered in an iframe.

### AI Model

`src/lib/provider.ts` exports `getLanguageModel()`. If `ANTHROPIC_API_KEY` is set, it returns a `claude-haiku-4-5` model via `@ai-sdk/anthropic`. Otherwise it returns `MockLanguageModel`, which produces static component code (Counter/Form/Card) without any API calls.

### Auth & Persistence

- JWT-based sessions via `jose`, stored in an httpOnly cookie (`src/lib/auth.ts`)
- Prisma + SQLite (`prisma/dev.db`). Schema has `User` and `Project` models. `Project.messages` and `Project.data` are JSON strings
- Anonymous users can work without logging in; their work is tracked via `src/lib/anon-work-tracker.ts` and can be claimed after sign-up
- Routes: `/` redirects authenticated users to their latest project; `[projectId]/page.tsx` loads a saved project

### Generation Prompt Rules

The system prompt (`src/lib/prompts/generation.tsx`) enforces:
- Every project must have a root `/App.jsx` as the entrypoint
- Style with Tailwind CSS only (no hardcoded styles)
- Non-library imports must use the `@/` alias (e.g., `@/components/MyComp`)
- No HTML files — the VFS is a virtual FS rooted at `/`
