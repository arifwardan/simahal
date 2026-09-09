import { router } from '@inertiajs/react';

export default function AuthRegisterTabs({ active }: { active: 'join' | 'register' }) {
    const base =
        'flex-1 cursor-pointer border-[3px] border-black px-3 py-2 text-center text-sm font-black uppercase transition-colors';

    return (
        <div className="mb-6 flex gap-2">
            <button
                type="button"
                onClick={() => router.get('/join-pondok')}
                className={`${base} ${active === 'join' ? 'bg-black text-[#FFF7E8]' : 'bg-[#FFF7E8] text-black hover:bg-[#FFE7A3]'}`}
            >
                Santri / Muhafidz / Orang Tua
            </button>
            <button
                type="button"
                onClick={() => router.get('/register-pondok')}
                className={`${base} ${active === 'register' ? 'bg-black text-[#FFF7E8]' : 'bg-[#FFF7E8] text-black hover:bg-[#FFE7A3]'}`}
            >
                Pondok Baru
            </button>
        </div>
    );
}
