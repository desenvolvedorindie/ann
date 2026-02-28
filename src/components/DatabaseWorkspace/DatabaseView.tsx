import React, { useState, useEffect } from 'react';
import type { Dataset } from '../../models/dataset';
import { DatabaseTable } from './DatabaseTable';
import type { SortConfig } from './DatabaseTable';
import { DatabasePlot } from './DatabasePlot';

interface DatabaseViewProps {
    activeDataset: Dataset;
    plotLayout: 'bottom' | 'side';
    sortConfig: SortConfig | null;
    onSort: (type: 'input' | 'output', index: number) => void;
    // States that could eventually be lifted up or kept here
    plotAxisX: number;
    setPlotAxisX: (val: number) => void;
    plotAxisY: number;
    setPlotAxisY: (val: number) => void;
    plotAxisOutput: number;
    setPlotAxisOutput: (val: number) => void;
    plotFilters: Record<number, number>;
    setPlotFilters: React.Dispatch<React.SetStateAction<Record<number, number>>>;
    hoveredRowIndex: number | null;
    setHoveredRowIndex: (val: number | null) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
    activeDataset,
    plotLayout,
    sortConfig,
    onSort,
    plotAxisX,
    setPlotAxisX,
    plotAxisY,
    setPlotAxisY,
    plotAxisOutput,
    setPlotAxisOutput,
    plotFilters,
    setPlotFilters,
    hoveredRowIndex,
    setHoveredRowIndex,
}) => {
    // Panel Resizing State
    const [panelSize, setPanelSize] = useState<number>(50); // percentage (0-100)
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        const savedSize = localStorage.getItem('database-workspace-panel-size');
        if (savedSize && !isNaN(Number(savedSize))) {
            setPanelSize(Number(savedSize));
        }
    }, []);

    useEffect(() => {
        if (!isDragging) {
            localStorage.setItem('database-workspace-panel-size', panelSize.toString());
        }
    }, [isDragging, panelSize]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            if (plotLayout === 'bottom') {
                const percentage = (e.clientY / window.innerHeight) * 100;
                setPanelSize(Math.max(20, Math.min(80, percentage)));
            } else {
                const percentage = (e.clientX / window.innerWidth) * 100;
                setPanelSize(Math.max(20, Math.min(80, percentage)));
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, plotLayout]);

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

    return (
        <div className={`flex-1 bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden flex ${plotLayout === 'bottom' ? 'flex-col' : 'flex-row'}`}>
            <div className="flex flex-col min-h-0 bg-slate-900/20 p-4 sm:p-6 lg:p-8" style={{ flexBasis: `${panelSize}%`, flexShrink: 0, flexGrow: 0, overflow: 'hidden' }}>
                <DatabaseTable
                    activeDataset={activeDataset}
                    displayRows={displayRows}
                    sortConfig={sortConfig}
                    hoveredRowIndex={hoveredRowIndex}
                    onSort={onSort}
                    onHoverRow={setHoveredRowIndex}
                />
            </div>

            {/* Draggable Divider */}
            <div
                className={`flex items-center justify-center bg-slate-700/50 hover:bg-indigo-500/50 transition-colors z-10 ${plotLayout === 'bottom' ? 'h-2 w-full cursor-row-resize' : 'w-2 h-full cursor-col-resize'}`}
                onMouseDown={() => setIsDragging(true)}
            >
                <div className={`rounded-full bg-slate-500/50 ${plotLayout === 'bottom' ? 'w-12 h-1' : 'h-12 w-1'}`} />
            </div>

            <div className="flex flex-col bg-slate-900/50 shadow-inner overflow-hidden p-4 sm:p-6 lg:p-8" style={{ flexBasis: `${100 - panelSize}%`, flexShrink: 0, flexGrow: 0 }}>
                <DatabasePlot
                    activeDataset={activeDataset}
                    displayRows={displayRows}
                    plotAxisX={plotAxisX}
                    plotAxisY={plotAxisY}
                    plotAxisOutput={plotAxisOutput}
                    plotFilters={plotFilters}
                    hoveredRowIndex={hoveredRowIndex}
                    setPlotAxisX={setPlotAxisX}
                    setPlotAxisY={setPlotAxisY}
                    setPlotAxisOutput={setPlotAxisOutput}
                    setPlotFilters={setPlotFilters}
                    setHoveredRowIndex={setHoveredRowIndex}
                />
            </div>
        </div>
    );
};
