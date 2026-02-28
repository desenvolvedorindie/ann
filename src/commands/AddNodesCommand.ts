import type { Node } from '@xyflow/react';
import type { INeuron } from '../models/neural';
import { ensureParentOrder, type CommandContext, type ICommand } from './types';

// ─── Add Node(s) ───────────────────────────────────────────────────────────
export class AddNodesCommand implements ICommand {
    label: string;
    private ctx: CommandContext;
    private nodes: Node[];
    private neurons: Map<string, INeuron>;

    constructor(ctx: CommandContext, nodes: Node[], neurons: Map<string, INeuron>, label?: string) {
        this.ctx = ctx;
        this.nodes = nodes.map(n => ({ ...n }));
        this.neurons = new Map(neurons);
        this.label = label || `Add ${nodes.length} node(s)`;
    }

    execute(): void {
        this.neurons.forEach((neuron, id) => this.ctx.neuronsRef.current.set(id, neuron));
        const hasSelected = this.nodes.some(n => n.selected);
        this.ctx.setNodes(nds => {
            // If any new node is selected, deselect all existing ones atomically
            const base = hasSelected ? nds.map(n => ({ ...n, selected: false })) : nds;
            return ensureParentOrder([...base, ...this.nodes]);
        });
    }

    undo(): void {
        const nodeIds = new Set(this.nodes.map(n => n.id));
        this.neurons.forEach((_, id) => this.ctx.neuronsRef.current.delete(id));
        this.ctx.setNodes(nds => nds.filter(n => !nodeIds.has(n.id)));
    }
}
