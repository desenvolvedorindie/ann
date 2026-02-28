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
                <div className="flex flex-col gap-2 mt-1">
                    <p className="text-sm text-slate-400">Drag components</p>
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[10px] px-2 py-1.5 rounded-md leading-relaxed">
                        <b>Tip:</b> Hold <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-300 font-mono">Ctrl</kbd> when dropping to add multiple elements.
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-6">

                {/* --- INPUTS --- */}
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold px-1">Inputs</h3>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'bias')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
                        Bias
                    </div>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'input')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                        Input
                    </div>
                </div>

                {/* --- PROCESSING --- */}
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold px-1">Processing</h3>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'mcculloch-pitts')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]" />
                        McCulloch-Pitts
                    </div>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'perceptron')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
                        Perceptron
                    </div>
                </div>

                {/* --- OUTPUTS --- */}
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold px-1">Outputs</h3>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'output')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]" />
                        Output
                    </div>
                </div>

                {/* --- STRUCTURING --- */}
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold px-1">Structuring</h3>
                    <div
                        className="p-3 bg-slate-800/80 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(e) => onDragStart(e, 'layer')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        Layer
                    </div>
                </div>

                {/* --- TENSORS --- */}
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold px-1">Tensors</h3>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(e) => onDragStart(e, 'tensor')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                        Tensor
                    </div>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'tensor-elem-op')}
                        draggable
                        title="Element-wise Operations (+, -, *, /)"
                    >
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                        Element-wise
                    </div>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'tensor-matrix-op')}
                        draggable
                        title="Matrix & Geometric Operations (Matmul, Dot)"
                    >
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                        Matrix
                    </div>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'tensor-reduce-op')}
                        draggable
                        title="Reduction Operations (Sum, Mean, Max)"
                    >
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                        Reduction
                    </div>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'tensor-reshape-op')}
                        draggable
                        title="Reshape & Matrix manipulation (Reshape, Transpose, Concat)"
                    >
                        <div className="w-3 h-3 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
                        Reshape
                    </div>
                </div>

                {/* --- MISC --- */}
                <div className="space-y-2">
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 font-bold px-1">Misc</h3>
                    <div
                        className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-sm font-medium flex items-center gap-3 shadow-sm hover:shadow-md"
                        onDragStart={(event) => onDragStart(event, 'pixel-matrix')}
                        draggable
                    >
                        <div className="w-3 h-3 rounded-full bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.6)]" />
                        Pixel Matrix
                    </div>
                </div>

            </div>

            <div className="mt-auto text-xs text-slate-500 pt-4 border-t border-slate-700">
                {/* Footer can be used for version or other info later */}
            </div>

        </aside>
    );
};
