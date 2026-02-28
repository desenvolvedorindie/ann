import React from 'react';
import { Database, Plus, Edit2, Save, X, LayoutTemplate, SplitSquareHorizontal } from 'lucide-react';
import type { Dataset } from '../../models/dataset';

interface DatabaseHeaderProps {
    isEditing: boolean;
    datasets: Dataset[];
    activeDatasetId: string;
    activeDataset: Dataset;
    editDataset: Dataset | null;
    plotLayout: 'bottom' | 'side';
    onDatasetChange: (id: string) => void;
    onCreateNew: () => void;
    onEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    onPlotLayoutToggle: () => void;
    onEditDatasetNameChange: (name: string) => void;
}

export const DatabaseHeader: React.FC<DatabaseHeaderProps> = ({
    isEditing,
    datasets,
    activeDatasetId,
    activeDataset,
    editDataset,
    plotLayout,
    onDatasetChange,
    onCreateNew,
    onEdit,
    onSave,
    onCancel,
    onPlotLayoutToggle,
    onEditDatasetNameChange
}) => {
    if (isEditing && editDataset) {
        return (
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                        <Edit2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            Editing:
                            <input
                                type="text"
                                value={editDataset.name}
                                onChange={(e) => onEditDatasetNameChange(e.target.value)}
                                className="bg-slate-800 border-b-2 border-slate-600 focus:border-amber-400 outline-none px-2 py-1 text-amber-400 transition-colors"
                            />
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg font-medium transition-colors border border-slate-700"
                    >
                        <X className="w-4 h-4" />
                        Cancel
                    </button>
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 shadow-lg shadow-amber-500/20 rounded-lg font-bold transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Save
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 rounded-xl">
                    <Database className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        Data
                    </h1>
                </div>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg font-medium transition-colors border border-emerald-500/50"
                >
                    <Plus className="w-4 h-4" />
                    New
                </button>
                <select
                    value={activeDatasetId}
                    onChange={(e) => onDatasetChange(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none shadow-sm min-w-48"
                >
                    <optgroup label="Patterns (Logic Gates)">
                        {datasets.filter(d => d.isReadOnly).map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                    </optgroup>
                    {datasets.filter(d => !d.isReadOnly).length > 0 && (
                        <optgroup label="Meus Datasets">
                            {datasets.filter(d => !d.isReadOnly).map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                        </optgroup>
                    )}
                </select>
                <button
                    onClick={onEdit}
                    disabled={activeDataset.isReadOnly}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-colors ${activeDataset.isReadOnly
                        ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                        : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-indigo-500/50'
                        }`}
                >
                    <Edit2 className="w-4 h-4" />
                    Edit
                </button>
                <button
                    onClick={onPlotLayoutToggle}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg font-medium transition-colors border border-slate-700 ml-4 shadow-sm"
                    title={plotLayout === 'bottom' ? 'Mudar para layout Lado-a-Lado' : 'Mudar para layout Horizontal'}
                >
                    {plotLayout === 'bottom' ? <SplitSquareHorizontal className="w-5 h-5 rotate-90" /> : <LayoutTemplate className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};
