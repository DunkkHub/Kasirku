import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Area, AreaChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';

interface RevenuePoint {
    date: string;
    revenue: number;
}

const chartConfig = {
    revenue: { label: 'Chiffre d’affaires', color: '#d8562a' },
} satisfies ChartConfig;

const euroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const compactEuroFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 });

function formatShortDate(value: string) {
    return new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export function RevenueTrendChart({ data }: { data: RevenuePoint[] }) {
    const lastIndex = data.length - 1;

    return (
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
            <AreaChart data={data} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#d8562a" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#d8562a" stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#dfd1bf" strokeDasharray="4 4" />
                <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    interval={1}
                    tickFormatter={formatShortDate}
                    className="fill-[#857468] text-[0.68rem]"
                />
                <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    width={70}
                    tickFormatter={(value: number) => compactEuroFormatter.format(value)}
                    className="fill-[#857468] text-[0.68rem]"
                />
                <ChartTooltip
                    cursor={{ stroke: '#c9b8a4', strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                            <div className="grid min-w-44 gap-1.5 rounded-xl border border-[#ddcfbd] bg-[#fffaf2] px-3 py-2.5 text-xs shadow-xl">
                                <div className="font-bold text-[#31241d]">{formatShortDate(label as string)}</div>
                                <div className="flex items-center gap-2">
                                    <span className="h-0.5 w-3 rounded-full bg-[#d8562a]" aria-hidden="true" />
                                    <span className="text-[#75675b]">Chiffre d’affaires</span>
                                    <span className="ml-auto font-black text-[#31241d] tabular-nums">
                                        {euroFormatter.format(Number(payload[0].value) || 0)}
                                    </span>
                                </div>
                            </div>
                        );
                    }}
                />
                <Area
                    dataKey="revenue"
                    type="monotone"
                    fill="url(#revenue-fill)"
                    stroke="#d8562a"
                    strokeWidth={2.5}
                    activeDot={{ r: 5, strokeWidth: 3, stroke: '#fffaf2' }}
                >
                    <LabelList
                        dataKey="revenue"
                        position="top"
                        offset={14}
                        content={({ index, x, y, value }) => {
                            if (index !== lastIndex || typeof x !== 'number' || typeof y !== 'number' || typeof value !== 'number') return null;
                            return (
                                <text x={x} y={y - 13} textAnchor="middle" className="fill-[#7d3520] text-xs font-black">
                                    {compactEuroFormatter.format(value)}
                                </text>
                            );
                        }}
                    />
                </Area>
            </AreaChart>
        </ChartContainer>
    );
}
