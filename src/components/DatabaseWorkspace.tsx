import React, { useState } from 'react';
import { Database, Table, Plus, Edit2, Save, X, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { Dataset } from '../models/dataset';

interface DatabaseWorkspaceProps {
    datasets: Dataset[];
    setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>;
}

export const DatabaseWorkspace: React.FC<DatabaseWorkspaceProps> = ({ datasets, setDatasets }) => {
    const [activeDatasetId, setActiveDatasetId] = useState<string>(datasets[0]?.id || '');
    const [isEditing, setIsEditing] = useState(false);

    // Sorting State
    const [sortConfig, setSortConfig] = useState<{ type: 'input' | 'output', index: number, direction: 'asc' | 'desc' } | null>(null);

    // Editor State
    const [editDataset, setEditDataset] = useState<Dataset | null>(null);
    const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

    const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0];

    // Reset sort when switching datasets
    const handleDatasetChange = (newId: string) => {
        setActiveDatasetId(newId);
        setSortConfig(null);
    };

    const handleCreateNew = () => {
        const newDataset: Dataset = {
            id: `custom-${Date.now()}`,
            name: `Novo Dataset ${datasets.length + 1 - 7}`,
            isReadOnly: false,
            inputColumns: ['X1', 'X2'],
            outputColumns: ['Y1'],
            rows: [
                { inputs: [0, 0], outputs: [0] }
            ]
        };
        setEditDataset(newDataset);
        setIsEditing(true);
    };

    const handleEdit = () => {
        if (!activeDataset.isReadOnly) {
            // Clone the active dataset for editing
            setEditDataset(JSON.parse(JSON.stringify(activeDataset)));
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        if (editDataset) {
            setDatasets(prev => {
                const existingIndex = prev.findIndex(d => d.id === editDataset.id);
                if (existingIndex >= 0) {
                    const newDatasets = [...prev];
                    newDatasets[existingIndex] = editDataset;
                    return newDatasets;
                } else {
                    return [...prev, editDataset];
                }
            });
            setActiveDatasetId(editDataset.id);
            setIsEditing(false);
            setEditDataset(null);
            setSortConfig(null);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditDataset(null);
    };

    const addInputColumn = () => {
        if (!editDataset) return;
        const newColName = `X${editDataset.inputColumns.length + 1}`;
        const newCols = [...editDataset.inputColumns, newColName];

        const newRows = editDataset.rows.map(row => ({
            ...row,
            inputs: [...row.inputs, 0]
        }));

        setEditDataset({
            ...editDataset,
            inputColumns: newCols,
            rows: newRows
        });
    };

    const addOutputColumn = () => {
        if (!editDataset) return;
        const newColName = `Y${editDataset.outputColumns.length + 1}`;
        const newCols = [...editDataset.outputColumns, newColName];

        const newRows = editDataset.rows.map(row => ({
            ...row,
            outputs: [...row.outputs, 0]
        }));

        setEditDataset({
            ...editDataset,
            outputColumns: newCols,
            rows: newRows
        });
    };

    const addRow = () => {
        if (!editDataset) return;
        const numInputs = editDataset.inputColumns.length;
        const numOutputs = editDataset.outputColumns.length;
        setEditDataset({
            ...editDataset,
            rows: [...editDataset.rows, { inputs: new Array(numInputs).fill(0), outputs: new Array(numOutputs).fill(0) }]
        });
    };

    const handleInputChange = (rowIndex: number, colIndex: number, value: number) => {
        if (!editDataset) return;
        const newRows = [...editDataset.rows];
        newRows[rowIndex].inputs[colIndex] = value;
        setEditDataset({ ...editDataset, rows: newRows });
    };

    const handleOutputChange = (rowIndex: number, colIndex: number, value: number) => {
        if (!editDataset) return;
        const newRows = [...editDataset.rows];
        newRows[rowIndex].outputs[colIndex] = value;
        setEditDataset({ ...editDataset, rows: newRows });
    };

    const handleInputColumnNameChange = (colIndex: number, value: string) => {
        if (!editDataset) return;
        const newCols = [...editDataset.inputColumns];
        newCols[colIndex] = value;
        setEditDataset({ ...editDataset, inputColumns: newCols });
    };

    const handleOutputColumnNameChange = (colIndex: number, value: string) => {
        if (!editDataset) return;
        const newCols = [...editDataset.outputColumns];
        newCols[colIndex] = value;
        setEditDataset({ ...editDataset, outputColumns: newCols });
    };

    const deleteRow = (rowIndex: number) => {
        if (!editDataset || editDataset.rows.length <= 1) return;
        const newRows = editDataset.rows.filter((_, i) => i !== rowIndex);
        setEditDataset({ ...editDataset, rows: newRows });
    };

    const moveInputColumn = (index: number, direction: 'left' | 'right') => {
        if (!editDataset) return;
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= editDataset.inputColumns.length) return;

        const newCols = [...editDataset.inputColumns];
        [newCols[index], newCols[newIndex]] = [newCols[newIndex], newCols[index]];

        const newRows = editDataset.rows.map(row => {
            const newInputs = [...row.inputs];
            [newInputs[index], newInputs[newIndex]] = [newInputs[newIndex], newInputs[index]];
            return { ...row, inputs: newInputs };
        });

        setEditDataset({ ...editDataset, inputColumns: newCols, rows: newRows });
    };

    const moveOutputColumn = (index: number, direction: 'left' | 'right') => {
        if (!editDataset) return;
        const newIndex = direction === 'left' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= editDataset.outputColumns.length) return;

        const newCols = [...editDataset.outputColumns];
        [newCols[index], newCols[newIndex]] = [newCols[newIndex], newCols[index]];

        const newRows = editDataset.rows.map(row => {
            const newOutputs = [...row.outputs];
            [newOutputs[index], newOutputs[newIndex]] = [newOutputs[newIndex], newOutputs[index]];
            return { ...row, outputs: newOutputs };
        });

        setEditDataset({ ...editDataset, outputColumns: newCols, rows: newRows });
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
        setDraggedRowIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Need to set data otherwise drag doesn't work in Firefox
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
        e.preventDefault();
        if (draggedRowIndex === null || draggedRowIndex === index || !editDataset) return;

        const newRows = [...editDataset.rows];
        const draggedRow = newRows[draggedRowIndex];

        newRows.splice(draggedRowIndex, 1);
        newRows.splice(index, 0, draggedRow);

        setDraggedRowIndex(index);
        setEditDataset({ ...editDataset, rows: newRows });
    };

    const handleDragEnd = () => {
        setDraggedRowIndex(null);
    };

    const handleSort = (type: 'input' | 'output', index: number) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.type === type && sortConfig.index === index) {
            direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
        }
        setSortConfig({ type, index, direction });
    };

    // --- Render View Mode ---
    if (!isEditing) {
        let displayRows = [...activeDataset.rows];
        if (sortConfig) {
            displayRows.sort((a, b) => {
                const valA = sortConfig.type === 'input' ? a.inputs[sortConfig.index] : a.outputs[sortConfig.index];
                const valB = sortConfig.type === 'input' ? b.inputs[sortConfig.index] : b.outputs[sortConfig.index];
                if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        const SortIcon = ({ type, index }: { type: 'input' | 'output', index: number }) => {
            if (sortConfig?.type === type && sortConfig?.index === index) {
                return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-indigo-400" /> : <ArrowDown className="w-4 h-4 text-indigo-400" />;
            }
            return <ArrowUpDown className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
        };

        return (
            <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-500/20 rounded-xl">
                            <Database className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                Base de Dados
                            </h1>
                            <p className="text-sm text-slate-400">Gerencie, visualize e prepare seus dados de treinamento.</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg font-medium transition-colors border border-emerald-500/50"
                        >
                            <Plus className="w-4 h-4" />
                            Novo
                        </button>
                        <select
                            value={activeDatasetId}
                            onChange={(e) => handleDatasetChange(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 outline-none shadow-sm min-w-48"
                        >
                            <optgroup label="Padrões (Portas Lógicas)">
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
                            onClick={handleEdit}
                            disabled={activeDataset.isReadOnly}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium border transition-colors ${activeDataset.isReadOnly
                                ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50'
                                : 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 border-indigo-500/50'
                                }`}
                        >
                            <Edit2 className="w-4 h-4" />
                            Editar
                        </button>
                    </div>
                </div>

                <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden flex flex-col items-center justify-start p-8">
                    <div className="w-full max-w-2xl">
                        <div className="flex items-center gap-2 border-b border-slate-700 pb-4 mb-4">
                            <Table className="w-5 h-5 text-slate-400" />
                            <h2 className="text-lg font-semibold text-slate-200">Tabela Verdade: {activeDataset.name.replace('Porta Lógica: ', '')}</h2>
                        </div>

                        <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-inner flex overflow-x-auto">
                            <table className="w-full text-sm text-center text-slate-300">
                                <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
                                    <tr>
                                        {activeDataset.inputColumns.map((col, i) => (
                                            <th key={`in-col-${i}`} onClick={() => handleSort('input', i)} scope="col" className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors group">
                                                <div className="flex items-center justify-center gap-2">
                                                    {col}
                                                    <SortIcon type="input" index={i} />
                                                </div>
                                            </th>
                                        ))}
                                        {activeDataset.outputColumns.map((col, i) => (
                                            <th key={`out-col-${i}`} onClick={() => handleSort('output', i)} scope="col" className="px-6 py-4 font-semibold tracking-wider text-emerald-400 bg-slate-800/50 cursor-pointer hover:bg-emerald-900/30 transition-colors group">
                                                <div className="flex items-center justify-center gap-2">
                                                    {col}
                                                    <SortIcon type="output" index={i} />
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayRows.map((row, index) => (
                                        <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                                            {row.inputs.map((val, i) => (
                                                <td key={`in-${i}`} className="px-6 py-4 font-mono font-medium">
                                                    <span className={`px-2 py-1 rounded ${val === 1 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700/50 text-slate-400'}`}>
                                                        {val}
                                                    </span>
                                                </td>
                                            ))}
                                            {row.outputs.map((val, i) => (
                                                <td key={`out-${i}`} className="px-6 py-4 font-mono font-bold bg-slate-800/20">
                                                    <span className={`px-3 py-1 rounded-md ${val === 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                                                        {val}
                                                    </span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Render Editor Mode ---
    if (!editDataset) return null;

    return (
        <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 p-8">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-amber-500/20 rounded-xl">
                        <Edit2 className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            Editando:
                            <input
                                type="text"
                                value={editDataset.name}
                                onChange={(e) => setEditDataset({ ...editDataset, name: e.target.value })}
                                className="bg-slate-800 border-b-2 border-slate-600 focus:border-amber-400 outline-none px-2 py-1 text-amber-400 transition-colors"
                            />
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg font-medium transition-colors border border-slate-700"
                    >
                        <X className="w-4 h-4" />
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-900 shadow-lg shadow-amber-500/20 rounded-lg font-bold transition-colors"
                    >
                        <Save className="w-4 h-4" />
                        Salvar
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden flex flex-col items-center justify-start p-8">
                <div className="w-full max-w-4xl">
                    <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4">
                        <div className="flex items-center gap-2">
                            <Table className="w-5 h-5 text-amber-400" />
                            <h2 className="text-lg font-semibold text-slate-200">Estrutura de Dados</h2>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={addInputColumn} className="px-3 py-1.5 text-xs bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded border border-indigo-500/50 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Coluna de Entrada (X)
                            </button>
                            <button onClick={addOutputColumn} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded border border-emerald-500/50 flex items-center gap-1">
                                <Plus className="w-3 h-3" /> Coluna de Saída (Y)
                            </button>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden shadow-inner flex overflow-x-auto">
                        <div className="min-w-full">
                            <table className="w-full text-sm text-center text-slate-300">
                                <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
                                    <tr>
                                        <th scope="col" className="px-2 py-3 w-10"></th>
                                        {editDataset.inputColumns.map((col, i) => (
                                            <th key={`in-col-${i}`} scope="col" className="px-4 py-3 font-semibold tracking-wider relative group/th">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => moveInputColumn(i, 'left')} disabled={i === 0} className="opacity-0 group-hover/th:opacity-100 p-0.5 text-slate-500 hover:text-indigo-400 disabled:invisible"><ChevronLeft className="w-4 h-4" /></button>
                                                    <input
                                                        type="text"
                                                        value={col}
                                                        onChange={(e) => handleInputColumnNameChange(i, e.target.value)}
                                                        className="w-20 bg-transparent border-b border-dashed border-slate-500 text-center focus:border-indigo-400 focus:text-indigo-400 outline-none uppercase transition-colors"
                                                    />
                                                    <button onClick={() => moveInputColumn(i, 'right')} disabled={i === editDataset.inputColumns.length - 1} className="opacity-0 group-hover/th:opacity-100 p-0.5 text-slate-500 hover:text-indigo-400 disabled:invisible"><ChevronRight className="w-4 h-4" /></button>
                                                </div>
                                            </th>
                                        ))}
                                        {editDataset.outputColumns.map((col, i) => (
                                            <th key={`out-col-${i}`} scope="col" className="px-4 py-3 font-semibold tracking-wider text-emerald-400 bg-slate-800/50 relative group/th">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => moveOutputColumn(i, 'left')} disabled={i === 0} className="opacity-0 group-hover/th:opacity-100 p-0.5 text-slate-500 hover:text-emerald-400 disabled:invisible"><ChevronLeft className="w-4 h-4" /></button>
                                                    <input
                                                        type="text"
                                                        value={col}
                                                        onChange={(e) => handleOutputColumnNameChange(i, e.target.value)}
                                                        className="w-20 bg-transparent border-b border-dashed border-emerald-500/50 text-center focus:border-emerald-300 focus:text-emerald-300 outline-none uppercase transition-colors"
                                                    />
                                                    <button onClick={() => moveOutputColumn(i, 'right')} disabled={i === editDataset.outputColumns.length - 1} className="opacity-0 group-hover/th:opacity-100 p-0.5 text-slate-500 hover:text-emerald-400 disabled:invisible"><ChevronRight className="w-4 h-4" /></button>
                                                </div>
                                            </th>
                                        ))}
                                        <th scope="col" className="px-4 py-3 w-16"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {editDataset.rows.map((row, rowIndex) => (
                                        <tr
                                            key={`row-${rowIndex}`}
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, rowIndex)}
                                            onDragOver={(e) => handleDragOver(e, rowIndex)}
                                            onDragEnd={handleDragEnd}
                                            className={`border-b border-slate-700/50 transition-colors group ${draggedRowIndex === rowIndex ? 'bg-slate-800/80 opacity-50' : 'hover:bg-slate-800/30'}`}
                                        >
                                            <td className="px-2 py-2 text-slate-500 cursor-grab active:cursor-grabbing hover:text-amber-400">
                                                <GripVertical className="w-5 h-5 mx-auto" />
                                            </td>
                                            {row.inputs.map((val, colIndex) => (
                                                <td key={`in-${colIndex}`} className="px-4 py-2">
                                                    <input
                                                        type="number"
                                                        value={val}
                                                        onChange={(e) => handleInputChange(rowIndex, colIndex, Number(e.target.value))}
                                                        className="w-20 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-center font-mono focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-colors"
                                                    />
                                                </td>
                                            ))}
                                            {row.outputs.map((val, colIndex) => (
                                                <td key={`out-${colIndex}`} className="px-4 py-2 bg-slate-800/20">
                                                    <input
                                                        type="number"
                                                        value={val}
                                                        onChange={(e) => handleOutputChange(rowIndex, colIndex, Number(e.target.value))}
                                                        className="w-20 bg-slate-900 border border-emerald-700/50 rounded px-2 py-1 text-center font-mono focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 outline-none text-emerald-400 transition-colors"
                                                    />
                                                </td>
                                            ))}
                                            <td className="px-4 py-2">
                                                <button
                                                    onClick={() => deleteRow(rowIndex)}
                                                    disabled={editDataset.rows.length <= 1}
                                                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-0"
                                                    title="Remover linha"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="p-2 border-t border-slate-700/50 bg-slate-800/30">
                                <button
                                    onClick={addRow}
                                    className="w-full py-2 flex justify-center items-center gap-2 text-sm text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded border border-dashed border-slate-600 hover:border-indigo-500/50 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    Adicionar Linha
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
