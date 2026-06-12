import { useSyncExternalStore } from 'react';
import { getLLMStatus, subscribeLLM, type LLMStatus } from '../services/llmService';

/** Subscribes a component to the WebLLM model-loading status. */
export function useLLMStatus(): LLMStatus {
    return useSyncExternalStore(subscribeLLM, getLLMStatus);
}
