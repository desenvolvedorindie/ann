import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Network, X } from 'lucide-react';
import clsx from 'clsx';
import type { Perceptron } from '../../models/neural';
import type { NeuronNodeData } from '../NetworkCanvas/types';

interface PerceptronNodeProps {
    id: string;
    data: NeuronNodeData;
    selected: boolean;
}

export const PerceptronNode: React.FC<PerceptronNodeProps> = ({ id, data, selected }) => {
    const neuron = data.neuron as Perceptron;
    const isBiasProvider = !!data.isBiasProvider; // Usually false for M-Pitts, but just in case
    const { deleteElements } = useReactFlow();

    return (
        <div
            className={clsx(
                'relative group min-w-[100px] rounded-lg border-2 transition-all duration-300 backdrop-blur-md shadow-lg',
                {
                    'bg-slate-900/80 border-slate-700': !selected,
                    'bg-slate-800 border-blue-500 shadow-blue-500/20 scale-105': selected && !isBiasProvider,
                    'bg-slate-800 border-yellow-500 shadow-yellow-500/20 scale-105': selected && isBiasProvider,
                    'border-blue-500/50 shadow-blue-500/10': !selected && !isBiasProvider,
                    'border-yellow-500/50 shadow-yellow-500/10': !selected && isBiasProvider,
                }
            )}
        >
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    deleteElements({ nodes: [{ id }] });
                }}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="Delete Neuron"
            >
                <X className="w-4 h-4" />
            </button>

            <Handle
                type="target"
                position={Position.Left}
                id="input"
                className="!w-4 !h-4 !bg-slate-800 !border-2 !border-blue-400 hover:!bg-blue-400 !transition-colors"
            />

            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <Handle
                    type="target"
                    position={Position.Top}
                    id="bias"
                    className="!w-4 !h-4 !bg-slate-800 !border-2 !border-yellow-500 hover:!bg-yellow-500 !transition-colors !static !transform-none"
                />
            </div>

            <div className="p-1.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-offset-1 ring-offset-slate-900 bg-blue-500/20 text-blue-400 ring-blue-500/50">
                        <Network className="w-3 h-3" />
                    </div>

                    <div className="flex flex-col">
                        <span
                            className="text-[10px] font-semibold text-slate-100 truncate max-w-[65px] leading-tight"
                            title={`Perceptron: ${neuron.label} `}
                        >
                            {neuron.label}
                        </span>
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-medium truncate leading-none">
                            Perceptron
                        </span>
                    </div>
                </div>

                <div className="mt-0.5 bg-slate-900/50 rounded flex flex-row justify-between items-center px-2 py-1.5 border border-slate-700/50 gap-3">
                    <div className="flex flex-col flex-1 border-r border-slate-700/50 pr-2">
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                            Bias
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400 leading-none">
                            {neuron.bias?.toFixed(2) ?? '0.00'}
                        </span>
                    </div>

                    {neuron.netInput !== undefined && (
                        <div className="flex flex-col flex-1 border-r border-slate-700/50 pr-2">
                            <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                                Soma
                            </span>
                            <span className="text-[10px] font-mono font-bold text-yellow-400 leading-none">
                                {neuron.netInput?.toFixed(2) ?? '0.00'}
                            </span>
                        </div>
                    )}

                    <div className="flex flex-col flex-1">
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                            Step
                        </span>
                        <span className={clsx(
                            "text-[12px] font-mono font-bold font-black leading-none",
                            {
                                "text-slate-500": neuron.output === 0,
                                "text-blue-400": (neuron.output as number) > 0,
                            }
                        )}>
                            {neuron.output as number}
                        </span>
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !bg-slate-800 !border-2 !transition-colors !border-blue-400 hover:!bg-blue-400"
            />
        </div>
    );
};
