import React from 'react';
import type { PropertiesPanelProps } from './types';
import { NeuronProperties } from './NeuronProperties';
import { SynapseProperties } from './SynapseProperties';

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedNode,
    selectedEdge,
    onUpdateNeuron,
    onUpdateSynapse,
    synapses,
    onSelectNodeById,
    onSelectEdgeById,
    layerChildIds,
    parentLayerId,
    neuronsRef,
}) => {
    if (!selectedNode && !selectedEdge) {
        return (
            <aside className="w-full text-slate-100 p-6 flex flex-col gap-4 z-10">
                <h2 className="text-xl font-bold text-slate-200">Properties</h2>
                <div className="text-sm text-slate-400 mt-10 text-center italic">
                    Select a neuron or connection to view its properties.
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-full text-slate-100 p-6 flex flex-col gap-6 z-10">
            <h2 className="text-xl font-bold text-slate-200 border-b border-slate-700 pb-2">Properties</h2>

            {selectedNode && (
                <NeuronProperties
                    selectedNode={selectedNode}
                    synapses={synapses}
                    onUpdateNeuron={onUpdateNeuron}
                    onSelectNodeById={onSelectNodeById}
                    onSelectEdgeById={onSelectEdgeById}
                    layerChildIds={layerChildIds}
                    parentLayerId={parentLayerId}
                    neuronsRef={neuronsRef}
                />
            )}

            {selectedEdge && (
                <SynapseProperties
                    selectedEdge={selectedEdge}
                    onUpdateSynapse={onUpdateSynapse}
                    onSelectNodeById={onSelectNodeById}
                />
            )}
        </aside>
    );
};
