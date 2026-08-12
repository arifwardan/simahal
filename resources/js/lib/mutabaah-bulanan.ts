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
