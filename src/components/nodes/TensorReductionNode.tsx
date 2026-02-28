import { memo } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Minimize2, X } from 'lucide-react';
import type { NeuronNodeData } from '../NetworkCanvas/types';

export const TensorReductionNode = memo(({ id, data, selected }: { id: string, data: NeuronNodeData, selected?: boolean }) => {
    const { deleteElements } = useReactFlow();
    return (
        <div className={`
            group relative bg-slate-900 border-2 rounded-xl shadow-xl min-w-[140px]
            ${selected ? 'border-purple-400 shadow-purple-500/20' : 'border-slate-700'}
            transition-all duration-200
        `}>
            {/* Input handle */}
            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className={`w-3 h-3 border-2 border-slate-900 bg-purple-400`}
            />

            {/* Delete button (shows on hover) */}
            <button
                onClick={() => deleteElements({ nodes: [{ id }] })}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="Delete Node"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="p-3">
                <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-lg bg-purple-500/20 text-purple-400`}>
                        <Minimize2 className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">{data.neuron.label || 'Reduce-Op'}</span>
                        <span className="text-[10px] text-slate-500">{(data.neuron as any).operationType || 'Op'}</span>
                    </div>
                </div>

                {data.neuron.output && Array.isArray(data.neuron.output) && data.neuron.output.length > 0 && (
                    <div className="text-xs text-slate-400 font-mono mt-2 bg-slate-950 p-1.5 rounded border border-slate-800 text-center">
                        Result: {data.neuron.output[0].toFixed(4)}
                    </div>
                )}
            </div>

            {/* Output handle */}
            <Handle
                type="source"
                position={Position.Right}
                id="tensor-out"
                className={`w-3 h-3 border-2 border-slate-900 bg-purple-400`}
            />
        </div>
    );
});
