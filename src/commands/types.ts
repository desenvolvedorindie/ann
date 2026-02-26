import type { Node, Edge } from '@xyflow/react';
import type { INeuron, ISynapse } from '../models/neural';
import * as React from 'react';

export interface CommandContext {
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    getNodes: () => Node[];
    getEdges: () => Edge[];
}

// Ensure layer nodes always come before their children in the array (React Flow requirement)
export function ensureParentOrder(nodes: Node[]): Node[] {
    const layers = nodes.filter(n => n.type === 'layerNode');
    const nonLayers = nodes.filter(n => n.type !== 'layerNode');
    return [...layers, ...nonLayers];
}

export interface ICommand {
    execute(): void;
    undo(): void;
    label: string;
}
