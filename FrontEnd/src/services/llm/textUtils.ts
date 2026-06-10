// Funções puras de normalização e correspondência de texto usadas pela camada de IA.

/** Minúsculas, sem acentos e sem pontuação — base para todas as comparações. */
export function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // remove acentos: é→e, ã→a, ç→c
        .replace(/[^a-z0-9\s]/g, ' ');
}

/** Distância de edição de Levenshtein entre duas strings. */
export function levenshtein(a: string, b: string): number {
    const m = a.length, n = b.length;
    const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
        Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i - 1] === b[j - 1]
                ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return dp[m][n];
}

/**
 * Classifica `text` numa das etiquetas em `rules`.
 * Primeiro tenta correspondência exata de palavra-chave; se falhar, faz
 * correspondência aproximada (Levenshtein) para tolerar erros ortográficos.
 */
export function classifyByKeywords(
    text: string,
    rules: [string, string[]][],
    fallback: string
): string {
    const norm = normalizeText(text);
    const words = norm.split(/\s+/).filter(w => w.length > 2);

    for (const [label, keywords] of rules)
        if (keywords.some(kw => norm.includes(kw.trim()))) return label;

    let bestLabel = fallback;
    let bestScore = Infinity;

    for (const [label, keywords] of rules) {
        for (const kw of keywords) {
            const kwTrimmed = kw.trim();
            if (kwTrimmed.length < 4) continue;
            const threshold = Math.max(1, Math.floor(kwTrimmed.length * 0.3));
            for (const word of words) {
                if (Math.abs(word.length - kwTrimmed.length) > threshold + 1) continue;
                const dist = levenshtein(word, kwTrimmed);
                if (dist <= threshold && dist < bestScore) { bestScore = dist; bestLabel = label; }
            }
        }
    }
    return bestLabel;
}

/** Mapeia `value` para a entrada mais próxima de `validList` (exata, case-insensitive, ou fuzzy). */
export function normalizeToList(value: string, validList: string[]): string {
    if (!value) return validList[0];
    if (validList.includes(value)) return value;

    const ci = validList.find(v => v.toLowerCase() === value.toLowerCase());
    if (ci) return ci;

    let best = validList[0], bestDist = Infinity;
    for (const v of validList) {
        const dist = levenshtein(value.toLowerCase(), v.toLowerCase());
        if (dist < bestDist) { bestDist = dist; best = v; }
    }
    return best;
}
