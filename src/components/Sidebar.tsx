import React from 'react';

const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
};

export const Sidebar: React.FC = () => {
    return (
        <aside className="w-64 bg-slate-800 text-slate-100 p-4 flex flex-col gap-4 border-r border-slate-700 shadow-xl z-10 shrink-0">
            <div className="mb-4">
                <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                    Neural Builder
                </h2>
                <p className="text-sm text-slate-400 mt-1">Drag components</p>
            </div>

            <div className="flex flex-col gap-3">
                <div
                    className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                    onDragStart={(event) => onDragStart(event, 'input')}
                    draggable
                >
                    <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    Input Neuron
                </div>

                <div
                    className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                    onDragStart={(event) => onDragStart(event, 'mcculloch-pitts')}
                    draggable
                >
                    <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                    McCulloch-Pitts
                </div>

                <div
                    className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                    onDragStart={(event) => onDragStart(event, 'output')}
                    draggable
                >
                    <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                    Output Neuron
                </div>

                <div
                    className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                    onDragStart={(event) => onDragStart(event, 'pixel-matrix')}
                    draggable
                >
                    <div className="w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]" />
                    Pixel Matrix
                </div>

            </div>

            <div className="mt-auto text-xs text-slate-500 pt-4 border-t border-slate-700">
                OOP Neural Engine
            </div>
        </aside>
    );
};
