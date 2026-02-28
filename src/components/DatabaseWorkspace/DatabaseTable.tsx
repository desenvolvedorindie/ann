import React from 'react';
import { Table, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { Dataset } from '../../models/dataset';

export interface SortConfig {
    type: 'input' | 'output';
    index: number;
    direction: 'asc' | 'desc';
}

interface DatabaseTableProps {
    activeDataset: Dataset;
    displayRows: Dataset['rows'];
    sortConfig: SortConfig | null;
    hoveredRowIndex: number | null;
    onSort: (type: 'input' | 'output', index: number) => void;
    onHoverRow: (index: number | null) => void;
}

export const DatabaseTable: React.FC<DatabaseTableProps> = ({
    activeDataset,
    displayRows,
    sortConfig,
    hoveredRowIndex,
    onSort,
    onHoverRow
}) => {
    const SortIcon = ({ type, index }: { type: 'input' | 'output', index: number }) => {
        if (sortConfig?.type === type && sortConfig?.index === index) {
            return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-indigo-400" /> : <ArrowDown className="w-4 h-4 text-indigo-400" />;
        }
        return <ArrowUpDown className="w-4 h-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />;
    };

    return (
        <>
            <div className="flex items-center gap-2 border-b border-slate-700 pb-4 mb-4 shrink-0">
                <Table className="w-5 h-5 text-slate-400" />
                <h2 className="text-lg font-semibold text-slate-200">
                    Truth Table: {activeDataset.name.replace('Logic Gate: ', '')}
                </h2>
            </div>

            <div className="bg-slate-900/50 rounded-xl border border-slate-700/50 shadow-inner block flex-1 overflow-auto">
                <table className="w-full text-sm text-center text-slate-300">
                    <thead className="text-xs uppercase bg-slate-800/80 text-slate-400 border-b border-slate-700">
                        <tr>
                            {activeDataset.inputColumns.map((col, i) => (
                                <th key={`in-col-${i}`} onClick={() => onSort('input', i)} scope="col" className="px-6 py-4 font-semibold tracking-wider cursor-pointer hover:bg-slate-700/50 transition-colors group">
                                    <div className="flex items-center justify-center gap-2">
                                        {col}
                                        <SortIcon type="input" index={i} />
                                    </div>
                                </th>
                            ))}
                            {activeDataset.outputColumns.map((col, i) => (
                                <th key={`out-col-${i}`} onClick={() => onSort('output', i)} scope="col" className="px-6 py-4 font-semibold tracking-wider text-emerald-400 bg-slate-800/50 cursor-pointer hover:bg-emerald-900/30 transition-colors group">
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
                            <tr
                                key={index}
                                className={`border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors cursor-default outline-none focus:outline-none ${hoveredRowIndex === index ? 'bg-slate-700/60 ring-1 ring-inset ring-indigo-500/50' : ''}`}
                                onMouseEnter={() => onHoverRow(index)}
                                onMouseLeave={() => onHoverRow(null)}
                            >
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
        </>
    );
};
