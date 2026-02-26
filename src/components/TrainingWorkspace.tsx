import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Activity } from 'lucide-react';

export interface TrainingDataPoint {
    epoch: number;
    error: number;
}

interface TrainingWorkspaceProps {
    epoch: number;
    data: TrainingDataPoint[];
}

export const TrainingWorkspace: React.FC<TrainingWorkspaceProps> = ({
    epoch,
    data
}) => {
    return (
        <div className="w-80 bg-[#1e1e1e] border-l border-slate-800 flex flex-col shrink-0 z-20">
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">

                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-pink-400" />
                        <h2 className="text-sm font-semibold text-slate-200">Métricas Globais</h2>
                    </div>
                </div>

                <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 -mt-2">
                    <span className="text-xs text-slate-400">Época Atual</span>
                    <span className="text-sm font-mono text-slate-200 bg-slate-900 px-2 py-1 rounded">{epoch + 1}</span>
                </div>

                <div className="h-48 w-full bg-slate-900/50 rounded-xl p-2 border border-slate-700/50 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis
                                dataKey="epoch"
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#64748b"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                domain={[0, 1]}
                            />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: '#ec4899' }}
                                labelStyle={{ color: '#94a3b8' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="error"
                                stroke="#ec4899"
                                strokeWidth={2}
                                dot={false}
                                isAnimationActive={false} // Disable standard animation for smoother dynamic updates
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {data.length > 0 && (
                    <div className="flex flex-col gap-1 items-center justify-center p-3 bg-slate-900/30 rounded-xl border border-slate-800">
                        <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Erro Atual</span>
                        <span className="text-lg text-pink-400 font-mono font-bold tracking-tight">
                            {data[data.length - 1].error.toFixed(4)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};
