export default function SectionHeading({
    title,
    description,
}: {
    title: string;
    description?: string;
}) {
    return (
        <div className="flex items-center gap-3 border-l-[6px] border-black pl-3">
            <div className="space-y-0">
                <h2 className="font-head text-lg font-black uppercase tracking-tight">{title}</h2>
                {description && <p className="text-sm font-bold">{description}</p>}
            </div>
        </div>
    );
}
