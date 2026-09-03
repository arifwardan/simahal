import { describe, expect, it } from 'vitest';

import {
    gradeLabel,
    pekanCountInMonth,
    pekanNumberInMonth,
    totalSepekan,
    weekRange,
} from './mutabaah-bulanan';

describe('gradeLabel', () => {
    it('returns - for null', () => {
        expect(gradeLabel(null)).toBe('-');
    });

    it('maps 95 to A', () => {
        expect(gradeLabel(95)).toBe('A');
    });

    it('maps 90 to A boundary', () => {
        expect(gradeLabel(90)).toBe('A');
    });

    it('maps 89 to B', () => {
        expect(gradeLabel(89)).toBe('B');
    });

    it('maps 85 to B', () => {
        expect(gradeLabel(85)).toBe('B');
    });

    it('maps 80 to B boundary', () => {
        expect(gradeLabel(80)).toBe('B');
    });

    it('maps 79 to C', () => {
        expect(gradeLabel(79)).toBe('C');
    });

    it('maps 70 to C boundary', () => {
        expect(gradeLabel(70)).toBe('C');
    });

    it('maps 69 to D', () => {
        expect(gradeLabel(69)).toBe('D');
    });

    it('maps 60 to D boundary', () => {
        expect(gradeLabel(60)).toBe('D');
    });

    it('maps 59 to E', () => {
        expect(gradeLabel(59)).toBe('E');
    });

    it('maps 0 to E', () => {
        expect(gradeLabel(0)).toBe('E');
    });
});

describe('totalSepekan', () => {
    it('sums harian values', () => {
        expect(totalSepekan({ senin: 5, selasa: 5 })).toBe(10);
    });

    it('treats null as 0', () => {
        expect(totalSepekan({ senin: 5, selasa: null, rabu: 3 })).toBe(8);
    });

    it('returns 0 for empty', () => {
        expect(totalSepekan({})).toBe(0);
    });

    it('sums full week', () => {
        expect(
            totalSepekan({
                senin: 1,
                selasa: 2,
                rabu: 3,
                kamis: 4,
                jumat: 5,
                sabtu: 6,
                ahad: 7,
            }),
        ).toBe(28);
    });
});

describe('pekanNumberInMonth', () => {
    it('returns 1 for day 1', () => {
        expect(pekanNumberInMonth(new Date(2024, 4, 1))).toBe(1);
    });

    it('returns 2 for day 8', () => {
        expect(pekanNumberInMonth(new Date(2024, 4, 8))).toBe(2);
    });

    it('returns 3 for 19 May 2024', () => {
        expect(pekanNumberInMonth(new Date(2024, 4, 19))).toBe(3);
    });

    it('returns 5 for day 29', () => {
        expect(pekanNumberInMonth(new Date(2024, 4, 29))).toBe(5);
    });
});

describe('pekanCountInMonth', () => {
    it('counts Mondays in May 2024 (4)', () => {
        expect(pekanCountInMonth(2024, 5)).toBe(4);
    });

    it('counts Mondays in September 2025 (5)', () => {
        // Sep 2025 Mondays: 1,8,15,22,29
        expect(pekanCountInMonth(2025, 9)).toBe(5);
    });
});

function localISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

describe('weekRange', () => {
    it('returns monday-sunday for mid-week date', () => {
        const r = weekRange(new Date(2024, 4, 15)); // Wed 2024-05-15
        expect(localISO(r.senin)).toBe('2024-05-13');
        expect(localISO(r.ahad)).toBe('2024-05-19');
    });

    it('returns same week when given Monday', () => {
        const r = weekRange(new Date(2024, 4, 13));
        expect(localISO(r.senin)).toBe('2024-05-13');
        expect(localISO(r.ahad)).toBe('2024-05-19');
    });

    it('returns same week when given Sunday', () => {
        const r = weekRange(new Date(2024, 4, 19));
        expect(localISO(r.senin)).toBe('2024-05-13');
        expect(localISO(r.ahad)).toBe('2024-05-19');
    });
});
