import React, { useState, useEffect } from 'react';
import type { Tensor } from '../models/neural';
import { X } from 'lucide-react';

interface TensorConnectionModalProps {
    isOpen: boolean;
    tensor: Tensor | null;
    mode?: 'source' | 'target';
    onClose: () => void;
    onConfirm: (index: number) => void;
}

export const TensorConnectionModal: React.FC<TensorConnectionModalProps> = ({ isOpen, tensor, mode = 'source', onClose, onConfirm }) => {
    // Stores the selected index for each dimension
    const [dimIndices, setDimIndices] = useState<number[]>([]);

    useEffect(() => {
        if (tensor && isOpen) {
            setDimIndices(new Array(tensor.order).fill(0));
        }
    }, [tensor, isOpen]);

    if (!isOpen || !tensor) return null;

    const handleConfirm = () => {
        if (tensor.order === 0) {
            onConfirm(0);
            return;
        }

        // Calculate flat index
        let flatIndex = 0;
        let multiplier = tensor.size;

        for (let i = 0; i < tensor.order; i++) {
            multiplier /= tensor.shape[i];
            flatIndex += dimIndices[i] * multiplier;
        }

        onConfirm(flatIndex);
    };

    const handleIndexChange = (dim: number, val: number) => {
        const next = [...dimIndices];
        next[dim] = val;
        setDimIndices(next);
    };

    const getDimLabel = (dimIndex: number) => {
        if (tensor.order === 2) {
            return dimIndex === 0 ? 'Row' : 'Column';
        }
        return `Dim ${dimIndex}`;
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div
                className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-purple-500/10 w-full max-w-sm overflow-hidden flex flex-col"
                role="dialog"
                aria-modal="true"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-700/50 bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-slate-200">
                        {mode === 'source' ? 'Connect Tensor Output' : 'Connect Tensor Input'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-4 flex flex-col gap-4">
                    <p className="text-sm text-slate-400">
                        Select which index of the <span className="text-purple-400 font-semibold">{tensor.label}</span> ({tensor.order}D) to {mode === 'source' ? 'pass through the output connection' : 'receive the incoming connection'}.
                    </p>

                    {tensor.order === 0 && (
                        <div className="p-3 bg-slate-800 rounded border border-slate-700 flex justify-center">
                            <span className="text-sm text-slate-300">Scalar value (Index 0) will be used.</span>
                        </div>
                    )}

                    {tensor.order > 0 && (
                        <div className="flex flex-col gap-3 max-h-[40vh] overflow-y-auto custom-scrollbar pr-1">
                            {dimIndices.map((val, idx) => (
                                <div key={idx} className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                        {getDimLabel(idx)} <span className="text-slate-500">(0 to {tensor.shape[idx] - 1})</span>
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        max={tensor.shape[idx] - 1}
                                        value={val}
                                        onChange={(e) => {
                                            const parsed = parseInt(e.target.value, 10);
                                            if (!isNaN(parsed) && parsed >= 0 && parsed < tensor.shape[idx]) {
                                                handleIndexChange(idx, parsed);
                                            }
                                        }}
                                        className="px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-purple-500 w-full"
                                    />
                                    {/* Optional slider for quick selection */}
                                    <input
                                        type="range"
                                        min={0}
                                        max={tensor.shape[idx] - 1}
                                        value={val}
                                        onChange={(e) => handleIndexChange(idx, parseInt(e.target.value, 10))}
                                        className="w-full accent-purple-500"
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-700/50 bg-slate-800/30">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded font-medium text-sm text-slate-300 hover:bg-slate-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 rounded font-medium text-sm bg-purple-600 hover:bg-purple-500 text-white transition-colors"
                    >
                        Connect
                    </button>
                </div>
            </div>
        </div>
    );
};
