import React from 'react';
import type { INeuron, ISynapse, NeuronPartialUpdate } from '../models/neural';

interface PropertiesPanelProps {
    selectedNode: INeuron | null;
    selectedEdge: ISynapse | null;
    onUpdateNeuron: (id: string, updates: NeuronPartialUpdate) => void;
    onUpdateSynapse: (id: string, updates: Partial<ISynapse>) => void;
    synapses?: ISynapse[];
    onSelectNodeById?: (id: string) => void;
    layerChildIds?: string[];
    neuronsRef?: React.MutableRefObject<Map<string, INeuron>>;
}

const NumberInput = ({ value, onChange, label, focusColor = "blue" }: { value: number, onChange: (val: number) => void, label: string, focusColor?: string }) => {
    const [strValue, setStrValue] = React.useState(value.toString());

    React.useEffect(() => {
        // Only update local string if it differs numerically to avoid overriding trailing dots or minus signs
        const parsed = parseFloat(strValue);
        if (isNaN(parsed) || parsed !== value) {
            setStrValue(value.toString());
        }
    }, [value]);

    return (
        <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</label>
            <input
                type="text"
                value={strValue}
                onChange={(e) => {
                    const val = e.target.value;
                    // Allow only empty, a single minus sign, or a valid float format
                    if (val === '' || val === '-' || /^-?\d*\.?\d*$/.test(val)) {
                        setStrValue(val);
                        const parsed = parseFloat(val);
                        if (!isNaN(parsed)) {
                            onChange(parsed);
                        } else if (val === '' || val === '-') {
                            onChange(0); // Default to 0 in the domain when empty or just a minus
                        }
                    }
                }}
                className={`px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-${focusColor}-500 transition-colors w-full`}
            />
        </div>
    );
};

