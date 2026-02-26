import React, { memo } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { NodeResizer, Handle, Position } from '@xyflow/react';
import { Layers } from 'lucide-react';
import clsx from 'clsx';
import { NeuralLayer } from '../models/neural';

export type LayerNodeData = Record<string, unknown> & {
    layer: NeuralLayer;
};

export const LayerNode: React.FC<NodeProps<Node<LayerNodeData>>> = memo(({ data, selected }) => {
    const layer = data.layer;

    return (
        <>
            <NodeResizer
                color="#64748b"
                isVisible={selected}
                minWidth={200}
                minHeight={200}
            />
            <div
                className={clsx(
                    'relative w-full h-full rounded-2xl border-2 transition-colors duration-300 backdrop-blur-sm pointer-events-none flex flex-col',
                    {
                        'bg-slate-900/40 border-slate-700 border-dashed': !selected,
                        'bg-slate-800/60 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)] border-solid': selected,
                    }
                )}
            >
                {/* Header Badge */}
                <div className="absolute top-0 left-4 -translate-y-1/2 flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-600 rounded-full shadow-lg pointer-events-auto cursor-pointer z-10">
                    <Layers className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-widest">{layer.label}</span>
                </div>

                {/* Macro Connectors */}
                <Handle
                    type="target"
                    position={Position.Left}
                    id="layer-in"
                    className="!w-4 !h-4 !bg-slate-800 !border-2 !border-emerald-400 hover:!bg-emerald-400 !transition-colors !transform -translate-y-1/2"
                    style={{ top: '50%', left: '-8px' }}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="layer-out"
                    className="!w-4 !h-4 !bg-slate-800 !border-2 !border-blue-400 hover:!bg-blue-400 !transition-colors !transform -translate-y-1/2"
                    style={{ top: '50%', right: '-8px' }}
                />

                {/* Drop Zone with Slot Guides */}
                <div className="flex-1 w-full h-full relative z-0">
                    {[0, 1, 2, 3, 4, 5].map(i => (
                        <div
                            key={i}
                            className="absolute left-[30px] right-[30px] h-[2px] border-t border-dashed border-slate-700/40"
                            style={{ top: `${50 + (i * 110)}px` }}
                        />
                    ))}
                </div>
            </div>
        </>
    );
});

LayerNode.displayName = 'LayerNode';
