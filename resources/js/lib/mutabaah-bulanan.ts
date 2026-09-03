export type MutabaahSettings = {
    konversi_juz_halaman: number;
    ambang_hadiah_juz: number;
    tahun_aktif: number;
};

export function tambahHalaman(
    halamanKumulatif: number | null,
    halamanAwalBulan: number | null,
): number {
    if (halamanKumulatif === null) {
        return 0;
    }

    return halamanKumulatif - (halamanAwalBulan ?? 0);
}

export function tambahJuz(
    halamanKumulatif: number | null,
    halamanAwalBulan: number | null,
    konversiJuz: number,
): number {
    return (
        Math.round(
            (tambahHalaman(halamanKumulatif, halamanAwalBulan) / konversiJuz) *
                100,
        ) / 100
    );
}

export function totalJuz(
    halamanKumulatif: number | null,
    konversiJuz: number,
): number | null {
    if (halamanKumulatif === null) {
        return null;
    }

    return Math.round((halamanKumulatif / konversiJuz) * 100) / 100;
}

export function keterangan(
    halamanKumulatif: number | null,
    halamanAwalBulan: number | null,
    settings: MutabaahSettings,
): string {
    if (halamanKumulatif === null) {
        return 'Belum Diisi';
    }

    const juz = tambahJuz(
        halamanKumulatif,
        halamanAwalBulan,
        settings.konversi_juz_halaman,
    );

    if (juz >= settings.ambang_hadiah_juz) {
        return 'Berprestasi (Hadiah)';
    }

    if (juz < 0.25) {
        return 'Di Bawah Target';
    }

    return 'Sesuai Target';
}

export function gradeLabel(n: number | null): string {
    if (n === null || n === undefined) {
        return '-';
    }

    if (n >= 90) {
        return 'A';
    }

    if (n >= 80) {
        return 'B';
    }

    if (n >= 70) {
        return 'C';
    }

    if (n >= 60) {
        return 'D';
    }

    return 'E';
}

export function totalSepekan(
    h: Record<string, number | null | undefined>,
): number {
    return Object.values(h).reduce<number>(
        (acc, v) => acc + (v ?? 0),
        0,
    );
}

export function pekanNumberInMonth(date: Date): number {
    return Math.floor((date.getDate() - 1) / 7) + 1;
}

export function pekanCountInMonth(tahun: number, bulan: number): number {
    const daysInMonth = new Date(tahun, bulan, 0).getDate();
    let count = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(tahun, bulan - 1, day);

        if (d.getDay() === 1) {
            count++;
        }
    }

    return count;
}

export function weekRange(date: Date): { senin: Date; ahad: Date } {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const diffToMonday = (day + 6) % 7;
    const senin = new Date(d);
    senin.setDate(d.getDate() - diffToMonday);
    const ahad = new Date(senin);
    ahad.setDate(senin.getDate() + 6);

    return { senin, ahad };
}
