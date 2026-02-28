import React from 'react';
import type { INeuron, ISynapse, NeuronPartialUpdate } from '../../models/neural';
import { NumberInput, NativeNumberInput } from './SharedComponents';
import { typeOrder, typeColorMap } from './constants';
import { TensorProperties } from './TensorProperties';
import { TensorOpsProperties } from './TensorOpsProperties';
import { Layers } from 'lucide-react';

interface NeuronPropertiesProps {
    selectedNode: INeuron;
    synapses?: ISynapse[];
    onUpdateNeuron: (id: string, updates: NeuronPartialUpdate) => void;
    onSelectNodeById?: (id: string) => void;
    onSelectEdgeById?: (id: string) => void;
    layerChildIds?: string[];
    parentLayerId?: string;
    neuronsRef?: React.MutableRefObject<Map<string, INeuron>>;
}

export const NeuronProperties: React.FC<NeuronPropertiesProps> = ({
    selectedNode,
    synapses,
    onUpdateNeuron,
    onSelectNodeById,
    onSelectEdgeById,
    layerChildIds,
    parentLayerId,
    neuronsRef,
}) => {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <h3 className="font-semibold text-blue-300">Neuron Config</h3>
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Id</label>
                <input
                    disabled
                    value={selectedNode.id}
                    className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-500 font-mono"
                />
            </div>



            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Label</label>
                <input
                    value={selectedNode.label}
                    onChange={(e) => onUpdateNeuron(selectedNode.id, { label: e.target.value })}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Type</label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 capitalize">
                    {selectedNode.type}
                </div>
            </div>

            {selectedNode.type === 'input' && (
                <NumberInput
                    label="Input Value"
                    value={typeof selectedNode.output === 'number' ? selectedNode.output : 0}
                    onChange={(val) => onUpdateNeuron(selectedNode.id, { output: val })}
                    focusColor="emerald"
                />
            )}

            {selectedNode.type === 'mcculloch-pitts' && (
                <NumberInput
                    label="Limiar (Threshold)"
                    value={selectedNode.bias || 0}
                    onChange={(val) => onUpdateNeuron(selectedNode.id, { bias: val })}
                    focusColor="indigo"
                />
            )}

            {/* Removed Bias for Perceptron as per user request */}

            {selectedNode.type === 'pixel-matrix' && (
                <div className="flex flex-col gap-2">
                    <NativeNumberInput
                        label="Width"
                        value={(selectedNode as any).width || 30}
                        min={1}
                        max={100}
                        onChange={(val) => {
                            onUpdateNeuron(selectedNode.id, { width: val } as any);
                        }}
                        focusColor="pink"
                    />
                    <NativeNumberInput
                        label="Height"
                        value={(selectedNode as any).height || 30}
                        min={1}
                        max={100}
                        onChange={(val) => {
                            onUpdateNeuron(selectedNode.id, { height: val } as any);
                        }}
                        focusColor="pink"
                    />
                </div>
            )}

            {selectedNode.type === 'tensor' && (
                <TensorProperties
                    tensor={selectedNode as any}
                    onUpdateNeuron={onUpdateNeuron}
                />
            )}

            {(selectedNode.type === 'tensor-elem-op' || selectedNode.type === 'tensor-reduce-op' || selectedNode.type === 'tensor-matrix-op' || selectedNode.type === 'tensor-reshape-op') && (
                <TensorOpsProperties
                    node={selectedNode as any}
                    onUpdateNeuron={onUpdateNeuron}
                />
            )}

            {selectedNode.type !== 'input' && selectedNode.type !== 'pixel-matrix' && selectedNode.type !== 'tensor' && !selectedNode.type.startsWith('tensor-') && selectedNode.type !== 'layer' && (
                <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Output</label>
                    <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 font-mono">
                        {typeof selectedNode.output === 'number' ? selectedNode.output : 'Array(Batched)'}
                    </div>
                </div>
            )}

            {selectedNode.type === 'layer' && layerChildIds && neuronsRef && (
                <div className="flex flex-col gap-2 mt-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 pb-1">Layer Neurons</label>
                    {layerChildIds.length > 0 ? (
                        <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                            {layerChildIds.slice().sort((a, b) => {
                                const nodeA = neuronsRef.current.get(a);
                                const nodeB = neuronsRef.current.get(b);
                                const orderA = nodeA ? (typeOrder[nodeA.type] || 99) : 99;
                                const orderB = nodeB ? (typeOrder[nodeB.type] || 99) : 99;
                                return orderA - orderB;
                            }).map(id => {
                                const n = neuronsRef.current.get(id);
                                if (!n) return null;
                                return (
                                    <div key={id} onClick={() => onSelectNodeById?.(id)} className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-slate-700 transition-colors" title="Select Neuron">
                                        <div className="flex justify-between items-center">
                                            <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColorMap[n.type] || 'text-slate-400'}`}>
                                                {n.type === 'mcculloch-pitts' ? 'McCulloch-Pitts' : n.type}
                                            </span>
                                        </div>
                                        <div className="flex items-center">
                                            <span className="text-slate-200 font-medium truncate" title={n.label}>{n.label}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <span className="text-xs text-slate-500 italic">No neurons in this layer</span>
                    )}
                </div>
            )}

            {parentLayerId && neuronsRef?.current?.has(parentLayerId) && (
                <div className="flex flex-col gap-1 mt-2">
                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Layer</label>
                    <button
                        onClick={() => onSelectNodeById?.(parentLayerId)}
                        className="px-3 py-2 bg-slate-800 border-[1.5px] border-slate-700 hover:border-blue-500 rounded text-sm text-blue-300 hover:text-blue-400 flex items-center justify-start gap-2 transition-colors w-full cursor-pointer text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50 outline-none"
                    >
                        <Layers className="w-4 h-4 shrink-0" />
                        <span className="truncate font-semibold tracking-wide uppercase">
                            {neuronsRef.current.get(parentLayerId)?.label || 'Layer'}
                        </span>
                    </button>
                    <span className="text-[10px] text-slate-500 italic mt-0.5">Click to select the layer</span>
                </div>
            )}

            {synapses && selectedNode.type !== 'layer' && (
                <div className="flex flex-col gap-4 mt-2">
                    {selectedNode.type !== 'input' && (
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 pb-1">Pre-Synaptic (Inputs)</label>
                            {synapses.filter(s => s.postSynaptic.id === selectedNode.id).length > 0 ? (
                                <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                                    {synapses.filter(s => s.postSynaptic.id === selectedNode.id).sort((a, b) => {
                                        const orderA = typeOrder[a.preSynaptic.type] || 99;
                                        const orderB = typeOrder[b.preSynaptic.type] || 99;
                                        return orderA - orderB;
                                    }).map(s => (
                                        <div key={s.id} onClick={() => onSelectEdgeById?.(s.id)} className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-slate-700 transition-colors" title="Select Connection (Synapse)">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColorMap[s.preSynaptic.type] || 'text-slate-400'}`}>
                                                    {s.preSynaptic.type === 'mcculloch-pitts' ? 'McCulloch-Pitts' : s.preSynaptic.type}
                                                </span>
                                                {selectedNode.type !== 'mcculloch-pitts' && (
                                                    <span className="text-slate-500 font-mono text-[9px]">W: {s.weight}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-slate-200 font-medium truncate" title={s.preSynaptic.label}>{s.preSynaptic.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-500 italic">No incoming connections</span>
                            )}
                        </div>
                    )}

                    {selectedNode.type !== 'output' && (
                        <div className="flex flex-col gap-2 relative">
                            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 pb-1">Post-Synaptic (Outputs)</label>
                            {synapses.filter(s => s.preSynaptic.id === selectedNode.id).length > 0 ? (
                                <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                                    {synapses.filter(s => s.preSynaptic.id === selectedNode.id).sort((a, b) => {
                                        const orderA = typeOrder[a.postSynaptic.type] || 99;
                                        const orderB = typeOrder[b.postSynaptic.type] || 99;
                                        return orderA - orderB;
                                    }).map(s => (
                                        <div key={s.id} onClick={() => onSelectEdgeById?.(s.id)} className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-slate-700 transition-colors" title="Select Connection (Synapse)">
                                            <div className="flex justify-between items-center">
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${typeColorMap[s.postSynaptic.type] || 'text-slate-400'}`}>
                                                    {s.postSynaptic.type === 'mcculloch-pitts' ? 'McCulloch-Pitts' : s.postSynaptic.type}
                                                </span>
                                                {s.postSynaptic.type !== 'mcculloch-pitts' && s.postSynaptic.type !== 'output' && s.postSynaptic.type !== 'pixel-matrix' && (
                                                    <span className="text-slate-500 font-mono text-[9px]">W: {s.weight}</span>
                                                )}
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-slate-200 font-medium truncate" title={s.postSynaptic.label}>{s.postSynaptic.label}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-500 italic">No outgoing connections</span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
