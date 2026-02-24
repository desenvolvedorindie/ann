import React from 'react';
import type { INeuron, ISynapse } from '../models/neural';

interface PropertiesPanelProps {
    selectedNode: INeuron | null;
    selectedEdge: ISynapse | null;
    onUpdateNeuron: (id: string, updates: Partial<INeuron>) => void;
    onUpdateSynapse: (id: string, updates: Partial<ISynapse>) => void;
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

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
    selectedNode,
    selectedEdge,
    onUpdateNeuron,
    onUpdateSynapse,
}) => {
    if (!selectedNode && !selectedEdge) {
        return (
            <aside className="w-72 bg-slate-800 text-slate-100 p-6 flex flex-col gap-4 border-l border-slate-700 shadow-xl z-10 shrink-0">
                <h2 className="text-xl font-bold text-slate-200">Properties</h2>
                <div className="text-sm text-slate-400 mt-10 text-center italic">
                    Select a neuron or connection to view its properties.
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-72 bg-slate-800 text-slate-100 p-6 flex flex-col gap-6 border-l border-slate-700 shadow-xl z-10 shrink-0 overflow-y-auto">
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
                            value={selectedNode.output}
                            onChange={(val) => onUpdateNeuron(selectedNode.id, { output: val })}
                            focusColor="emerald"
                        />
                    )}

                    {selectedNode.type !== 'input' && (
                        <div className="flex flex-col gap-1 mt-2">
                            <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Output</label>
                            <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-300 font-mono">
                                {selectedNode.output}
                            </div>
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

                    {selectedEdge.targetHandle !== 'bias' && (
                        <NumberInput
                            label="Weight"
                            value={selectedEdge.weight}
                            onChange={(val) => onUpdateSynapse(selectedEdge.id, { weight: val })}
                            focusColor="purple"
                        />
                    )}

                    {selectedEdge.targetHandle === 'bias' && (
                        <div className="flex flex-col gap-1 mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                            <h3 className="text-sm font-semibold text-yellow-400 mb-1">Sinapse de Limiar</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Esta conexão não suporta peso matemático. O valor na saída do neurônio será transmitido diretamente (1:1) como valor limiar (threshold).
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col gap-1 mt-2">
                        <label className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Connection Point</label>
                        <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-400 flex flex-col gap-1">
                            <span>{`Pre : ${selectedEdge.preSynaptic.label}`}</span>
                            <span>{`Post: ${selectedEdge.postSynaptic.label}`}</span>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
};
