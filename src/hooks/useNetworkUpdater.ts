import { useCallback } from 'react';
import type { INeuron, ISynapse, NeuronPartialUpdate } from '../models/neural';

export function useNetworkUpdater(props: {
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    selectedNodeIds: string[];
    setTick: React.Dispatch<React.SetStateAction<number>>;
    setSelectedNode: (node: INeuron | null) => void;
    setSelectedEdge: (edge: ISynapse | null) => void;
}) {
    const { neuronsRef, synapsesRef, selectedNodeIds, setTick, setSelectedNode, setSelectedEdge } = props;

    const onUpdateNeuron = useCallback((id: string, updates: NeuronPartialUpdate) => {
        const isSelected = selectedNodeIds.includes(id);
        const targetIds = isSelected && selectedNodeIds.length > 0 ? selectedNodeIds : [id];

        let baseLabel = '';
        let startNumber = 1;
        let hasNumberSuffix = false;

        if (updates.label !== undefined) {
            const match = updates.label.match(/^(.*?)(\d+)$/);
            if (match) {
                baseLabel = match[1];
                startNumber = parseInt(match[2], 10);
                hasNumberSuffix = true;
            }
        }

        let changed = false;

        targetIds.forEach((targetId, index) => {
            const neuron = neuronsRef.current.get(targetId);
            if (neuron) {
                if (updates.label !== undefined) {
                    if (hasNumberSuffix) {
                        neuron.label = `${baseLabel}${startNumber + index}`;
                    } else {
                        neuron.label = updates.label;
                    }
                }
                if (updates.output !== undefined && neuron.type === 'input') {
                    neuron.output = updates.output;
                }
                if (updates.bias !== undefined && neuron.type === 'mcculloch-pitts') {
                    (neuron as any).bias = updates.bias;
                }
                if (neuron.type === 'pixel-matrix') {
                    let resized = false;
                    const matrix = neuron as any;
                    if (updates.width !== undefined && updates.width !== matrix.width) {
                        matrix.width = updates.width;
                        resized = true;
                    }
                    if (updates.height !== undefined && updates.height !== matrix.height) {
                        matrix.height = updates.height;
                        resized = true;
                    }
                    if (resized) {
                        matrix.output = new Array(matrix.width * matrix.height).fill(0);
                    }
                }
                if (neuron.type === 'tensor') {
                    const tensor = neuron as any;
                    if (updates.order !== undefined && updates.order !== tensor.order) {
                        tensor.setOrder(updates.order);
                        changed = true;
                    } else if (updates.shape !== undefined) {
                        tensor.setShape(updates.shape);
                        changed = true;
                    } else if (updates.output !== undefined) {
                        tensor.output = Array.isArray(updates.output) ? [...updates.output] : [updates.output];
                        changed = true;
                    }
                }

                if ((neuron.type as string).startsWith('tensor-')) {
                    const opNode = neuron as any;
                    if ((updates as any).operationType !== undefined) opNode.operationType = (updates as any).operationType;
                    if ((updates as any).axis !== undefined) opNode.axis = (updates as any).axis;
                    if ((updates as any).targetShape !== undefined) opNode.targetShape = (updates as any).targetShape;
                }

                changed = true;

                if (targetId === id) {
                    const clonedNeuron = Object.assign(Object.create(Object.getPrototypeOf(neuron)), neuron);
                    setSelectedNode(clonedNeuron);
                }
            }
        });

        if (changed) {
            setTick(t => t + 1);
        }
    }, [neuronsRef, selectedNodeIds, setTick, setSelectedNode]);

    const onUpdateSynapse = useCallback((id: string, updates: Partial<ISynapse>) => {
        const synapse = synapsesRef.current.get(id);
        if (synapse) {
            if (updates.weight !== undefined) synapse.weight = updates.weight;
            setSelectedEdge({ ...synapse } as ISynapse);
            setTick(t => t + 1);
        }
    }, [synapsesRef, setTick, setSelectedEdge]);

    return { onUpdateNeuron, onUpdateSynapse };
}
