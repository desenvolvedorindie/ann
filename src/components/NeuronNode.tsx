import React from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { Network, X } from 'lucide-react';
import clsx from 'clsx';
import type { INeuron } from '../models/neural';

// Create a type that adds Record<string, unknown> to satisfy React Flow Node requirements while still holding INeuron
export type NeuronNodeData = Record<string, unknown> & {
    neuron: INeuron;
    isBiasProvider?: boolean;
};

export const NeuronNode: React.FC<NodeProps<Node<NeuronNodeData>>> = ({ id, data, selected }) => {
    const { deleteElements } = useReactFlow();
    const neuron = data.neuron;
    const isInput = neuron.type === 'input';
    const isBiasProvider = !!data.isBiasProvider;

    const onDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div
            className={clsx(
                'relative group min-w-[140px] rounded-2xl border-2 transition-all duration-300 backdrop-blur-md shadow-lg',
                {
                    'bg-slate-900/80 border-slate-700': !selected,
                    'bg-slate-800 border-blue-500 shadow-blue-500/20 scale-105': selected && !isBiasProvider,
                    'bg-slate-800 border-yellow-500 shadow-yellow-500/20 scale-105': selected && isBiasProvider,
                    'border-emerald-500/50 shadow-emerald-500/10': isInput && !selected && !isBiasProvider,
                    'border-yellow-500/50 shadow-yellow-500/10': isInput && !selected && isBiasProvider,
                    'border-blue-500/50 shadow-blue-500/10': !isInput && !selected,
                }
            )}
        >
            {/* Delete Button */}
            <button
                onClick={onDelete}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="Delete Neuron"
            >
                <X className="w-4 h-4" />
            </button>
            {/* Input Handle */}
            {!isInput && (
                <Handle
                    type="target"
                    position={Position.Left}
                    id="input"
                    className="!w-4 !h-4 !bg-slate-800 !border-2 !border-blue-400 hover:!bg-blue-400 !transition-colors"
                />
            )}

            {/* Threshold (Bias) Handle */}
            {!isInput && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <span className="text-[9px] uppercase tracking-widest text-yellow-500 font-bold mb-1 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-4 whitespace-nowrap">Threshold</span>
                    <Handle
                        type="target"
                        position={Position.Top}
                        id="bias"
                        className="!w-4 !h-4 !bg-slate-800 !border-2 !border-yellow-500 hover:!bg-yellow-500 !transition-colors !static !transform-none"
                    />
                </div>
            )}

            {/* Node Content */}
            <div className="p-3 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <div
                        className={clsx(
                            'flex items-center justify-center w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-slate-900',
                            {
                                'bg-emerald-500/20 text-emerald-400 ring-emerald-500/50': isInput && !isBiasProvider,
                                'bg-yellow-500/20 text-yellow-400 ring-yellow-500/50': isInput && isBiasProvider,
                                'bg-blue-500/20 text-blue-400 ring-blue-500/50': !isInput,
                            }
                        )}
                    >
                        <Network className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-100 truncate max-w-[80px]">
                            {neuron.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium truncate">
                            {neuron.type === 'mcculloch-pitts' ? 'M-Pitts' : neuron.type}
                        </span>
                    </div>
                </div>

                <div className="mt-2 bg-slate-900/50 rounded p-2 border border-slate-700/50 flex flex-col gap-1 text-center">
                    {!isInput && neuron.netInput !== undefined && (
                        <div className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                Soma (Net Input)
                            </span>
                            <span className="text-sm font-mono font-bold text-yellow-400">
                                {neuron.netInput.toFixed(2)}
                            </span>
                        </div>
                    )}
                    {!isInput && (
                        <div className="flex flex-col gap-0.5 border-b border-slate-700/50 pb-2 mb-1">
                            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                                Limiar (Threshold)
                            </span>
                            <span className="text-sm font-mono font-bold text-orange-400">
                                {neuron.bias.toFixed(2)}
                            </span>
                        </div>
                    )}
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
                        {isInput ? 'Valor de Entrada' : 'Saída (Step)'}
                    </span>
                    <span className={clsx(
                        "text-lg font-mono font-bold font-black",
                        {
                            "text-slate-500": neuron.output === 0 && !isInput,
                            "text-blue-400": neuron.output > 0 && !isInput,
                            "text-emerald-400": isInput && !isBiasProvider,
                            "text-yellow-400": isInput && isBiasProvider,
                        }
                    )}>
                        {neuron.output}
                    </span>
                </div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !bg-slate-800 !border-2 !border-blue-400 hover:!bg-blue-400 !transition-colors"
            />
        </div>
    );
};
