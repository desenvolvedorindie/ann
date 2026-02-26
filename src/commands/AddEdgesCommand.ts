import type { Edge } from '@xyflow/react';
import type { ISynapse } from '../models/neural';
import type { CommandContext, ICommand } from './types';

// ─── Add Edge(s) ───────────────────────────────────────────────────────────
export class AddEdgesCommand implements ICommand {
    label: string;
    private ctx: CommandContext;
    private edges: Edge[];
    private synapses: Map<string, ISynapse>;

    constructor(ctx: CommandContext, edges: Edge[], synapses: Map<string, ISynapse>, label?: string) {
        this.ctx = ctx;
        this.edges = edges.map(e => ({ ...e }));
        this.synapses = new Map(synapses);
        this.label = label || `Conectar ${edges.length} sinapse(s)`;
    }

    execute(): void {
        this.synapses.forEach((syn, id) => this.ctx.synapsesRef.current.set(id, syn));
        this.ctx.setEdges(eds => [...eds, ...this.edges]);
    }

    undo(): void {
        const edgeIds = new Set(this.edges.map(e => e.id));
        this.synapses.forEach((_, id) => this.ctx.synapsesRef.current.delete(id));
        this.ctx.setEdges(eds => eds.filter(e => !edgeIds.has(e.id)));
    }
}
