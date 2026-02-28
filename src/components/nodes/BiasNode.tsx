import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import type { NeuronNodeData } from '../NetworkCanvas/types';

interface BiasNodeProps {
    id: string;
    data: NeuronNodeData;
    selected: boolean;
}

export const BiasNode: React.FC<BiasNodeProps> = ({ id, data, selected }) => {
    const { deleteElements } = useReactFlow();
    const neuron = data.neuron;

    return (
        <div
            className={clsx(
                'relative group min-w-[100px] rounded-lg border-2 transition-all duration-300 backdrop-blur-md shadow-lg',
                {
                    'bg-amber-900/30 border-amber-400/70 shadow-amber-500/20 scale-105': selected,
                    'border-amber-400/50 shadow-amber-500/10 bg-amber-950/30': !selected,
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

            <div className="p-1.5 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full ring-2 ring-offset-1 ring-offset-slate-900 bg-amber-500/20 text-amber-400 ring-amber-500/50">
                        <span className="text-[10px] font-black text-amber-400">β</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-[10px] font-semibold text-slate-100 truncate max-w-[65px] leading-tight">
                            {neuron.label}
                        </span>
                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-medium truncate leading-none">
                            Bias
                        </span>
                    </div>
                </div>
            </div>

            <Handle
                type="source"
                position={Position.Right}
                className="!w-4 !h-4 !bg-slate-800 !border-2 !transition-colors !border-amber-400 hover:!bg-amber-400"
            />
        </div>
    );
};
