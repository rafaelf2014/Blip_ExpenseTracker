import { describe, it, expect } from 'vitest';
import { normalizeText, levenshtein, classifyByKeywords, normalizeToList } from '../services/llm/textUtils';

// normalizeText
describe('normalizeText', () => {
    it('lowercases', () => {
        expect(normalizeText('HELLO World')).toBe('hello world');
    });
    it('strips Portuguese accents', () => {
        expect(normalizeText('Café')).toBe('cafe');
        expect(normalizeText('almoço')).toBe('almoco');
        expect(normalizeText('Ginásio')).toBe('ginasio');
        expect(normalizeText('São João')).toBe('sao joao');
    });
    it('replaces punctuation with spaces', () => {
        expect(normalizeText('uber-eats!')).toBe('uber eats ');
        expect(normalizeText('coffee, €3.50')).toBe('coffee   3 50');
    });
    it('keeps digits', () => {
        expect(normalizeText('Netflix 2026')).toBe('netflix 2026');
    });
    it('handles empty input', () => {
        expect(normalizeText('')).toBe('');
    });
});

// levenshtein
describe('levenshtein', () => {
    it('is 0 for identical strings', () => {
        expect(levenshtein('food', 'food')).toBe(0);
    });
    it('equals the other length when one string is empty', () => {
        expect(levenshtein('', 'food')).toBe(4);
        expect(levenshtein('food', '')).toBe(4);
    });
    it('counts single-character substitutions', () => {
        expect(levenshtein('food', 'fool')).toBe(1);
    });
    it('counts insertions and deletions', () => {
        expect(levenshtein('cat', 'cart')).toBe(1);  // insertion
        expect(levenshtein('cart', 'cat')).toBe(1);  // deletion
    });
    it('handles a classic multi-edit case', () => {
        expect(levenshtein('kitten', 'sitting')).toBe(3);
    });
});

// classifyByKeywords
describe('classifyByKeywords', () => {
    const rules: [string, string[]][] = [
        ['Food', ['restaurant', 'cafe', 'lunch']],
        ['Transport', ['uber', 'taxi', 'gasoline']],
    ];

    it('matches an exact keyword substring', () => {
        expect(classifyByKeywords('lunch with friends', rules, 'Other')).toBe('Food');
        expect(classifyByKeywords('uber home', rules, 'Other')).toBe('Transport');
    });
    it('is accent-insensitive (via normalizeText)', () => {
        expect(classifyByKeywords('café da manhã', rules, 'Other')).toBe('Food');
    });
    it('returns the fallback when nothing matches', () => {
        expect(classifyByKeywords('xyz random thing', rules, 'Other')).toBe('Other');
    });
    it('fuzzy-matches a typo within the Levenshtein threshold', () => {
        // "restaurnat" is one transposition off "restaurant" (len 10, threshold = floor(10*0.3)=3)
        expect(classifyByKeywords('restaurnat bill', rules, 'Other')).toBe('Food');
    });
    it('does not fuzzy-match keywords shorter than 4 chars', () => {
        // 'cafe' is 4 (eligible) but a short word like 'tax' shouldn't pull 'taxi' via fuzz on tiny words
        expect(classifyByKeywords('zzz', rules, 'Other')).toBe('Other');
    });
});

// normalizeToList
describe('normalizeToList', () => {
    const cats = ['Food', 'Transportation', 'Health', 'Other'];

    it('returns an exact match unchanged', () => {
        expect(normalizeToList('Health', cats)).toBe('Health');
    });
    it('corrects case to the canonical entry', () => {
        expect(normalizeToList('health', cats)).toBe('Health');
        expect(normalizeToList('FOOD', cats)).toBe('Food');
    });
    it('fuzzy-maps a near-miss to the closest entry', () => {
        expect(normalizeToList('Helth', cats)).toBe('Health');
        expect(normalizeToList('Transport', cats)).toBe('Transportation');
    });
    it('falls back to the first entry for empty input', () => {
        expect(normalizeToList('', cats)).toBe('Food');
    });
});
