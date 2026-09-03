import { Link } from '@inertiajs/react';
import { Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export type PaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type PaginationMeta = {
    data?: unknown[];
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
    links: PaginationLink[];
};

export type DataTableColumn<T> = {
    /** unique key */
    id: string;
    header: string;
    /** tailwind classes for th/td */
    className?: string;
    headerClassName?: string;
    /** custom cell renderer */
    cell: (row: T, index: number) => React.ReactNode;
    /** optional accessor for searching - if not provided, searches stringified row */
    accessor?: (row: T) => string;
};

type Props<T> = {
    columns: DataTableColumn<T>[];
    data: T[];
    /** Laravel paginator meta (from ->paginate()->through). If provided, pagination renders from server */
    pagination?: PaginationMeta | null;
    /** optional total override (if pagination not provided, calculated from data length) */
    totalLabel?: string;
    /** empty state message */
    emptyMessage?: string;
    /** brutal variant matches admin/users table: alternating yellow/pink/cyan rows */
    variant?: 'brutal' | 'default';
    /** rows per page for client-side fallback pagination (default 5) */
    perPage?: number;
    /** extra class for wrapper */
    className?: string;
    /** placeholder for search input */
    searchPlaceholder?: string;
};

const brutalRowColors = ['bg-[#FFD600]', 'bg-[#FF90E8]', 'bg-[#5CE1E6]'] as const;

function flattenToString(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(flattenToString).join(' ');
    if (typeof value === 'object') return Object.values(value as Record<string, unknown>).map(flattenToString).join(' ');
    return '';
}

function ClientPagination({
    currentPage,
    lastPage,
    total,
    perPage,
    onPageChange,
}: {
    currentPage: number;
    lastPage: number;
    total: number;
    perPage: number;
    onPageChange: (p: number) => void;
}) {
    const pages = useMemo(() => Array.from({ length: lastPage }, (_, i) => i + 1), [lastPage]);

    if (lastPage <= 1) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2">
            <span className="px-2 text-xs font-black uppercase">
                Hal {currentPage} dari {lastPage} · {total} data · {perPage}/hal
            </span>
            <div className="flex flex-wrap gap-1">
                <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FFF7E8] text-black"
                >
                    &laquo; Prev
                </button>
                {pages.map((p) => (
                    <button
                        key={p}
                        type="button"
                        onClick={() => onPageChange(p)}
                        className={cn(
                            'cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
                            p === currentPage ? 'bg-primary text-black' : 'bg-[#FFF7E8] text-black hover:bg-accent',
                        )}
                    >
                        {p}
                    </button>
                ))}
                <button
                    type="button"
                    disabled={currentPage === lastPage}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] disabled:opacity-40 disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-[#FFF7E8] text-black"
                >
                    Next &raquo;
                </button>
            </div>
        </div>
    );
}

function ServerPagination({ pagination }: { pagination: PaginationMeta }) {
    if (pagination.last_page <= 1) return null;
    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-[3px] border-black bg-[#FFF7E8] p-2">
            <span className="px-2 text-xs font-black uppercase">
                Hal {pagination.current_page} dari {pagination.last_page} · {pagination.total} data
            </span>
            <div className="flex flex-wrap gap-1">
                {pagination.links.map((link, i) => {
                    if (!link.url) {
                        return (
                            <span
                                key={i}
                                className="border-2 border-black bg-[#FFF7E8] px-3 py-1 text-xs font-black opacity-40"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        );
                    }
                    return (
                        <Link
                            key={i}
                            href={link.url}
                            preserveState
                            preserveScroll
                            className={cn(
                                'cursor-pointer border-[3px] border-black px-3 py-1 text-xs font-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]',
                                link.active ? 'bg-primary text-black' : 'bg-[#FFF7E8] text-black hover:bg-accent',
                            )}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    );
                })}
            </div>
        </div>
    );
}

