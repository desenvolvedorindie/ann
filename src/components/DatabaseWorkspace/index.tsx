import React, { useState, useEffect } from 'react';
import { DatabaseHeader } from './DatabaseHeader';
import { DatabaseView } from './DatabaseView';
import { DatabaseEditor } from './DatabaseEditor';
import type { Dataset } from '../../models/dataset';
import { defaultLogicGates } from '../../models/dataset';

interface DatabaseWorkspaceProps {
    datasets: Dataset[];
    setDatasets: React.Dispatch<React.SetStateAction<Dataset[]>>;
}

interface SortConfig {
    type: 'input' | 'output';
    index: number;
    direction: 'asc' | 'desc';
}

export const DatabaseWorkspace: React.FC<DatabaseWorkspaceProps> = ({ datasets, setDatasets }) => {
    const [activeDatasetId, setActiveDatasetId] = useState(datasets[0]?.id || 'and-gate');

    // UI states
    const [isEditing, setIsEditing] = useState(false);
    const [editDataset, setEditDataset] = useState<Dataset | null>(null);
    const [plotLayout, setPlotLayout] = useState<'bottom' | 'side'>('bottom');
    const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
    const [plotAxisX, setPlotAxisX] = useState<number>(0);
    const [plotAxisY, setPlotAxisY] = useState<number>(1);
    const [plotAxisOutput, setPlotAxisOutput] = useState<number>(0);
    const [plotFilters, setPlotFilters] = useState<Record<number, number>>({});
    const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

    const activeDataset = datasets.find(d => d.id === activeDatasetId) || datasets[0];

    useEffect(() => {
        const savedLayout = localStorage.getItem('database-workspace-plot-layout');
        if (savedLayout === 'bottom' || savedLayout === 'side') {
            setPlotLayout(savedLayout);
        }
    }, []);

    useEffect(() => {
        setSortConfig(null);
        setPlotAxisX(0);
        setPlotAxisY(1);
        setPlotAxisOutput(0);
        setPlotFilters({});
        setHoveredRowIndex(null);
    }, [activeDatasetId]);

    const handleDatasetChange = (id: string) => {
        if (isEditing) {
            if (!confirm('There are unsaved changes. Do you want to discard them?')) {
                return;
            }
            setIsEditing(false);
            setEditDataset(null);
        }
        setActiveDatasetId(id);
    };

    const handleCreateNew = () => {
        const newDataset: Dataset = {
            id: `custom-${Date.now()}`,
            name: 'New Dataset',
            inputColumns: ['X1', 'X2'],
            outputColumns: ['Y1'],
            rows: [
                { inputs: [0, 0], outputs: [0] },
                { inputs: [0, 1], outputs: [1] },
                { inputs: [1, 0], outputs: [1] },
                { inputs: [1, 1], outputs: [0] },
            ],
            isReadOnly: false
        };
        setDatasets([...datasets, newDataset]);
        setActiveDatasetId(newDataset.id);
        setEditDataset(JSON.parse(JSON.stringify(newDataset)));
        setIsEditing(true);
    };

    const handleEdit = () => {
        if (activeDataset.isReadOnly) return;
        setEditDataset(JSON.parse(JSON.stringify(activeDataset)));
        setIsEditing(true);
    };

    const handleSave = () => {
        if (editDataset) {
            if (editDataset.rows.length === 0) {
                alert('The dataset cannot be empty.');
                return;
            }
            setDatasets(datasets.map(d => d.id === editDataset.id ? editDataset : d));
            setIsEditing(false);
            setEditDataset(null);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditDataset(null);

        // If it was a new dataset that was canceled before saving
        if (!datasets.find(d => d.id === activeDatasetId)) {
            setActiveDatasetId(datasets[0].id);
        } else if (activeDataset.rows.length === 0) {
            // If the existing dataset was empty when clicked edit and canceled
            const initial = defaultLogicGates.find(d => d.id === activeDatasetId);
            if (initial) {
                setDatasets(datasets.map(d => d.id === activeDatasetId ? initial : d));
            }
        }
    };

    const handlePlotLayoutToggle = () => {
        const newLayout = plotLayout === 'bottom' ? 'side' : 'bottom';
        setPlotLayout(newLayout);
        localStorage.setItem('database-workspace-plot-layout', newLayout);
    };

    const handleSort = (type: 'input' | 'output', index: number) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.type === type && sortConfig.index === index) {
            if (sortConfig.direction === 'asc') direction = 'desc';
            else {
                setSortConfig(null);
                return;
            }
        }
        setSortConfig({ type, index, direction });
    };

    const handleEditDatasetNameChange = (name: string) => {
        if (editDataset) {
            setEditDataset({ ...editDataset, name });
        }
    };

    return (
        <div className="h-full bg-slate-900 border-l border-slate-800 p-8 flex flex-col font-sans relative overflow-hidden">
            <DatabaseHeader
                isEditing={isEditing}
                datasets={datasets}
                activeDatasetId={activeDatasetId}
                activeDataset={activeDataset}
                editDataset={editDataset}
                plotLayout={plotLayout}
                onDatasetChange={handleDatasetChange}
                onCreateNew={handleCreateNew}
                onEdit={handleEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onPlotLayoutToggle={handlePlotLayoutToggle}
                onEditDatasetNameChange={handleEditDatasetNameChange}
            />

            <div className="flex-1 min-h-0 flex gap-4 overflow-hidden relative">
                {isEditing && editDataset ? (
                    <DatabaseEditor
                        editDataset={editDataset}
                        setEditDataset={setEditDataset}
                    />
                ) : (
                    <DatabaseView
                        activeDataset={activeDataset}
                        plotLayout={plotLayout}
                        sortConfig={sortConfig}
                        onSort={handleSort}
                        plotAxisX={plotAxisX}
                        setPlotAxisX={setPlotAxisX}
                        plotAxisY={plotAxisY}
                        setPlotAxisY={setPlotAxisY}
                        plotAxisOutput={plotAxisOutput}
                        setPlotAxisOutput={setPlotAxisOutput}
                        plotFilters={plotFilters}
                        setPlotFilters={setPlotFilters}
                        hoveredRowIndex={hoveredRowIndex}
                        setHoveredRowIndex={setHoveredRowIndex}
                    />
                )}
            </div>
        </div>
    );
};
