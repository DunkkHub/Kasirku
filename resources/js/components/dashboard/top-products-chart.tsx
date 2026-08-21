import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, LabelList, XAxis, YAxis } from 'recharts';

interface ProductPoint {
    id: string | number;
    name: string;
    quantity_sold: number;
}

const chartConfig = { quantity_sold: { label: 'Quantité vendue', color: '#d8562a' } } satisfies ChartConfig;

export function TopProductsChart({ data }: { data: ProductPoint[] }) {
    return (
        <ChartContainer config={chartConfig} className="aspect-auto h-[210px] w-full">
            <BarChart data={data.slice(0, 5)} layout="vertical" margin={{ top: 4, right: 34, left: 0, bottom: 4 }}>
                <XAxis type="number" hide />
                <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    width={112}
                    tickFormatter={(value: string) => (value.length > 16 ? `${value.slice(0, 15)}…` : value)}
                    className="fill-[#75675b] text-[0.68rem]"
                />
                <ChartTooltip
                    cursor={{ fill: '#eee3d4', opacity: 0.7 }}
                    content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const point = payload[0].payload as ProductPoint;
                        return (
                            <div className="rounded-xl border border-[#ddcfbd] bg-[#fffaf2] px-3 py-2 text-xs shadow-xl">
                                <div className="font-bold text-[#31241d]">{point.name}</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className="h-0.5 w-3 rounded-full bg-[#d8562a]" aria-hidden="true" />
                                    <span className="text-[#75675b]">Quantité vendue</span>
                                    <span className="ml-auto font-black text-[#31241d] tabular-nums">
                                        {point.quantity_sold.toLocaleString('fr-FR')}
                                    </span>
                                </div>
                            </div>
                        );
                    }}
                />
                <Bar dataKey="quantity_sold" fill="#d8562a" radius={[0, 7, 7, 0]} maxBarSize={23}>
                    <LabelList dataKey="quantity_sold" position="right" offset={8} className="fill-[#413128] text-xs font-bold" />
                </Bar>
            </BarChart>
        </ChartContainer>
    );
}
