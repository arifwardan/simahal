export default function SectionHeading({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="flex items-center gap-3 border-[3px] border-black dark:border-[#FFF7E8] bg-black px-4 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)]">
            <div className="hidden size-2 rotate-45 bg-primary sm:block" aria-hidden />
            <div className="space-y-0">
                <h2 className="font-head text-base font-black uppercase tracking-tight text-[#FFF7E8] md:text-lg">{title}</h2>
                {description && <p className="text-xs font-bold text-[#FFF7E8]/80 md:text-sm">{description}</p>}
            </div>
        </div>
    );
}
