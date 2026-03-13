/**
 * Unit tests for Groq roleplay pure functions.
 * Tests prompt builders and response parsers — no network calls.
 * Run: npm run test:unit
 */

import { describe, it, expect, vi } from 'vitest';

// Mock env and groq-sdk BEFORE importing the module under test
vi.mock('$env/static/private', () => ({ GROQ_API_KEY: 'test-key' }));
vi.mock('groq-sdk', () => ({ default: class { } }));

import {
    buildRoleplaySystemPrompt,
    buildScoringPrompt,
    parseScoreResponse
} from '$lib/server/groq';

// ─── buildRoleplaySystemPrompt ────────────────────────────────────────────────

describe('buildRoleplaySystemPrompt', () => {
    const opts = {
        scenario: 'You are speaking with a client about delayed shipment.',
        clientPersona: 'Impatient ecommerce store owner',
        clientOpening: 'Hello, where is my order?',
        scoringCriteria: ['Use polite tone', 'Provide clear timeline']
    };

    it('includes scenario verbatim', () => {
        const prompt = buildRoleplaySystemPrompt(opts);
        expect(prompt).toContain(opts.scenario);
    });

    it('includes client persona', () => {
        const prompt = buildRoleplaySystemPrompt(opts);
        expect(prompt).toContain(opts.clientPersona);
    });

    it('includes client opening line', () => {
        const prompt = buildRoleplaySystemPrompt(opts);
        expect(prompt).toContain(opts.clientOpening);
    });

    it('includes all scoring criteria', () => {
        const prompt = buildRoleplaySystemPrompt(opts);
        for (const criterion of opts.scoringCriteria) {
            expect(prompt).toContain(criterion);
        }
    });

    it('works with empty scoring criteria array', () => {
        const prompt = buildRoleplaySystemPrompt({ ...opts, scoringCriteria: [] });
        expect(prompt).toBeTruthy();
        expect(prompt).toContain(opts.scenario);
    });

    it('instructs model to stay in character', () => {
        const prompt = buildRoleplaySystemPrompt(opts);
        expect(prompt.toLowerCase()).toContain('in character');
    });
});

// ─── buildScoringPrompt ──────────────────────────────────────────────────────

describe('buildScoringPrompt', () => {
    const opts = {
        scenario: 'Handle a refund request professionally.',
        scoringCriteria: ['Empathy', 'Clear resolution'],
        vaResponse: 'I understand your frustration and will process the refund today.',
        conversationHistory: 'Client: I want a refund\nVA: I understand your frustration...'
    };

    it('includes the VA response to score', () => {
        const prompt = buildScoringPrompt(opts);
        expect(prompt).toContain(opts.vaResponse);
    });

    it('includes the conversation history', () => {
        const prompt = buildScoringPrompt(opts);
        expect(prompt).toContain(opts.conversationHistory);
    });

    it('includes all scoring criteria', () => {
        const prompt = buildScoringPrompt(opts);
        for (const c of opts.scoringCriteria) {
            expect(prompt).toContain(c);
        }
    });

    it('specifies JSON output format', () => {
        const prompt = buildScoringPrompt(opts);
        expect(prompt).toContain('"total"');
        expect(prompt).toContain('"breakdown"');
        expect(prompt).toContain('"feedback"');
    });

    it('handles empty history gracefully', () => {
        const prompt = buildScoringPrompt({ ...opts, conversationHistory: '' });
        expect(prompt).toBeTruthy();
    });
});

// ─── parseScoreResponse ───────────────────────────────────────────────────────

describe('parseScoreResponse', () => {
    const validRaw = JSON.stringify({
        total: 82,
        breakdown: { clarity: 21, professionalism: 20, vocabulary: 20, confidence: 21 },
        feedback: 'Good use of empathetic language.',
        highlight: 'I understand your frustration'
    });

    it('parses a valid score JSON string', () => {
        const result = parseScoreResponse(validRaw);
        expect(result).not.toBeNull();
        expect(result?.total).toBe(82);
        expect(result?.breakdown.clarity).toBe(21);
        expect(result?.feedback).toBe('Good use of empathetic language.');
        expect(result?.highlight).toBe('I understand your frustration');
    });

    it('strips markdown code fences before parsing', () => {
        const wrapped = '```json\n' + validRaw + '\n```';
        const result = parseScoreResponse(wrapped);
        expect(result).not.toBeNull();
        expect(result?.total).toBe(82);
    });

    it('strips bare code fences (no language tag)', () => {
        const result = parseScoreResponse('```\n' + validRaw + '\n```');
        expect(result).not.toBeNull();
    });

    it('clamps total above 100 to 100', () => {
        const raw = JSON.stringify({ ...JSON.parse(validRaw), total: 120 });
        const result = parseScoreResponse(raw);
        expect(result?.total).toBe(100);
    });

    it('clamps total below 0 to 0', () => {
        const raw = JSON.stringify({ ...JSON.parse(validRaw), total: -5 });
        const result = parseScoreResponse(raw);
        expect(result?.total).toBe(0);
    });

    it('clamps breakdown sub-scores to 0–25', () => {
        const bad = JSON.stringify({
            total: 50,
            breakdown: { clarity: 30, professionalism: -2, vocabulary: 15, confidence: 99 },
            feedback: 'ok',
            highlight: ''
        });
        const result = parseScoreResponse(bad);
        expect(result?.breakdown.clarity).toBe(25);        // clamped from 30
        expect(result?.breakdown.professionalism).toBe(0); // clamped from -2
        expect(result?.breakdown.confidence).toBe(25);     // clamped from 99
    });

    it('returns null for invalid JSON', () => {
        expect(parseScoreResponse('not json')).toBeNull();
        expect(parseScoreResponse('')).toBeNull();
        expect(parseScoreResponse('{broken')).toBeNull();
    });

    it('returns null when required fields are missing', () => {
        expect(parseScoreResponse('{"total": 80}')).toBeNull();          // no breakdown
        expect(parseScoreResponse('{"breakdown": {}}')).toBeNull();      // no total
        expect(parseScoreResponse('{"total": 80, "breakdown": {}}')).toBeNull(); // no feedback
    });

    it('returns null for non-numeric total', () => {
        const raw = JSON.stringify({ total: 'high', breakdown: {}, feedback: 'ok', highlight: '' });
        expect(parseScoreResponse(raw)).toBeNull();
    });

    it('handles missing highlight field gracefully (defaults to empty string)', () => {
        const noHighlight = JSON.stringify({
            total: 70,
            breakdown: { clarity: 18, professionalism: 17, vocabulary: 18, confidence: 17 },
            feedback: 'Good job.'
            // highlight intentionally omitted
        });
        const result = parseScoreResponse(noHighlight);
        expect(result).not.toBeNull();
        expect(result?.highlight).toBe('');
    });

    it('rounds fractional scores to integers', () => {
        const raw = JSON.stringify({
            total: 82.7,
            breakdown: { clarity: 20.4, professionalism: 20.5, vocabulary: 21.1, confidence: 20.9 },
            feedback: 'Nice.',
            highlight: ''
        });
        const result = parseScoreResponse(raw);
        expect(result?.total).toBe(83); // Math.round(82.7)
        expect(result?.breakdown.clarity).toBe(20);
        expect(result?.breakdown.professionalism).toBe(21); // Math.round(20.5)
    });
});
