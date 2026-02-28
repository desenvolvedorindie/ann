import React, { useState, useEffect } from 'react';
import { Network, X, Layers } from 'lucide-react';
import type { NeuronType } from '../models/neural';

interface MultiDropModalProps {
    isOpen: boolean;
    nodeType: NeuronType | null;
    onClose: () => void;
    onConfirm: (count: number) => void;
}

export const MultiDropModal: React.FC<MultiDropModalProps> = ({ isOpen, nodeType, onClose, onConfirm }) => {
    const [count, setCount] = useState<number>(5);

    useEffect(() => {
        if (isOpen) {
            setCount(5); // Reset to default when opening
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (count > 0 && count <= 50) {
            onConfirm(count);
            onClose();
        }
    };

    const nodeNameLabel = () => {
        switch (nodeType) {
            case 'input': return 'Input Neurons';
            case 'bias': return 'Bias Neurons';
            case 'perceptron': return 'Perceptrons';
            case 'pixel-matrix': return 'Pixel Matrices';
            default: return 'Neurons';
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div
                className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all"
                role="dialog"
                aria-modal="true"
            >
                <div className="px-6 py-4 border-b border-slate-700/50 flex items-center justify-between bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-500/20 text-pink-400 rounded-lg">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-100">Batch Creation</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-700/50 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <p className="text-sm text-slate-300 mb-6">
                        You dropped <span className="font-bold text-pink-400">{nodeNameLabel()}</span> with the <kbd className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs mx-1 font-mono">CTRL</kbd> key pressed. How many nodes do you want to stack?
                    </p>

                    <div className="mb-6">
                        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                            Quantidade (1-50)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                autoFocus
                                min="1"
                                max="50"
                                value={count}
                                onChange={(e) => setCount(Number(e.target.value))}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pl-11 text-slate-100 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent font-medium"
                            />
                            <Network className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 transform -translate-y-1/2" />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 rounded-xl font-bold bg-pink-500 hover:bg-pink-400 text-white shadow-lg shadow-pink-500/25 transition-all active:scale-95"
                        >
                            Create Nodes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