// Use native number input for fields like Width/Height where stepper UI is desired
const NativeNumberInput = ({ value, onChange, label, focusColor = "pink", min = 1, max = 100 }: { value: number, onChange: (val: number) => void, label: string, focusColor?: string, min?: number, max?: number }) => {
    return (
        <div className="flex flex-col gap-1 mt-2">
            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{label}</label>
            <input
                type="number"
                min={min}
                max={max}
                value={value}
                onChange={(e) => {
                    const parsed = parseInt(e.target.value, 10);
                    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
                        onChange(parsed);
                    }
                }}
                className={`px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-slate-100 focus:outline-none focus:border-${focusColor}-500 transition-colors w-full`}
            />
        </div>
    );
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedNode,
    selectedEdge,
    onUpdateNeuron,
    onUpdateSynapse,
    synapses,
    onSelectNodeById,
    layerChildIds,
    neuronsRef,
}) => {
    if (!selectedNode && !selectedEdge) {
        return (
            <aside className="w-72 bg-slate-800 text-slate-100 p-6 flex flex-col gap-4 border-l border-slate-700 shadow-xl z-10 shrink-0 flex-1 overflow-y-auto overflow-x-hidden">
                <h2 className="text-xl font-bold text-slate-200">Properties</h2>
                <div className="text-sm text-slate-400 mt-10 text-center italic">
                    Select a neuron or connection to view its properties.
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-72 bg-slate-800 text-slate-100 p-6 flex flex-col gap-6 border-l border-slate-700 shadow-xl z-10 shrink-0 flex-1 overflow-y-auto overflow-x-hidden">
            <h2 className="text-xl font-bold text-slate-200 border-b border-slate-700 pb-2">Properties</h2>

            {selectedNode && (
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

                    {selectedNode.type === 'mcculloch-pitts' && (
                        <div className="flex flex-col gap-1 mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                            <h3 className="text-sm font-semibold text-blue-400 mb-1">Dica de Threshold</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                O Limiar (Threshold) deste neurônio não é mais um parâmetro fixo. Conecte outro neurônio à entrada amarela superior (Threshold) para definir dinamicamente o valor de ativação através do peso da sinapse.
                            </p>
                        </div>
                    )}

                    {selectedNode.type === 'input' && (
                        <NumberInput
                            label="Input Value"
                            value={typeof selectedNode.output === 'number' ? selectedNode.output : 0}
                            onChange={(val) => onUpdateNeuron(selectedNode.id, { output: val })}
                            focusColor="emerald"
                        />
                    )}

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

                    {selectedNode.type !== 'input' && selectedNode.type !== 'pixel-matrix' && selectedNode.type !== 'layer' && (
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
                                    {layerChildIds.map(id => {
                                        const n = neuronsRef.current.get(id);
                                        if (!n) return null;
                                        return (
                                            <div key={id} onClick={() => onSelectNodeById?.(id)} className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex justify-between items-center cursor-pointer hover:bg-slate-700 transition-colors">
                                                <span className="text-slate-300 font-medium truncate" title={n.label}>{n.label}</span>
                                                <span className="text-slate-500 font-mono text-[10px] capitalize">{n.type}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <span className="text-xs text-slate-500 italic">No neurons in this layer</span>
                            )}
                        </div>
                    )}

                    {synapses && selectedNode.type !== 'layer' && (
                        <div className="flex flex-col gap-4 mt-2">
                            {selectedNode.type !== 'input' && (
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-700 pb-1">Pre-Synaptic (Inputs)</label>
                                    {synapses.filter(s => s.postSynaptic.id === selectedNode.id).length > 0 ? (
                                        <div className="flex flex-col gap-2 max-h-32 overflow-y-auto pr-1">
                                            {synapses.filter(s => s.postSynaptic.id === selectedNode.id).map(s => (
                                                <div key={s.id} onClick={() => onSelectNodeById?.(s.preSynaptic.id)} className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-slate-700 transition-colors">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-300 font-medium truncate" title={s.preSynaptic.label}>{s.preSynaptic.label}</span>
                                                        <span className="text-slate-500 font-mono text-[10px]">W: {s.weight}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 flex justify-between">
                                                        <span>{s.sourceHandle ? `Src: ${s.sourceHandle}` : ''}</span>
                                                        <span>{s.targetHandle ? `Tgt: ${s.targetHandle}` : ''}</span>
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
                                            {synapses.filter(s => s.preSynaptic.id === selectedNode.id).map(s => (
                                                <div key={s.id} onClick={() => onSelectNodeById?.(s.postSynaptic.id)} className="text-xs bg-slate-900 border border-slate-700 p-2 rounded flex flex-col gap-1 cursor-pointer hover:bg-slate-700 transition-colors">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-slate-300 font-medium truncate" title={s.postSynaptic.label}>{s.postSynaptic.label}</span>
                                                        <span className="text-slate-500 font-mono text-[10px]">W: {s.weight}</span>
                                                    </div>
                                                    <div className="text-[10px] text-slate-500 flex justify-between">
                                                        <span>{s.sourceHandle ? `Src: ${s.sourceHandle}` : ''}</span>
                                                        <span>{s.targetHandle ? `Tgt: ${s.targetHandle}` : ''}</span>
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
            )}

            {selectedEdge && (
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

                    {selectedEdge.postSynaptic.type !== 'output' && selectedEdge.postSynaptic.type !== 'pixel-matrix' && (
                        <NumberInput
                            label="Weight"
                            value={selectedEdge.weight}
                            onChange={(val) => onUpdateSynapse(selectedEdge.id, { weight: val })}
                            focusColor="purple"
                        />
                    )}

                    {(selectedEdge.postSynaptic.type === 'output' || selectedEdge.postSynaptic.type === 'pixel-matrix') && (
                        <div className="flex flex-col gap-1 mt-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                            <h3 className="text-sm font-semibold text-orange-400 mb-1">Conexão de Saída</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Esta conexão funciona apenas para leitura de valor. Ela lê o que saiu do neurônio conectado sem calcular nenhum peso extra.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </aside>
    );
};
