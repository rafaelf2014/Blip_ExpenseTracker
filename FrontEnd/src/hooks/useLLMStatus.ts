import { useSyncExternalStore } from 'react';
import { getLLMStatus, subscribeLLM, type LLMStatus } from '../services/llmService';

// Liga um componente ao estado de carregamento do modelo WebLLM.
export function useLLMStatus(): LLMStatus {
    return useSyncExternalStore(subscribeLLM, getLLMStatus);
}
