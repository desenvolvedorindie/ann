import React, { useState, useEffect } from 'react';
import { Handle, Position, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import { X, Box } from 'lucide-react';
import clsx from 'clsx';
import type { Tensor, INeuron } from '../../models/neural';

export type TensorNodeData = Record<string, unknown> & {
    neuron: INeuron;
    showHandles?: boolean;
};

export const TensorNode: React.FC<NodeProps<Node<TensorNodeData>>> = ({ id, data, selected }) => {
    const { deleteElements } = useReactFlow();
    const tensor = data.neuron as Tensor;
    const showHandles = !!data.showHandles;

    const [sliceIndices, setSliceIndices] = useState<number[]>(new Array(Math.max(0, tensor.order - 2)).fill(0));

    // Keep sliceIndices in sync if properties panel changes order/shape
    useEffect(() => {
        setSliceIndices(prev => {
            const expectedLen = Math.max(0, tensor.order - 2);
            if (prev.length !== expectedLen) {
                return new Array(expectedLen).fill(0);
            }
            let changed = false;
            const next = [...prev];
            for (let i = 0; i < expectedLen; i++) {
                if (next[i] >= tensor.shape[i]) {
                    next[i] = 0;
                    changed = true;
                }
            }
            return changed ? next : prev;
        });
    }, [tensor.order, tensor.shape]);

    const { updateNodeData } = useReactFlow();

    const handleDataChange = (flatIndex: number, val: number) => {
        // Mutate the tensor instance directly
        tensor.output[flatIndex] = val;
        // Tell React Flow to re-render this node so the input reflects the change
        updateNodeData(id, { neuron: tensor });
    };

    const handleSliceIndexChange = (outerDimIndex: number, val: number) => {
        const newIndices = [...sliceIndices];
        newIndices[outerDimIndex] = val;
        setSliceIndices(newIndices);
    };

    const getBaseOffset = () => {
        if (tensor.order <= 2) return 0;
        let offset = 0;
        let multiplier = tensor.size;

        for (let i = 0; i < tensor.order - 2; i++) {
            multiplier /= tensor.shape[i];
            offset += sliceIndices[i] * multiplier;
        }
        return offset;
    };

    const renderDataEditor = () => {
        if (tensor.order === 0) {
            return (
                <div className="flex flex-col gap-1 p-3 pt-0 w-full items-center cursor-auto nodrag nowheel">
                    <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Value</label>
                    <input
                        type="number"
                        className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-center text-slate-200 focus:outline-none focus:border-purple-500"
                        value={tensor.output[0] || 0}
                        onChange={(e) => handleDataChange(0, parseFloat(e.target.value) || 0)}
                        step={0.1}
                    />
                </div>
            );
        }

        if (tensor.order === 1) {
            const size = tensor.shape[0] || 0;
            return (
                <div className="flex flex-col gap-1 p-3 pt-0 w-full cursor-auto nodrag nowheel overflow-y-auto max-h-32 custom-scrollbar">
                    {Array.from({ length: size }).map((_, i) => (
                        <div key={i} className="flex items-center gap-2 w-full justify-center">
                            <span className="text-[10px] text-slate-500 font-mono w-4 shrink-0 text-right">[{i}]</span>
                            <input
                                type="number"
                                className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-center text-slate-200 focus:outline-none focus:border-purple-500"
                                value={tensor.output[i] || 0}
                                onChange={(e) => handleDataChange(i, parseFloat(e.target.value) || 0)}
                                step={0.1}
                            />
                        </div>
                    ))}
                </div>
            );
        }

        const rows = tensor.shape[tensor.order - 2] || 0;
        const cols = tensor.shape[tensor.order - 1] || 0;
        const baseOffset = getBaseOffset();

        return (
            <div className="flex flex-col gap-2 p-3 pt-0 w-full items-center cursor-auto nodrag nowheel">
                {tensor.order > 2 && (
                    <div className="flex flex-col gap-2 w-full mb-2 bg-slate-900/50 p-2 rounded border border-slate-700/50">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider text-center border-b border-slate-700/50 pb-1">Slice Navigation</div>
                        <div className="flex flex-col gap-2">
                            {sliceIndices.map((indexVal, i) => (
                                <div key={i} className="flex flex-col gap-1">
                                    <label className="text-[9px] text-slate-500 leading-none">Dim {i} (0-{tensor.shape[i] - 1})</label>
                                    <div className="flex flex-row gap-2 items-center w-full">
                                        <input
                                            type="number"
                                            className="w-12 bg-slate-800 border border-slate-600 rounded px-1 py-0.5 text-[10px] text-slate-200 focus:outline-none focus:border-purple-500 text-center shrink-0"
                                            value={indexVal}
                                            min={0}
                                            max={tensor.shape[i] - 1}
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                if (!isNaN(val) && val >= 0 && val < tensor.shape[i]) {
                                                    handleSliceIndexChange(i, val);
                                                }
                                            }}
                                        />
                                        <input
                                            type="range"
                                            min={0}
                                            max={tensor.shape[i] - 1}
                                            value={indexVal}
                                            onChange={(e) => handleSliceIndexChange(i, parseInt(e.target.value))}
                                            className="w-full accent-purple-500 cursor-pointer h-1 bg-slate-700 rounded-lg appearance-none min-w-[50px]"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="overflow-x-auto w-full flex justify-center custom-scrollbar pb-1">
                    <div
                        className="grid gap-1 bg-slate-900 border border-slate-700 p-1.5 rounded"
                        style={{ gridTemplateColumns: `repeat(${cols}, minmax(2.5rem, 1fr))` }}
                    >
                        {Array.from({ length: rows }).map((_, r) => (
                            Array.from({ length: cols }).map((_, c) => {
                                const flatIndex = baseOffset + (r * cols) + c;
                                return (
                                    <input
                                        key={`${r}-${c}`}
                                        type="number"
                                        className="w-10 bg-slate-800 border border-slate-600 rounded px-1 py-1 text-[10px] text-center text-slate-200 focus:outline-none focus:border-purple-500"
                                        value={tensor.output[flatIndex] || 0}
                                        onChange={(e) => handleDataChange(flatIndex, parseFloat(e.target.value) || 0)}
                                        step={0.1}
                                        title={`[row: ${r}, col: ${c}]`}
                                    />
                                );
                            })
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const onDelete = (event: React.MouseEvent) => {
        event.stopPropagation();
        deleteElements({ nodes: [{ id }] });
    };

    const getShapeString = () => {
        if (tensor.order === 0) return 'Scalar';
        if (tensor.shape.length === 0) return 'Empty';
        return tensor.shape.join(' × ');
    };

    const getOrderString = () => {
        if (tensor.order === 0) return '0D (Scalar)';
        if (tensor.order === 1) return '1D (Vector)';
        if (tensor.order === 2) return '2D (Matrix)';
        return `${tensor.order}D Tensor`;
    };

    return (
        <div
            className={clsx(
                'relative group rounded-xl border-2 transition-all duration-300 backdrop-blur-md shadow-lg flex flex-col',
                {
                    'bg-slate-900 border-slate-700': !selected,
                    'bg-slate-800 border-purple-500 shadow-purple-500/20 scale-[1.02]': selected,
                }
            )}
            style={{ minWidth: 160, minHeight: 80, opacity: showHandles ? 0.35 : 1 }}
        >
            <button
                onClick={onDelete}
                className="absolute -top-3 -right-3 w-6 h-6 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                title="Delete Tensor"
            >
                <X className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-between p-2 border-b border-slate-700/50 drag-handle cursor-grab active:cursor-grabbing">
                <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">{tensor.label}</span>
                </div>
            </div>

            <div className="p-3 flex flex-col gap-1 items-center justify-center flex-1">
                <div className="text-xs font-medium text-slate-300">{getOrderString()}</div>
                <div className="text-[10px] text-slate-500 font-mono bg-slate-950/50 px-2 py-0.5 rounded border border-slate-800 text-center w-full break-all">
                    {getShapeString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Size: {tensor.size}</div>
            </div>

            {renderDataEditor()}

            <Handle
                type="target"
                position={Position.Left}
                id="in"
                className={clsx(
                    "!w-3 !h-3 !border-2 !border-slate-800 transition-all",
                    showHandles ? "!bg-purple-500 scale-125" : "!bg-slate-400 opacity-0 group-hover:opacity-100"
                )}
            />
            <Handle
                type="source"
                position={Position.Right}
                id="out"
                className={clsx(
                    "!w-3 !h-3 !border-2 !border-slate-800 transition-all",
                    showHandles ? "!bg-purple-500 scale-125" : "!bg-slate-400 opacity-0 group-hover:opacity-100"
                )}
            />
        </div>
    );
};
