import { CreateWebWorkerMLCEngine } from '@mlc-ai/web-llm';
import type { WebWorkerMLCEngine, InitProgressReport } from '@mlc-ai/web-llm';

// Qwen2.5-1.5B (~950MB) — bom em PT/EN, fiável e leve
const SELECTED_MODEL = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC';

let engine: WebWorkerMLCEngine | null = null;
let initPromise: Promise<void> | null = null;

const initProgressCallback = (p: InitProgressReport) =>
    console.log(`Carregando IA: ${Math.round(p.progress * 100)}%`);

export async function initLLM(): Promise<void> {
    if (engine) return;
    if (initPromise) { await initPromise; return; }

    initPromise = (async () => {
        const worker = new Worker(new URL('../webllm-worker.ts', import.meta.url), { type: 'module' });
        try {
            engine = await CreateWebWorkerMLCEngine(worker, SELECTED_MODEL, { initProgressCallback });
            console.log('Modelo carregado.');
        } catch (e) {
            worker.terminate();
            console.error(e);
            initPromise = null;
        }
    })();
    await initPromise;
}

/** Resolve com `null` se a promise não terminar dentro de `ms`. */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
    return Promise.race([
        promise,
        new Promise<null>(resolve => setTimeout(() => resolve(null), ms)),
    ]);
}

/** Texto da primeira escolha de uma chat completion, ou '' se vazio. */
async function completeChat(
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    maxTokens: number,
    timeoutMs: number,
): Promise<string | null> {
    if (!engine) return null;
    const reply = await withTimeout(
        engine.chat.completions.create({ messages, temperature: 0.1, max_tokens: maxTokens }),
        timeoutMs,
    );
    if (!reply || !('choices' in reply)) return null;
    return (reply.choices[0]?.message?.content ?? '').trim();
}

/** Resumo curto em inglês (1-4 palavras) do que foi comprado/pago. */
export async function getLLMDescription(userInput: string): Promise<string | null> {
    try {
        const raw = await completeChat([
            {
                role: 'system',
                content:
                    'You receive expense descriptions in any language (often Portuguese). ' +
                    'Reply with a 1-4 word English summary of what was purchased or paid. ' +
                    'Reply with only those words, no punctuation, nothing else.',
            },
            { role: 'user', content: userInput },
        ], 20, 15000);
        if (raw === null) return null;
        return raw.replace(/^["'.]+|["'.]+$/g, '') || null;
    } catch {
        return null;
    }
}

/** Categoria + descrição em JSON, quando as palavras-chave não chegaram a uma categoria. */
export async function getLLMCategoryAndDescription(
    userInput: string,
): Promise<{ category: string; description: string } | null> {
    try {
        const raw = await completeChat([
            {
                role: 'system',
                content:
                    'You categorize expenses written in any language (often Portuguese or English). ' +
                    'Reply with JSON only: {"description":"1-4 word English summary","category":"exact category name"}.\n' +
                    'Categories and what they cover:\n' +
                    '- Food: restaurants, groceries, delivery apps, fast food, drinks, coffee, supermarkets\n' +
                    '- Transportation: taxi, ride-hailing, fuel, flights, public transport, parking, car repairs\n' +
                    '- Entertainment: sports activities, streaming services, games, cinema, concerts, books, hobbies, gambling\n' +
                    '- Utilities: electricity, water, internet, phone bills, gas, insurance\n' +
                    '- Health: pharmacy, doctor visits, gym, supplements, therapy, dental, eye care\n' +
                    '- Housing: rent, mortgage, repairs, furniture, appliances, cleaning supplies\n' +
                    '- Clothes: clothing, shoes, accessories, fashion brands, jewellery, bags\n' +
                    '- Other: anything that does not fit the above\n',
            },
            { role: 'user',      content: 'basketball €90' },
            { role: 'assistant', content: '{"description":"Basketball","category":"Entertainment"}' },
            { role: 'user',      content: 'jantar no restaurante italiano €35' },
            { role: 'assistant', content: '{"description":"Italian restaurant dinner","category":"Food"}' },
            { role: 'user',      content: 'uber para o aeroporto €22' },
            { role: 'assistant', content: '{"description":"Uber to airport","category":"Transportation"}' },
            { role: 'user',      content: userInput },
        ], 48, 30000);
        if (raw === null) return null;

        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return null;
        const parsed = JSON.parse(match[0]);
        if (!parsed.description || !parsed.category) return null;
        return { description: String(parsed.description), category: String(parsed.category) };
    } catch (e) {
        console.error('[LLM category+description error]', e);
        return null;
    }
}
