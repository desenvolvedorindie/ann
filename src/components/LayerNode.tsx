import React, { memo } from 'react';
import type { NodeProps, Node } from '@xyflow/react';
import { NodeResizer, Handle, Position, useReactFlow } from '@xyflow/react';
import { Layers } from 'lucide-react';
import clsx from 'clsx';
import { NeuralLayer } from '../models/neural';

export type LayerNodeData = Record<string, unknown> & {
    layer: NeuralLayer;
};

export const LayerNode: React.FC<NodeProps<Node<LayerNodeData>>> = memo(({ data, id, selected }) => {
    const layer = data.layer;
    const { getNodes } = useReactFlow();

    // Calculate total neurons (including pixel matrix inner sizes)
    const children = getNodes().filter(n => n.parentId === id);
    const totalNeurons = children.reduce((acc, child) => {
        const neuron = (child.data as { neuron?: any })?.neuron;
        if (!neuron) return acc;

        if (neuron.type === 'pixel-matrix' && typeof neuron.width === 'number' && typeof neuron.height === 'number') {
            return acc + (neuron.width * neuron.height);
        }
        // Attempt to use size getter if available, otherwise default to 1
        return acc + (neuron.size || 1);
    }, 0);

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
                    {totalNeurons > 0 && (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded ml-1">
                            {totalNeurons} {totalNeurons === 1 ? 'neurônio' : 'neurônios'}
                        </span>
                    )}
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
                    {/* Removed static decorative drop zone lines as they cause confusion */}
                </div>
            </div>
        </>
    );
});

LayerNode.displayName = 'LayerNode';
