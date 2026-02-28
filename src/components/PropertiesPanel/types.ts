import type { INeuron, ISynapse, NeuronPartialUpdate } from '../../models/neural';

export interface PropertiesPanelProps {
    selectedNode: INeuron | null;
    selectedEdge: ISynapse | null;
    onUpdateNeuron: (id: string, updates: NeuronPartialUpdate) => void;
    onUpdateSynapse: (id: string, updates: Partial<ISynapse>) => void;
    synapses?: ISynapse[];
    onSelectNodeById?: (id: string) => void;
    onSelectEdgeById?: (id: string) => void;
    layerChildIds?: string[];
    parentLayerId?: string;
    neuronsRef?: React.MutableRefObject<Map<string, INeuron>>;
}
