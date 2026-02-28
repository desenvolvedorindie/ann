import React, { useState } from 'react';
import { Shuffle } from 'lucide-react';

export interface RandomizeOptions {
    input: boolean;
    weight: boolean;
    biasWeight: boolean; // Just mapping explicitly to generic weight randomize for now
    tensor: boolean;
    pixelMatrix: boolean;
}

interface RandomizePanelProps {
    onRandomize: (options: RandomizeOptions) => void;
}

export const RandomizePanel: React.FC<RandomizePanelProps> = ({ onRandomize }) => {
    const [options, setOptions] = useState<RandomizeOptions>({
        input: false,
        weight: true,
        biasWeight: true,
        tensor: false,
        pixelMatrix: false,
    });

    const toggle = (key: keyof RandomizeOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const allSelected = Object.values(options).every(Boolean);

    const toggleAll = () => {
        const nextState = !allSelected;
        setOptions({
            input: nextState,
            weight: nextState,
            biasWeight: nextState,
            tensor: nextState,
            pixelMatrix: nextState,
        });
    };

    return (
        <div className="w-full bg-slate-800/90 text-slate-100 flex flex-col h-full border-b border-slate-700 overflow-hidden shrink-0">
            <div className="flex items-center p-3 bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
                <Shuffle className="w-4 h-4 text-amber-400 mr-2" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">Randomize</h3>
            </div>

            <div className="p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
                <p className="text-xs text-slate-400">Select which parameters to randomize across the entire loaded network graph.</p>

                <div className="flex flex-col gap-3">
                    <label className="flex items-center gap-3 cursor-pointer group pb-2 border-b border-slate-700/50 mb-1">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} className="form-checkbox text-amber-500 rounded border-slate-600 bg-slate-700/50 w-4 h-4 transition-colors focus:ring-0 focus:ring-offset-0" />
                        <span className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">Select All</span>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={options.input} onChange={() => toggle('input')} className="form-checkbox text-amber-500 rounded border-slate-600 bg-slate-700/50 w-4 h-4 transition-colors focus:ring-0 focus:ring-offset-0" />
                        <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">Inputs</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={options.weight} onChange={() => toggle('weight')} className="form-checkbox text-amber-500 rounded border-slate-600 bg-slate-700/50 w-4 h-4 transition-colors focus:ring-0 focus:ring-offset-0" />
                        <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">Connection Weights</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={options.biasWeight} onChange={() => toggle('biasWeight')} className="form-checkbox text-amber-500 rounded border-slate-600 bg-slate-700/50 w-4 h-4 transition-colors focus:ring-0 focus:ring-offset-0" />
                        <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">Bias Weights</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={options.tensor} onChange={() => toggle('tensor')} className="form-checkbox text-amber-500 rounded border-slate-600 bg-slate-700/50 w-4 h-4 transition-colors focus:ring-0 focus:ring-offset-0" />
                        <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">Tensor Data</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" checked={options.pixelMatrix} onChange={() => toggle('pixelMatrix')} className="form-checkbox text-amber-500 rounded border-slate-600 bg-slate-700/50 w-4 h-4 transition-colors focus:ring-0 focus:ring-offset-0" />
                        <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">Pixel Matrices</span>
                    </label>
                </div>
            </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-700 border-opacity-50">
                <button
                    onClick={() => onRandomize(options)}
                    className="w-full py-2.5 font-bold rounded-lg shadow-lg transition-all duration-300 flex items-center justify-center gap-2 bg-slate-700 text-amber-400 hover:bg-slate-600 hover:text-amber-300 border border-slate-600 hover:border-amber-500/50 hover:shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                >
                    <Shuffle className="w-4 h-4" />
                    Randomize Now
                </button>
            </div>
        </div>
    );
};
