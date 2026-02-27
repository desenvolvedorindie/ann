import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Activity, Box, Maximize2, X } from 'lucide-react';
import Plot from 'react-plotly.js';

export interface TrainingDataPoint {
    epoch: number;
    error: number;
    x1?: number;
    x2?: number;
    z?: number;
}

interface TrainingWorkspaceProps {
    epoch: number;
    data: TrainingDataPoint[];
    expanded: boolean;
    onExpandChange: (v: boolean) => void;
}

// Pre-compute the surface data for f(x1, x2) = x1² + x2² + x1*x2 + x1 + x2 + 5
const RANGE = Array.from({ length: 30 }, (_, i) => -3 + i * (6 / 29));

const surfaceZ = RANGE.map(x2 =>
    RANGE.map(x1 => x1 ** 2 + x2 ** 2 + x1 * x2 + x1 + x2 + 5)
);

type ExpandedChart = null | 'error' | 'surface';

export const TrainingWorkspace: React.FC<TrainingWorkspaceProps> = ({
    epoch,
    data,
    onExpandChange,
}) => {
    const [expandedChart, setExpandedChart] = useState<ExpandedChart>(null);

    const openChart = (chart: ExpandedChart) => {
        setExpandedChart(chart);
        onExpandChange(chart !== null);
    };

    const closeChart = () => {
        setExpandedChart(null);
        onExpandChange(false);
    };

    const pathPoints = useMemo(() =>
        data.filter(d => d.x1 !== undefined && d.x2 !== undefined && d.z !== undefined),
        [data]
    );

    const plotData: Plotly.Data[] = useMemo(() => {
        const traces: Plotly.Data[] = [
            {
                type: 'surface' as const,
                x: RANGE,
                y: RANGE,
                z: surfaceZ,
                colorscale: [
                    [0, '#0f172a'],
                    [0.25, '#1e40af'],
                    [0.5, '#7c3aed'],
                    [0.75, '#db2777'],
                    [1, '#f97316'],
                ] as [number, string][],
                showscale: false,
                opacity: 0.75,
            }
        ];

        if (pathPoints.length > 0) {
            const xs = pathPoints.map(d => d.x1!);
            const ys = pathPoints.map(d => d.x2!);
            const zs = pathPoints.map(d => d.z!);

            traces.push({
                type: 'scatter3d' as const,
                x: xs,
                y: ys,
                z: zs,
                mode: 'lines+markers' as const,
                line: { color: '#ffffff', width: 3 },
                marker: {
                    size: 4,
                    color: pathPoints.map((_, i) => i / Math.max(1, pathPoints.length - 1)),
                    colorscale: [
                        [0, '#818cf8'],
                        [0.5, '#ec4899'],
                        [1, '#f97316'],
                    ] as [number, string][],
                    showscale: false,
                },
                showlegend: false,
            } as any);

            traces.push({
                type: 'scatter3d' as const,
                x: [xs[xs.length - 1]],
                y: [ys[ys.length - 1]],
                z: [zs[zs.length - 1]],
                mode: 'markers' as const,
                marker: {
                    size: 10,
                    color: '#facc15',
                    symbol: 'circle',
                    line: { color: '#ffffff', width: 2 },
                },
                showlegend: false,
            } as any);
        }

        return traces;
    }, [pathPoints]);

    const [plotLayout, setPlotLayout] = useState<Partial<Plotly.Layout>>({
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        margin: { l: 0, r: 0, t: 0, b: 0 },
        scene: {
            bgcolor: 'transparent',
            xaxis: { showgrid: false, zeroline: false, showticklabels: false, title: { text: '' } },
            yaxis: { showgrid: false, zeroline: false, showticklabels: false, title: { text: '' } },
            zaxis: { showgrid: false, zeroline: false, showticklabels: false, title: { text: '' } },
            camera: { eye: { x: 1.6, y: 1.6, z: 1 } },
        },
        uirevision: 1,
        autosize: true,
    });

    const errorChart = (fullHeight?: boolean) => (
        <ResponsiveContainer width="100%" height={fullHeight ? '100%' : 192}>
            <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="epoch" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 1]} />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#ec4899' }}
                    labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="error" stroke="#ec4899" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
        </ResponsiveContainer>
    );

    const surface3d = () => (
        <Plot
            data={plotData}
            layout={plotLayout}
            onUpdate={(figure) => setPlotLayout(figure.layout)}
            config={{ displayModeBar: false, responsive: true }}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler
        />
    );

    // Fullscreen overlay — rendered via portal directly on document.body
    const overlay = expandedChart && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur flex flex-col p-8">
            <button
                onClick={closeChart}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                title="Fechar"
            >
                <X className="w-5 h-5" />
            </button>

            {expandedChart === 'error' ? (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                    <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-pink-400" /> Erro por Época
                    </span>
                    <div className="flex-1 bg-slate-900/60 rounded-2xl border border-slate-700 p-4 min-h-0">
                        {errorChart(true)}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col gap-3 min-h-0">
                    <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                        <Box className="w-4 h-4 text-violet-400" /> Superfície de Erro
                    </span>
                    <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 bg-slate-900/60 min-h-0">
                        {surface3d()}
                    </div>
                    <p className="text-[10px] text-slate-500 text-center font-mono">
                        f(x₁, x₂) = x₁² + x₂² + x₁x₂ + x₁ + x₂ + 5
                    </p>
                </div>
            )}
        </div>,
        document.body
    );

    return (
        <>
            {overlay}

            <div className="w-[440px] bg-[#1e1e1e] border-l border-slate-800 flex flex-col shrink-0 z-20">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

                    <div className="flex items-center gap-2 pb-4">
                        <Activity className="w-5 h-5 text-pink-400" />
                        <h2 className="text-sm font-semibold text-slate-200">Métricas Globais</h2>
                    </div>

                    <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 -mt-2">
                        <span className="text-xs text-slate-400">Época Atual</span>
                        <span className="text-sm font-mono text-slate-200 bg-slate-900 px-2 py-1 rounded">{epoch}</span>
                    </div>

                    {/* Error line chart */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Erro por Época</span>
                            <button
                                onClick={() => openChart('error')}
                                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all"
                                title="Expandir"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="h-48 w-full bg-slate-900/50 rounded-xl p-2 border border-slate-700/50">
                            {errorChart()}
                        </div>
                    </div>

                    {data.length > 0 && (
                        <div className="flex flex-col gap-1 items-center justify-center p-3 bg-slate-900/30 rounded-xl border border-slate-800">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Erro Atual</span>
                            <span className="text-lg text-pink-400 font-mono font-bold tracking-tight">
                                {data[data.length - 1].error.toFixed(4)}
                            </span>
                        </div>
                    )}

                    {/* 3D surface */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Box className="w-4 h-4 text-violet-400" />
                                <span className="text-xs font-semibold text-slate-300">Superfície de Erro</span>
                                {pathPoints.length > 0 && (
                                    <span className="text-[9px] text-slate-500 font-mono">{pathPoints.length} pts</span>
                                )}
                            </div>
                            <button
                                onClick={() => openChart('surface')}
                                className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-slate-700 transition-all"
                                title="Expandir"
                            >
                                <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div className="rounded-xl overflow-hidden border border-slate-700/50 bg-slate-900/50" style={{ height: 260 }}>
                            {surface3d()}
                        </div>
                        <p className="text-[9px] text-slate-500 text-center font-mono">
                            f(x₁, x₂) = x₁² + x₂² + x₁x₂ + x₁ + x₂ + 5
                        </p>
                    </div>

                </div>
            </div>
        </>
    );
};
