# BLIP Expense Tracker — Developer Docs

Technical documentation for working on BLIP Expense Tracker. If you just want to *run* the app, see the [root README](../README.md). These docs are for understanding how it's built and how to extend it.

## Contents

| Doc | What it covers |
|---|---|
| [architecture.md](architecture.md) | frontend/backend split, folder layout, data flow, request lifecycle |
| [ai-pipeline.md](ai-pipeline.md) | How natural-language expense entry and the chatbot work (the hybrid keyword → fuzzy → WebLLM pipeline) |
| [data-model.md](data-model.md) | The signed-amount money model, database schema, and recurring transactions |
| [api.md](api.md) | Backend REST endpoint reference |
| [development.md](development.md) | Running locally, project conventions, and known gotchas |

## TL;DR

- **Frontend** is a React 19 + TypeScript SPA (Vite). Pages are thin; logic lives in hooks (`useDashboard`, `useTransactions`, …). Data fetching is in `services/api.ts`. The AI lives in `services/llm/`.
- **Backend** is Express 5 + lowdb (a JSON file as the database). It runs TypeScript directly via Node's `--experimental-strip-types` - no build step.
- **The AI runs in the browser**, not on a server. A small LLM (WebLLM / Qwen2.5-1.5B) loads into a Web Worker. But most of the work is plain keyword/regex matching - the LLM is only a fallback. The chatbot doesn't use the LLM at all.
- **Money is stored as one signed number per row**: positive = spending, negative = income. This is the single most important convention to internalize - see [data-model.md](data-model.md).

Start with [architecture.md](architecture.md).
