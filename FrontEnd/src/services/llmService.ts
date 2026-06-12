// Barrel da camada de IA. A implementação vive em ./llm/* — este ficheiro
// mantém a API pública estável para os componentes e testes existentes.
export { initLLM, getLLMStatus, getLLMProgress, subscribeLLM, type LLMStatus } from './llm/engine';
export { extractExpenseFromText } from './llm/extractExpense';
export { detectChatIntent } from './llm/dateContext';
export { askFinancialQuestion } from './llm/askFinancialQuestion';
