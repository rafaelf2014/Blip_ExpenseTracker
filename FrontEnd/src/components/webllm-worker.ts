// webllm-worker.ts
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// This handler automatically bridges the gap between the worker and your main UI
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg: MessageEvent) => {
    handler.onmessage(msg);
};