export function DataTable<T>({
    columns,
    data,
    pagination,
    totalLabel,
    emptyMessage = 'Belum ada data.',
    variant = 'brutal',
    perPage = 5,
    className,
    searchPlaceholder = 'Cari...',
}: Props<T>) {
    const [clientPage, setClientPage] = useState(1);
    const [search, setSearch] = useState('');

    const useServerPagination = !!pagination && pagination.last_page >= 1;
    const rawTotal = pagination?.total ?? data.length;
    const threshold = perPage;
    const showSearch = rawTotal > 5 || data.length > 5;

    // filter
    const filteredData = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return data;
        return data.filter((row) => {
            // prefer accessors if any column provides one
            const accessorValues = columns
                .filter((c) => c.accessor)
                .map((c) => c.accessor!(row).toLowerCase());
            if (accessorValues.length > 0) {
                return accessorValues.some((v) => v.includes(q));
            }
            return flattenToString(row).toLowerCase().includes(q);
        });
    }, [data, search, columns]);

    // filtered total (for client pagination)
    const filteredTotal = filteredData.length;
    const effectiveTotal = useServerPagination ? rawTotal : filteredTotal;
    // For client side, if searching, pagination based on filtered; for server, still server pagination but filter current page only (search is local)
    const displayDataForPagination = useServerPagination ? data : filteredData;
    // But for client, visible slice is from filteredData; for server, filter the current page data locally
    const needsPagination = useServerPagination
        ? rawTotal > threshold || pagination!.last_page > 1
        : filteredTotal > threshold;

    const visibleData = useMemo(() => {
        if (useServerPagination) {
            // server data already paginated - apply search filter on current page only
            if (!search.trim()) return data;
            const q = search.trim().toLowerCase();
            return data.filter((row) => {
                const accessorValues = columns
                    .filter((c) => c.accessor)
                    .map((c) => c.accessor!(row).toLowerCase());
                if (accessorValues.length > 0) return accessorValues.some((v) => v.includes(q));
                return flattenToString(row).toLowerCase().includes(q);
            });
        }
        if (!needsPagination) return filteredData;
        const start = (clientPage - 1) * perPage;
        return filteredData.slice(start, start + perPage);
    }, [data, filteredData, clientPage, perPage, useServerPagination, needsPagination, search, columns]);

    const clientLastPage = Math.ceil(filteredTotal / perPage);

    useEffect(() => {
        setClientPage(1);
    }, [search]);

    useEffect(() => {
        if (!useServerPagination && clientPage > clientLastPage && clientLastPage > 0) {
            setClientPage(clientLastPage);
        }
    }, [clientPage, clientLastPage, useServerPagination]);

    return (
        <div className={cn('space-y-0', className)}>
            {totalLabel && (
                <p className="pb-2 text-xs font-black uppercase tracking-wide text-black/70">{totalLabel}</p>
            )}

            {showSearch && (
                <div className="mb-3 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/60" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="h-10 w-full border-[3px] border-black bg-[#FFF7E8] pl-9 pr-9 text-sm font-bold placeholder:text-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-0"
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer border-2 border-black bg-[#FFD600] p-1 hover:bg-[#FF90E8]"
                                aria-label="Clear search"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>
                    {search && (
                        <span className="hidden sm:inline-flex items-center border-[3px] border-black bg-[#5CE1E6] px-2 py-1 text-xs font-black">
                            {useServerPagination ? `${visibleData.length} di hal ini` : `${filteredTotal} hasil`}
                        </span>
                    )}
                </div>
            )}

            <div className="overflow-x-auto border-[3px] border-black">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-[3px] border-black bg-black text-left text-[#FFF7E8]">
                            {columns.map((col) => (
                                <th
                                    key={col.id}
                                    className={cn(
                                        'px-3 py-3 font-head font-black uppercase whitespace-nowrap',
                                        col.headerClassName,
                                        col.className,
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y-[3px] divide-black">
                        {visibleData.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="bg-[#FFF7E8] px-6 py-12 text-center">
                                    {search ? (
                                        <>
                                            <p className="font-black uppercase text-black/60">Tidak ada hasil</p>
                                            <p className="mt-1 text-xs font-bold text-black/40">
                                                Coba kata kunci lain — &quot;{search}&quot;
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="font-black uppercase text-black/60">{emptyMessage}</p>
                                            <p className="mt-1 text-xs font-bold text-black/40">
                                                Data akan muncul di sini setelah ditambahkan.
                                            </p>
                                        </>
                                    )}
                                </td>
                            </tr>
                        ) : (
                            visibleData.map((row, idx) => {
                                const rowBg =
                                    variant === 'brutal'
                                        ? brutalRowColors[idx % brutalRowColors.length]
                                        : idx % 2 === 0
                                          ? 'bg-[#FFF7E8]'
                                          : 'bg-zinc-50';
                                return (
                                    <tr key={idx} className={cn(rowBg, 'hover:brightness-95')}>
                                        {columns.map((col) => (
                                            <td key={col.id} className={cn('px-3 py-3 text-black', col.className)}>
                                                {col.cell(row, idx)}
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {needsPagination && !search && (
                <div className="pt-3">
                    {useServerPagination && pagination ? (
                        <ServerPagination pagination={pagination} />
                    ) : (
                        <ClientPagination
                            currentPage={clientPage}
                            lastPage={clientLastPage}
                            total={useServerPagination ? rawTotal : filteredTotal}
                            perPage={perPage}
                            onPageChange={setClientPage}
                        />
                    )}
                </div>
            )}

            {needsPagination && search && !useServerPagination && (
                <div className="pt-3">
                    <ClientPagination
                        currentPage={clientPage}
                        lastPage={clientLastPage}
                        total={filteredTotal}
                        perPage={perPage}
                        onPageChange={setClientPage}
                    />
                </div>
            )}

            {useServerPagination && search && visibleData.length > 0 && pagination && pagination.last_page > 1 && (
                <p className="pt-2 text-[11px] font-bold text-black/50">Pencarian hanya memfilter halaman ini. Gunakan pagination untuk halaman lain.</p>
            )}
        </div>
    );
}
