import React from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { Network, X } from 'lucide-react';
import clsx from 'clsx';
import type { INeuron, McCullochPitts } from '../models/neural';

// Create a type that adds Record<string, unknown> to satisfy React Flow Node requirements while still holding INeuron
export type NeuronNodeData = Record<string, unknown> & {
    neuron: INeuron;
    isBiasProvider?: boolean;
};

export const NeuronNode: React.FC<NodeProps<Node<NeuronNodeData>>> = ({ id, data, selected }) => {
    const { deleteElements } = useReactFlow();
    const neuron = data.neuron;
    const isInput = neuron.type === 'input';
    const isOutput = neuron.type === 'output';
    const isMP = neuron.type === 'mcculloch-pitts';
    const isBiasProvider = !!data.isBiasProvider;

    const onDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    return (
        <div
            className={clsx(
                'relative group min-w-[100px] rounded-lg border-2 transition-all duration-300 backdrop-blur-md shadow-lg',
                {
                    'bg-slate-900/80 border-slate-700': !selected,
                    'bg-slate-800 border-blue-500 shadow-blue-500/20 scale-105': selected && isMP && !isBiasProvider,
                    'bg-slate-800 border-yellow-500 shadow-yellow-500/20 scale-105': selected && isBiasProvider,
                    'bg-slate-800 border-orange-500 shadow-orange-500/20 scale-105': selected && isOutput,
                    'border-emerald-500/50 shadow-emerald-500/10': isInput && !selected && !isBiasProvider,
                    'border-yellow-500/50 shadow-yellow-500/10': isInput && !selected && isBiasProvider,
                    'border-blue-500/50 shadow-blue-500/10': isMP && !selected,
                    'border-orange-500/50 shadow-orange-500/10': isOutput && !selected,
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
            {isMP && (
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
            <div className="p-1.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <div
                        className={clsx(
                            'flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-offset-1 ring-offset-slate-900',
                            {
                                'bg-emerald-500/20 text-emerald-400 ring-emerald-500/50': isInput && !isBiasProvider,
                                'bg-yellow-500/20 text-yellow-400 ring-yellow-500/50': isInput && isBiasProvider,
                                'bg-blue-500/20 text-blue-400 ring-blue-500/50': isMP,
                                'bg-orange-500/20 text-orange-400 ring-orange-500/50': isOutput,
                            }
                        )}
                    >
                        <Network className="w-3 h-3" />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-100 truncate max-w-[65px] leading-tight">
                            {neuron.label}
                        </span>
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-medium truncate leading-none">
                            {neuron.type === 'mcculloch-pitts' ? 'M-Pitts' : (isOutput ? 'Output' : neuron.type)}
                        </span>
                    </div>
                </div>

                <div className="mt-0.5 bg-slate-900/50 rounded flex flex-row justify-between items-center px-2 py-1.5 border border-slate-700/50 gap-3">
                    {isMP && (
                        <div className="flex flex-col flex-1 border-r border-slate-700/50 pr-2">
                            <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                                Limiar
                            </span>
                            <span className="text-[10px] font-mono font-bold text-orange-400 leading-none">
                                {(neuron as McCullochPitts).bias?.toFixed(2) ?? '0.00'}
                            </span>
                        </div>
                    )}

                    {!isInput && (neuron as McCullochPitts).netInput !== undefined && (
                        <div className={clsx("flex flex-col", isMP ? "flex-1 border-r border-slate-700/50 pr-2" : "")}>
                            <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                                Soma
                            </span>
                            <span className="text-[10px] font-mono font-bold text-yellow-400 leading-none">
                                {(neuron as McCullochPitts).netInput?.toFixed(2) ?? '0.00'}
                            </span>
                        </div>
                    )}

                    <div className={clsx("flex", isMP ? "flex-col flex-1" : "flex-row items-center justify-between w-full gap-2")}>
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                            {isInput ? 'Valor' : (isOutput ? 'Saída' : 'Step')}
                        </span>
                        <span className={clsx(
                            "text-[12px] font-mono font-bold font-black leading-none",
                            {
                                "text-slate-500": neuron.output === 0 && isMP,
                                "text-blue-400": (neuron.output as number) > 0 && isMP,
                                "text-emerald-400": isInput && !isBiasProvider,
                                "text-yellow-400": isInput && isBiasProvider,
                                "text-orange-400": isOutput,
                            }
                        )}>
                            {isOutput ? Number((neuron.output as number).toFixed(4)) : (neuron.output as number)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Output Handle */}
            {!isOutput && (
                <Handle
                    type="source"
                    position={Position.Right}
                    className="!w-4 !h-4 !bg-slate-800 !border-2 !border-blue-400 hover:!bg-blue-400 !transition-colors"
                />
            )}
        </div>
    );
};
