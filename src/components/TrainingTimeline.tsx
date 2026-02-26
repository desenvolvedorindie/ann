import React from 'react';
import { Layers } from 'lucide-react';
import type { Dataset } from '../models/dataset';

interface TrainingTimelineProps {
    datasets: Dataset[];
    trainingDatasetId: string;
    onTrainingDatasetChange: (id: string) => void;
    currentFrame: number;
    onFrameSelect: (frame: number) => void;
}

export const TrainingTimeline: React.FC<TrainingTimelineProps> = ({
    datasets,
    trainingDatasetId,
    onTrainingDatasetChange,
    currentFrame,
    onFrameSelect
}) => {
    const dataset = datasets.find(d => d.id === trainingDatasetId) || datasets[0];

    return (
        <div className="w-full bg-[#1e1e1e] border-t border-slate-800 flex flex-col shrink-0 z-20">
            <div className="p-3 border-b border-slate-700/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-sm font-semibold text-slate-200">Dataset:</h2>
                    </div>
                    <select
                        value={dataset?.id || ''}
                        onChange={(e) => onTrainingDatasetChange(e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-48 p-1.5 outline-none shadow-sm h-8"
                    >
                        {datasets.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </select>
                </div>

                <div className="text-xs text-slate-400 font-mono">
                    Frame Atual: <span className="text-amber-400 font-bold">{currentFrame}</span> / {dataset ? dataset.rows.length - 1 : 0}
                </div>
            </div>

            <div className="flex-1 overflow-x-auto px-4 pb-2 pt-1 flex items-center [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="flex flex-row gap-2 min-w-max px-2 py-6 mt-2">
                    {dataset ? dataset.rows.map((row, index) => {
                        const isActive = currentFrame === index;
                        const isPast = index < currentFrame;

                        return (
                            <div
                                key={index}
                                onClick={() => onFrameSelect(index)}
                                className={`relative flex flex-col w-16 items-center p-2 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${isActive
                                    ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)] scale-110 z-10'
                                    : isPast
                                        ? 'bg-slate-800/80 border-indigo-500/30 opacity-60'
                                        : 'bg-slate-800/40 border-slate-700/50 opacity-40 hover:opacity-100 hover:border-slate-600'
                                    }`}
                            >
                                {/* Frame Number Tab */}
                                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-t-md text-[9px] font-bold font-mono border-t-2 border-l-2 border-r-2 ${isActive ? 'bg-amber-500 text-slate-900 border-amber-500' : 'bg-slate-800 text-slate-400 border-slate-700/50'
                                    }`}>
                                    {index}
                                </div>

                                <div className="mt-3 flex flex-col items-center gap-2 w-full">
                                    {/* Inputs Section */}
                                    <div className="flex flex-col items-center w-full gap-1">
                                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">IN</span>
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {row.inputs.map((val, i) => (
                                                <div
                                                    key={`in-${i}`}
                                                    className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] font-bold ${val === 1 ? 'bg-indigo-500 text-white shadow-[0_0_5px_rgba(99,102,241,0.5)]' : 'bg-slate-700 text-slate-400 border border-slate-600'
                                                        }`}
                                                    title={`X${i + 1}: ${val}`}
                                                >
                                                    {val}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-slate-700/50 my-1"></div>

                                    {/* Outputs Section */}
                                    <div className="flex flex-col items-center w-full gap-1">
                                        <span className="text-[9px] uppercase tracking-widest text-slate-500 font-semibold mb-0.5">OUT</span>
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {row.outputs.map((val, i) => (
                                                <div
                                                    key={`out-${i}`}
                                                    className={`w-3 h-3 rounded-sm flex items-center justify-center text-[8px] font-bold ${val === 1 ? 'bg-emerald-500 text-slate-900 shadow-[0_0_5px_rgba(16,185,129,0.5)]' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        }`}
                                                    title={`Y${i + 1}: ${val}`}
                                                >
                                                    {val}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-slate-500 text-xs italic">Nenhum dataset selecionado.</div>
                    )}
                </div>
            </div>
        </div>
    );
};
