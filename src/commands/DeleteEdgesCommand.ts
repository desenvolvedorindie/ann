import type { Edge } from '@xyflow/react';
import type { ISynapse } from '../models/neural';
import type { CommandContext, ICommand } from './types';

// ─── Delete Edge(s) ────────────────────────────────────────────────────────
export class DeleteEdgesCommand implements ICommand {
    label: string;
    private ctx: CommandContext;
    private deletedEdges: Edge[] = [];
    private deletedSynapses: Map<string, ISynapse> = new Map();

    constructor(ctx: CommandContext, edgeIds: string[]) {
        this.ctx = ctx;
        this.label = `Desconectar ${edgeIds.length} sinapse(s)`;

        const edgeIdSet = new Set(edgeIds);
        const currentEdges = ctx.getEdges();

        // Resolve virtual edges into physical edges
        const virtualEdgesToResolve = edgeIds.filter(id => id.startsWith('virtual-'));
        if (virtualEdgesToResolve.length > 0) {
            const currentNodes = ctx.getNodes();
            virtualEdgesToResolve.forEach(vId => {
                const parts = vId.replace('virtual-', '').split('__');
                if (parts.length === 2) {
                    const srcLayerId = parts[0];
                    const tgtLayerId = parts[1];

                    const srcChildIds = new Set(currentNodes.filter(n => n.parentId === srcLayerId).map(n => n.id));
                    const tgtChildIds = new Set(currentNodes.filter(n => n.parentId === tgtLayerId).map(n => n.id));

                    currentEdges.forEach(e => {
                        if (srcChildIds.has(e.source) && tgtChildIds.has(e.target)) {
                            edgeIdSet.add(e.id);
                        }
                    });
                }
            });
        }

        this.deletedEdges = currentEdges.filter(e => edgeIdSet.has(e.id)).map(e => ({ ...e }));
        this.deletedEdges.forEach(e => {
            const syn = ctx.synapsesRef.current.get(e.id);
            if (syn) this.deletedSynapses.set(e.id, syn);
        });
    }

    execute(): void {
        const edgeIds = new Set(this.deletedEdges.map(e => e.id));
        this.deletedSynapses.forEach((_, id) => this.ctx.synapsesRef.current.delete(id));
        this.ctx.setEdges(eds => eds.filter(e => !edgeIds.has(e.id)));
    }

    undo(): void {
        this.deletedSynapses.forEach((syn, id) => this.ctx.synapsesRef.current.set(id, syn));
        this.ctx.setEdges(eds => [...eds, ...this.deletedEdges]);
    }
}
