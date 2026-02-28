import React from 'react';
import { ScatterChart as ScatterIcon } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Label } from 'recharts';
import type { Dataset } from '../../models/dataset';

interface DatabasePlotProps {
    activeDataset: Dataset;
    displayRows: Dataset['rows'];
    plotAxisX: number;
    plotAxisY: number;
    plotAxisOutput: number;
    plotFilters: Record<number, number>;
    hoveredRowIndex: number | null;
    setPlotAxisX: (val: number) => void;
    setPlotAxisY: (val: number) => void;
    setPlotAxisOutput: (val: number) => void;
    setPlotFilters: React.Dispatch<React.SetStateAction<Record<number, number>>>;
    setHoveredRowIndex: (val: number | null) => void;
}

export const DatabasePlot: React.FC<DatabasePlotProps> = ({
    activeDataset,
    displayRows,
    plotAxisX,
    plotAxisY,
    plotAxisOutput,
    plotFilters,
    hoveredRowIndex,
    setPlotAxisX,
    setPlotAxisY,
    setPlotAxisOutput,
    setPlotFilters,
    setHoveredRowIndex
}) => {
    // Prepare data for Scatter Plot
    const hasMultipleInputs = activeDataset.inputColumns.length >= 2;
    const xIndex = plotAxisX < activeDataset.inputColumns.length ? plotAxisX : 0;
    const yIndex = hasMultipleInputs && plotAxisY < activeDataset.inputColumns.length ? plotAxisY : 0;
    const outIndex = plotAxisOutput < activeDataset.outputColumns.length ? plotAxisOutput : 0;

    const unselectedInputs = activeDataset.inputColumns
        .map((_, i) => i)
        .filter(i => activeDataset.inputColumns.length > 2 ? (i !== xIndex && i !== yIndex) : false);

    const effectiveFilters = unselectedInputs.reduce((acc, idx) => {
        if (plotFilters[idx] !== undefined) {
            acc[idx] = plotFilters[idx];
        } else {
            const distinctValues = Array.from(new Set(activeDataset.rows.map(r => r.inputs[idx]))).sort((a, b) => a - b);
            acc[idx] = distinctValues[0] ?? 0;
        }
        return acc;
    }, {} as Record<number, number>);

    const plotRows = displayRows.filter(row => {
        return unselectedInputs.every(idx => row.inputs[idx] === effectiveFilters[idx]);
    });

    const scatterData0 = plotRows
        .filter(r => (r.outputs[outIndex] ?? 0) === 0)
        .map((row, idx) => ({
            id: `0-${idx}`,
            originalIndex: displayRows.indexOf(row),
            x: row.inputs[xIndex],
            y: hasMultipleInputs ? row.inputs[yIndex] : 0, // Plot on y=0 for 1D
            output: 0,
            labelX: activeDataset.inputColumns[xIndex],
            labelY: hasMultipleInputs ? activeDataset.inputColumns[yIndex] : '',
        }));

    const scatterData1 = plotRows
        .filter(r => (r.outputs[outIndex] ?? 0) === 1)
        .map((row, idx) => ({
            id: `1-${idx}`,
            originalIndex: displayRows.indexOf(row),
            x: row.inputs[xIndex],
            y: hasMultipleInputs ? row.inputs[yIndex] : 0, // Plot on y=0 for 1D
            output: 1,
            labelX: activeDataset.inputColumns[xIndex],
            labelY: hasMultipleInputs ? activeDataset.inputColumns[yIndex] : '',
        }));

    const allScatterData = [...scatterData0, ...scatterData1];
    const hoveredScatterData = hoveredRowIndex !== null ? allScatterData.filter(d => d.originalIndex === hoveredRowIndex) : [];

    // Min/max for plot bounds to add padding
    const minX = allScatterData.length ? Math.min(...allScatterData.map(d => d.x)) - 0.5 : 0;
    const maxX = allScatterData.length ? Math.max(...allScatterData.map(d => d.x)) + 0.5 : 1;
    const minY = allScatterData.length ? (hasMultipleInputs ? Math.min(...allScatterData.map(d => d.y)) - 0.5 : -1) : -1;
    const maxY = allScatterData.length ? (hasMultipleInputs ? Math.max(...allScatterData.map(d => d.y)) + 0.5 : 1) : 1;

    const generateTicks = (min: number, max: number) => {
        const ticks = [];
        const range = max - min;
        const step = range <= 3 ? 0.5 : Math.ceil(range / 6);
        for (let i = Math.floor(min / step) * step; i <= Math.ceil(max / step) * step; i += step) {
            ticks.push(Number(i.toFixed(2)));
        }
        if (!ticks.includes(0) && min <= 0 && max >= 0) ticks.push(0);
        if (!ticks.includes(1) && min <= 1 && max >= 1 && hasMultipleInputs) ticks.push(1);
        return Array.from(new Set(ticks)).sort((a, b) => a - b).filter(t => t >= min && t <= max);
    };

    const xTicks = generateTicks(minX, maxX);
    const yTicks = hasMultipleInputs ? generateTicks(minY, maxY) : [0];

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
                    <p className="text-slate-200 text-sm font-semibold mb-1">
                        {data.labelX}: <span className="text-indigo-400 font-mono">{data.x}</span>
                    </p>
                    {hasMultipleInputs && (
                        <p className="text-slate-200 text-sm font-semibold mb-1">
                            {data.labelY}: <span className="text-indigo-400 font-mono">{data.y}</span>
                        </p>
                    )}
                    <p className="text-slate-200 text-sm font-semibold">
                        Output: <span className={`font-mono font-bold ${data.output === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>{data.output}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-700/50 mb-4 gap-4">
                <div className="flex items-center gap-2">
                    <ScatterIcon className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-md font-semibold text-slate-200">Plot Distribution (2D)</h3>
                </div>

                <div className="flex items-center gap-4">
                    {activeDataset.inputColumns.length >= 3 && (
                        <div className="flex items-center gap-4 text-sm bg-slate-800/80 px-4 py-1.5 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-2">
                                <label className="text-slate-400 font-medium">Eixo X:</label>
                                <select
                                    value={plotAxisX}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val === plotAxisY) setPlotAxisY(plotAxisX);
                                        setPlotAxisX(val);
                                    }}
                                    className="bg-slate-900 text-indigo-300 border border-slate-600 rounded px-2 py-1 outline-none focus:border-indigo-500 font-mono"
                                >
                                    {activeDataset.inputColumns.map((col, i) => (
                                        <option key={i} value={i}>{col}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-slate-400 font-medium">Eixo Y:</label>
                                <select
                                    value={plotAxisY}
                                    onChange={(e) => {
                                        const val = Number(e.target.value);
                                        if (val === plotAxisX) setPlotAxisX(plotAxisY);
                                        setPlotAxisY(val);
                                    }}
                                    className="bg-slate-900 text-indigo-300 border border-slate-600 rounded px-2 py-1 outline-none focus:border-indigo-500 font-mono"
                                >
                                    {activeDataset.inputColumns.map((col, i) => (
                                        <option key={i} value={i}>{col}</option>
                                    ))}
                                </select>
                            </div>

                            {unselectedInputs.map(idx => {
                                const col = activeDataset.inputColumns[idx];
                                const distinctValues = Array.from(new Set(activeDataset.rows.map(r => r.inputs[idx]))).sort((a, b) => a - b);
                                return (
                                    <div key={`filter-${idx}`} className="flex items-center gap-2 pl-4 border-l border-slate-700/50">
                                        <label className="text-slate-400 font-medium" title="Filter for slice visualization">{col}:</label>
                                        <select
                                            value={effectiveFilters[idx]}
                                            onChange={(e) => setPlotFilters({ ...plotFilters, [idx]: Number(e.target.value) })}
                                            className="bg-slate-900 text-amber-300 border border-slate-600 rounded px-2 py-1 outline-none focus:border-amber-500 font-mono"
                                        >
                                            {distinctValues.map(val => (
                                                <option key={val} value={val}>{val}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeDataset.outputColumns.length >= 2 && (
                        <div className="flex items-center gap-4 text-sm bg-slate-800/80 px-4 py-1.5 rounded-lg border border-slate-700">
                            <div className="flex items-center gap-2">
                                <label className="text-emerald-400 font-medium whitespace-nowrap">Output (Cores):</label>
                                <select
                                    value={plotAxisOutput}
                                    onChange={(e) => setPlotAxisOutput(Number(e.target.value))}
                                    className="bg-slate-900 text-emerald-300 border border-slate-600 rounded px-2 py-1 outline-none focus:border-emerald-500 font-mono"
                                >
                                    {activeDataset.outputColumns.map((col, i) => (
                                        <option key={i} value={i}>{col}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {activeDataset.inputColumns.length < 3 && activeDataset.outputColumns.length < 2 && (
                        <div className="text-xs font-mono text-slate-500 px-3 py-1 bg-slate-800/50 rounded border border-slate-700/50">
                            {activeDataset.inputColumns.length === 1
                                ? activeDataset.inputColumns[0]
                                : `${activeDataset.inputColumns[0]} vs ${activeDataset.inputColumns[1]}`
                            }
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4 min-h-0 focus:outline-none outline-none">
                <ResponsiveContainer width="100%" height="100%" className="focus:outline-none outline-none">
                    <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 0 }} style={{ outline: 'none' }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name={allScatterData[0]?.labelX || 'X'}
                            domain={[minX, maxX]}
                            stroke="#64748b"
                            fontSize={12}
                            ticks={xTicks}
                        >
                            <Label
                                value={allScatterData[0]?.labelX || 'X'}
                                offset={-10}
                                position="insideBottom"
                                fill="#94a3b8"
                                fontSize={12}
                                fontWeight={600}
                            />
                        </XAxis>
                        <YAxis
                            type="number"
                            dataKey="y"
                            name={allScatterData[0]?.labelY || 'Y'}
                            domain={[minY, maxY]}
                            stroke="#64748b"
                            fontSize={12}
                            ticks={yTicks}
                            hide={!hasMultipleInputs}
                        >
                            {hasMultipleInputs && (
                                <Label
                                    value={allScatterData[0]?.labelY || 'Y'}
                                    angle={-90}
                                    offset={10}
                                    position="insideLeft"
                                    fill="#94a3b8"
                                    fontSize={12}
                                    fontWeight={600}
                                />
                            )}
                        </YAxis>
                        <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3', stroke: '#475569' }} />

                        <ReferenceLine x={0} stroke="#475569" strokeOpacity={0.4} />
                        <ReferenceLine x={1} stroke="#475569" strokeOpacity={0.4} />
                        <ReferenceLine y={0} stroke="#475569" strokeOpacity={0.4} />
                        <ReferenceLine y={1} stroke="#475569" strokeOpacity={0.4} />

                        <Scatter
                            data={scatterData0}
                            fill="#f43f5e"
                            shape="circle"
                            isAnimationActive={false}
                            onMouseEnter={(e: any) => e && e.payload && setHoveredRowIndex(e.payload.originalIndex ?? e.originalIndex)}
                            onMouseLeave={() => setHoveredRowIndex(null)}
                        />
                        <Scatter
                            data={scatterData1}
                            fill="#34d399"
                            shape="circle"
                            isAnimationActive={false}
                            onMouseEnter={(e: any) => e && e.payload && setHoveredRowIndex(e.payload.originalIndex ?? e.originalIndex)}
                            onMouseLeave={() => setHoveredRowIndex(null)}
                        />
                        <Scatter
                            data={hoveredScatterData}
                            shape={(props: any) => <circle cx={props.cx} cy={props.cy} r={8} fill="none" stroke="#fbbf24" strokeWidth={2} />}
                            isAnimationActive={false}
                        />
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </>
    );
};
