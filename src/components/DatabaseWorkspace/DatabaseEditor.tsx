import React, { useState } from 'react';
import { Table, Plus, Trash2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import type { Dataset } from '../../models/dataset';

interface DatabaseEditorProps {
    editDataset: Dataset;
    setEditDataset: React.Dispatch<React.SetStateAction<Dataset | null>>;
}

export const DatabaseEditor: React.FC<DatabaseEditorProps> = ({ editDataset, setEditDataset }) => {
    const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null);

    const addInputColumn = () => {
        const newColName = `X${editDataset.inputColumns.length + 1}`;
        const newCols = [...editDataset.inputColumns, newColName];

        const newRows = editDataset.rows.map(row => ({
            ...row,
            inputs: [...row.inputs, 0]
        }));

        setEditDataset({ ...editDataset, inputColumns: newCols, rows: newRows });
    };

    const addOutputColumn = () => {
        const newColName = `Y${editDataset.outputColumns.length + 1}`;
        const newCols = [...editDataset.outputColumns, newColName];

        const newRows = editDataset.rows.map(row => ({
            ...row,
            outputs: [...row.outputs, 0]
        }));

        setEditDataset({ ...editDataset, outputColumns: newCols, rows: newRows });
    };

    const addRow = () => {
        const numInputs = editDataset.inputColumns.length;
        const numOutputs = editDataset.outputColumns.length;
        setEditDataset({
            ...editDataset,
            rows: [...editDataset.rows, { inputs: new Array(numInputs).fill(0), outputs: new Array(numOutputs).fill(0) }]
        });
    };

    const handleInputChange = (rowIndex: number, colIndex: number, value: number) => {
        const newRows = [...editDataset.rows];
        newRows[rowIndex].inputs[colIndex] = value;
        setEditDataset({ ...editDataset, rows: newRows });
    };

    const handleOutputChange = (rowIndex: number, colIndex: number, value: number) => {
        const newRows = [...editDataset.rows];
        newRows[rowIndex].outputs[colIndex] = value;
        setEditDataset({ ...editDataset, rows: newRows });
    };

    const handleInputColumnNameChange = (colIndex: number, value: string) => {
        const newCols = [...editDataset.inputColumns];
        newCols[colIndex] = value;
        setEditDataset({ ...editDataset, inputColumns: newCols });
    };

    const handleOutputColumnNameChange = (colIndex: number, value: string) => {
        const newCols = [...editDataset.outputColumns];
        newCols[colIndex] = value;
        setEditDataset({ ...editDataset, outputColumns: newCols });
    };

    const deleteRow = (rowIndex: number) => {
        if (editDataset.rows.length <= 1) return;
        const newRows = editDataset.rows.filter((_, i) => i !== rowIndex);
        setEditDataset({ ...editDataset, rows: newRows });
    };

    const moveInputColumn = (index: number, direction: 'left' | 'right') => {
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

    const removeInputColumn = (index: number) => {
        if (editDataset.inputColumns.length <= 1) return;
        const newCols = editDataset.inputColumns.filter((_, i) => i !== index);
        const newRows = editDataset.rows.map(row => ({
            ...row,
            inputs: row.inputs.filter((_, i) => i !== index)
        }));
        setEditDataset({ ...editDataset, inputColumns: newCols, rows: newRows });
    };

    const removeOutputColumn = (index: number) => {
        if (editDataset.outputColumns.length <= 1) return;
        const newCols = editDataset.outputColumns.filter((_, i) => i !== index);
        const newRows = editDataset.rows.map(row => ({
            ...row,
            outputs: row.outputs.filter((_, i) => i !== index)
        }));
        setEditDataset({ ...editDataset, outputColumns: newCols, rows: newRows });
    };

    const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
        setDraggedRowIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
        e.preventDefault();
        if (draggedRowIndex === null || draggedRowIndex === index) return;

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

    return (
        <div className="flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden flex flex-col p-8">
            <div className="w-full h-full flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <Table className="w-5 h-5 text-amber-400" />
                        <h2 className="text-lg font-semibold text-slate-200">Data Structure</h2>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={addInputColumn} className="px-3 py-1.5 text-xs bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 rounded border border-indigo-500/50 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Input Column (X)
                        </button>
                        <button onClick={addOutputColumn} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded border border-emerald-500/50 flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Output Column (Y)
                        </button>
                    </div>
                </div>

                <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 shadow-inner block flex-1 overflow-auto">
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
                                            <button
                                                onClick={() => removeInputColumn(i)}
                                                disabled={editDataset.inputColumns.length <= 1}
                                                className="absolute top-1 right-1 opacity-0 group-hover/th:opacity-100 p-0.5 text-slate-500 hover:text-red-400 disabled:invisible transition-all"
                                                title="Remove Column"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
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
                                            <button
                                                onClick={() => removeOutputColumn(i)}
                                                disabled={editDataset.outputColumns.length <= 1}
                                                className="absolute top-1 right-1 opacity-0 group-hover/th:opacity-100 p-0.5 text-slate-500 hover:text-red-400 disabled:invisible transition-all"
                                                title="Remove Column"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
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
                                                title="Remove Row"
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
                                Add Row
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
