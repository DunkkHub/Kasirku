import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts';

interface StatusPoint {
    status: string;
    label: string;
    count: number;
}

const statusMeta: Record<string, { color: string; label: string }> = {
    pending: { color: '#d59b3f', label: 'À confirmer' },
    preparing: { color: '#d8562a', label: 'En préparation' },
    ready: { color: '#5c8568', label: 'Prêtes' },
    out_for_delivery: { color: '#526d8c', label: 'En livraison' },
    delivered: { color: '#376a49', label: 'Livrées' },
    completed: { color: '#436b52', label: 'Terminées' },
    cancelled: { color: '#a94438', label: 'Annulées' },
};

const chartConfig = { count: { label: 'Commandes', color: '#d8562a' } } satisfies ChartConfig;

const pointMeta = (point: StatusPoint) => statusMeta[point.status] ?? { color: '#8b796c', label: point.label || point.status };

export function OrdersByStatusChart({ data }: { data: StatusPoint[] }) {
    return (
        <div>
            <ChartContainer config={chartConfig} className="aspect-auto h-[210px] w-full">
                <BarChart data={data} layout="vertical" margin={{ top: 4, right: 34, left: 4, bottom: 4 }} barCategoryGap="24%">
                    <XAxis type="number" hide />
                    <YAxis
                        dataKey="status"
                        type="category"
                        tickLine={false}
                        axisLine={false}
                        width={94}
                        tickFormatter={(status: string) => statusMeta[status]?.label ?? status}
                        className="fill-[#75675b] text-[0.68rem]"
                    />
                    <ChartTooltip
                        cursor={{ fill: '#eee3d4', opacity: 0.7 }}
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const point = payload[0].payload as StatusPoint;
                            const meta = pointMeta(point);
                            return (
                                <div className="rounded-xl border border-[#ddcfbd] bg-[#fffaf2] px-3 py-2 text-xs shadow-xl">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2.5 rounded-sm" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                                        <span className="text-[#75675b]">{meta.label}</span>
                                        <span className="ml-3 font-black text-[#31241d] tabular-nums">{point.count.toLocaleString('fr-FR')}</span>
                                    </div>
                                </div>
                            );
                        }}
                    />
                    <Bar dataKey="count" radius={[0, 7, 7, 0]} maxBarSize={23}>
                        {data.map((entry) => (
                            <Cell key={entry.status} fill={pointMeta(entry).color} />
                        ))}
                        <LabelList dataKey="count" position="right" offset={8} className="fill-[#413128] text-xs font-bold" />
                    </Bar>
                </BarChart>
            </ChartContainer>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
                {data.map((entry) => {
                    const meta = pointMeta(entry);
                    return (
                        <div key={entry.status} className="flex items-center gap-1.5 text-xs font-medium text-[#75675b]">
                            <span className="size-2 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden="true" />
                            <span>{meta.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
