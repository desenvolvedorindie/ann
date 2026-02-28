import React from 'react';
import type { Tensor, NeuronPartialUpdate } from '../../models/neural';
import { NativeNumberInput } from './SharedComponents';

interface TensorPropertiesProps {
    tensor: Tensor;
    onUpdateNeuron: (id: string, updates: NeuronPartialUpdate) => void;
}

export const TensorProperties: React.FC<TensorPropertiesProps> = ({ tensor, onUpdateNeuron }) => {

    const handleOrderChange = (val: number) => {
        onUpdateNeuron(tensor.id, { order: val });
    };

    const handleShapeChange = (dimIndex: number, val: number) => {
        const newShape = [...tensor.shape];
        newShape[dimIndex] = val;
        onUpdateNeuron(tensor.id, { shape: newShape });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <h3 className="font-semibold text-purple-300">Tensor Config</h3>
            </div>

            <NativeNumberInput
                label="Order (Dimensions)"
                value={tensor.order}
                min={0}
                max={5}
                onChange={handleOrderChange}
                focusColor="purple"
            />

            {tensor.order > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 pb-1">Shape</label>
                    <div className="grid grid-cols-2 gap-2">
                        {tensor.shape.map((dimSize, i) => (
                            <NativeNumberInput
                                key={`shape-${i}`}
                                label={`Dim ${i}`}
                                value={dimSize}
                                min={1}
                                max={100}
                                onChange={(val) => handleShapeChange(i, val)}
                                focusColor="purple"
                            />
                        ))}
                    </div>
                </div>
            )}

            {tensor.size > 0 && Array.isArray(tensor.output) && (
                <div className="flex flex-col gap-2 mt-4">
                    <div className="flex justify-between items-center border-b border-slate-700 pb-1">
                        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Data Elements</label>
                        <span className="text-[9px] text-slate-500 font-mono">Size: {tensor.size}</span>
                    </div>
                    {tensor.size > 100 && (
                        <span className="text-[10px] text-amber-500/80 italic mb-1">
                            Only showing first 100 elements
                        </span>
                    )}
                    <div className="grid grid-cols-1 gap-2 overflow-y-auto max-h-48 pr-1 custom-scrollbar">
                        {Array.from({ length: Math.min(tensor.size, 100) }).map((_, i) => (
                            <div key={`val-row-${i}`} className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-500 font-mono w-6 text-right select-none">{i}:</span>
                                <input
                                    key={`val-${i}`}
                                    type="number"
                                    step="any"
                                    value={typeof tensor.output[i] === 'number' ? Number(tensor.output[i].toFixed(4)) : 0}
                                    onChange={(e) => {
                                        const next = [...tensor.output];
                                        next[i] = parseFloat(e.target.value) || 0;
                                        onUpdateNeuron(tensor.id, { output: next });
                                    }}
                                    className="flex-1 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 font-mono text-left focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                                    title={`Index ${i}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
