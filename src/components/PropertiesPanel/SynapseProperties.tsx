import React from 'react';
import type { ISynapse } from '../../models/neural';
import { NumberInput } from './SharedComponents';
import { typeColorMap } from './constants';

interface SynapsePropertiesProps {
    selectedEdge: ISynapse;
    onUpdateSynapse: (id: string, updates: Partial<ISynapse>) => void;
    onSelectNodeById?: (id: string) => void;
}

export const SynapseProperties: React.FC<SynapsePropertiesProps> = ({
    selectedEdge,
    onUpdateSynapse,
    onSelectNodeById,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <h3 className="font-semibold text-purple-300">Synapse Config</h3>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Id</label>
                <input
                    disabled
                    value={selectedEdge.id}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-500 font-mono"
                />
            </div>

            {selectedEdge.postSynaptic.type !== 'output' && selectedEdge.postSynaptic.type !== 'pixel-matrix' && selectedEdge.postSynaptic.type !== 'mcculloch-pitts' && selectedEdge.preSynaptic.type !== 'tensor' && selectedEdge.postSynaptic.type !== 'tensor' && (
                <NumberInput
                    label="Weight"
                    value={selectedEdge.weight}
                    onChange={(val) => onUpdateSynapse(selectedEdge.id, { weight: val })}
                    focusColor="purple"
                />
            )}

            <div className="flex flex-col gap-2 mt-2">
                <div className="flex flex-col gap-2 relative">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 pb-1">Source (Pre)</label>
                    <div
                        onClick={() => onSelectNodeById?.(selectedEdge.preSynaptic.id)}
                        className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-slate-700 transition-colors"
                        title="Click to select the Source neuron"
                    >
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColorMap[selectedEdge.preSynaptic.type] || 'text-slate-400'}`}>
                            {selectedEdge.preSynaptic.type === 'mcculloch-pitts' ? 'McCulloch-Pitts' : selectedEdge.preSynaptic.type}
                        </span>
                        <div className="flex items-center mt-0.5">
                            <span className="text-slate-200 font-medium truncate">{selectedEdge.preSynaptic.label}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2 relative mt-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 pb-1">Target (Post)</label>
                    <div
                        onClick={() => onSelectNodeById?.(selectedEdge.postSynaptic.id)}
                        className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-slate-700 transition-colors"
                        title="Click to select the Target neuron"
                    >
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColorMap[selectedEdge.postSynaptic.type] || 'text-slate-400'}`}>
                            {selectedEdge.postSynaptic.type === 'mcculloch-pitts' ? 'McCulloch-Pitts' : selectedEdge.postSynaptic.type}
                        </span>
                        <div className="flex items-center mt-0.5">
                            <span className="text-slate-200 font-medium truncate">{selectedEdge.postSynaptic.label}</span>
                        </div>
                    </div>
                </div>
            </div>

            {(selectedEdge.postSynaptic.type === 'output' || selectedEdge.postSynaptic.type === 'pixel-matrix' || selectedEdge.preSynaptic.type === 'tensor' || selectedEdge.postSynaptic.type === 'tensor') && (
                <div className="flex flex-col gap-1 mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                    <h3 className="text-sm font-semibold text-orange-400 mb-1">Data Connection</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        This connection transfers values directly. It reads the specific element from the source and passes it to the target without applying connection weights.
                    </p>
                </div>
            )}
        </div>
    );
};
