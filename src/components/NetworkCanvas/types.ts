import type { Node } from '@xyflow/react';
import type { INeuron, ISynapse, NeuronType } from '../../models/neural';
import type { ICommand } from '../../commands';
export type NeuronNodeData = Record<string, unknown> & {
    neuron: INeuron;
    selected?: boolean;
    tick?: number;
};
import type { PixelMatrixNodeData } from '../nodes/PixelMatrixNode';
import type { LayerNodeData } from '../nodes/LayerNode';

export type NeuralNodeData = NeuronNodeData | PixelMatrixNodeData | LayerNodeData;

export interface HistoryState {
    commands: ICommand[];
    pointer: number;
    goTo: (index: number) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    version: number;
}

export type NetworkCanvasRef = {
    alignNodes: (alignment: 'vertical-center' | 'horizontal-center' | 'distribute-vertical' | 'distribute-horizontal', selectedIds: string[]) => void;
    selectNode: (id: string | null) => void;
    selectEdge: (id: string | null) => void;
    selectAll: () => void;
    invertSelection: () => void;
};

export interface NetworkCanvasProps {
    onSelectNode: (neuron: INeuron | null, layerChildIds?: string[], parentLayerId?: string) => void;
    onSelectEdge: (synapse: ISynapse | null) => void;
    onSelectedNodesChange: (nodeIds: string[]) => void;
    onHistoryChange: (history: HistoryState) => void;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    tick: number;
    showRawConnections: boolean;
    showMatrixHandles: boolean;
    toolMode: 'pan' | 'select';
    onSetToolMode: (mode: 'pan' | 'select') => void;
    workspace: 'data' | 'build' | 'train' | 'execute';
    selectedEdgeId: string | null;
}

export interface CopiedNode {
    node: Node<NeuralNodeData>;
    type: NeuronType | 'layer';
}
