import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Network, X } from 'lucide-react';
import clsx from 'clsx';
import type { NeuronNodeData } from '../NetworkCanvas/types';

interface OutputNodeProps {
    id: string;
    data: NeuronNodeData;
    selected: boolean;
}

export const OutputNode: React.FC<OutputNodeProps> = ({ id, data, selected }) => {
    const { deleteElements } = useReactFlow();
    const neuron = data.neuron;

    return (
        <div
            className={clsx(
                'relative group min-w-[100px] rounded-lg border-2 transition-all duration-300 backdrop-blur-md shadow-lg',
                {
                    'bg-slate-900/80 border-slate-700': !selected,
                    'bg-slate-800 border-orange-500 shadow-orange-500/20 scale-105': selected,
                    'border-orange-500/50 shadow-orange-500/10': !selected,
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

            <div className="p-1.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-offset-1 ring-offset-slate-900 bg-orange-500/20 text-orange-400 ring-orange-500/50">
                        <Network className="w-3 h-3" />
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-100 truncate max-w-[65px] leading-tight">
                            {neuron.label}
                        </span>
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-medium truncate leading-none">
                            Output
                        </span>
                    </div>
                </div>

                <div className="mt-0.5 bg-slate-900/50 rounded flex flex-row justify-between items-center px-2 py-1.5 border border-slate-700/50 gap-3">
                    <div className="flex flex-row items-center justify-between w-full gap-2">
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-bold leading-tight">
                            Output
                        </span>
                        <span className="text-[12px] font-mono font-bold font-black leading-none text-orange-400">
                            {Number((neuron.output as number).toFixed(4))}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
