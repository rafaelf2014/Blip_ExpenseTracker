// worker.ts
import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// This handler wraps all the complex WebGPU logic
const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (msg: MessageEvent) => {
    handler.onmessage(msg);
};