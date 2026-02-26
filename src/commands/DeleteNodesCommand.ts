import type { Edge, Node } from '@xyflow/react';
import type { INeuron, ISynapse } from '../models/neural';
import { ensureParentOrder, type CommandContext, type ICommand } from './types';

// ─── Delete Node(s) ────────────────────────────────────────────────────────
export class DeleteNodesCommand implements ICommand {
    label: string;
    private ctx: CommandContext;
    private deletedNodes: Node[] = [];
    private deletedEdges: Edge[] = [];
    private deletedNeurons: Map<string, INeuron> = new Map();
    private deletedSynapses: Map<string, ISynapse> = new Map();
    private nodeIds: Set<string>;

    constructor(ctx: CommandContext, nodeIds: string[]) {
        this.ctx = ctx;
        this.nodeIds = new Set(nodeIds);
        this.label = `Excluir ${nodeIds.length} nó(s)`;

        // Capture the state before deletion
        const currentNodes = ctx.getNodes();
        const currentEdges = ctx.getEdges();

        this.deletedNodes = currentNodes.filter(n => this.nodeIds.has(n.id)).map(n => ({ ...n }));
        this.deletedEdges = currentEdges.filter(e =>
            this.nodeIds.has(e.source) || this.nodeIds.has(e.target)
        ).map(e => ({ ...e }));

        nodeIds.forEach(id => {
            const neuron = ctx.neuronsRef.current.get(id);
            if (neuron) this.deletedNeurons.set(id, neuron);
        });

        this.deletedEdges.forEach(e => {
            const synapse = ctx.synapsesRef.current.get(e.id);
            if (synapse) this.deletedSynapses.set(e.id, synapse);
        });
    }

    execute(): void {
        this.deletedNeurons.forEach((_, id) => this.ctx.neuronsRef.current.delete(id));
        this.deletedSynapses.forEach((_, id) => this.ctx.synapsesRef.current.delete(id));
        this.ctx.setNodes(nds => nds.filter(n => !this.nodeIds.has(n.id)));
        const edgeIds = new Set(this.deletedEdges.map(e => e.id));
        this.ctx.setEdges(eds => eds.filter(e => !edgeIds.has(e.id)));
    }

    undo(): void {
        this.deletedNeurons.forEach((neuron, id) => this.ctx.neuronsRef.current.set(id, neuron));
        this.deletedSynapses.forEach((synapse, id) => this.ctx.synapsesRef.current.set(id, synapse));
        this.ctx.setNodes(nds => ensureParentOrder([...nds, ...this.deletedNodes]));
        this.ctx.setEdges(eds => [...eds, ...this.deletedEdges]);
    }
}
