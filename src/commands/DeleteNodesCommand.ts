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
        this.label = `Delete ${nodeIds.length} node(s)`;

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
        const affectedLayerIds = new Set<string>();
        this.deletedNodes.forEach(n => {
            if (n.parentId) affectedLayerIds.add(n.parentId);
        });

        this.ctx.setNodes(nds => {
            let nextNodes = nds.filter(n => !this.nodeIds.has(n.id));

            // Repack affected layers
            affectedLayerIds.forEach(layerId => {
                const layerNodeIndex = nextNodes.findIndex(n => n.id === layerId);
                const layerNode = nextNodes[layerNodeIndex];
                if (!layerNode) return;

                const children = nextNodes.filter(n => n.parentId === layerId);
                children.sort((a, b) => a.position.y - b.position.y);

                const startY = 40;
                const gap = 15;
                const dropX = 30;

                let currentY = startY;

                children.forEach((child) => {
                    const childIndex = nextNodes.findIndex(n => n.id === child.id);
                    if (childIndex > -1) {
                        nextNodes[childIndex] = {
                            ...nextNodes[childIndex],
                            position: { x: dropX, y: currentY }
                        };
                        const childHeight = (nextNodes[childIndex].measured?.height) || (nextNodes[childIndex].style?.height as number) || 80;
                        currentY += childHeight + gap;
                    }
                });

                const minLayerHeight = 180;
                const neededHeight = Math.max(minLayerHeight, currentY + 20);

                nextNodes[layerNodeIndex] = {
                    ...layerNode,
                    style: {
                        ...layerNode.style as object,
                        width: 240, // Fixed width
                        height: neededHeight
                    }
                };
            });

            return nextNodes;
        });

        const edgeIds = new Set(this.deletedEdges.map(e => e.id));
        this.ctx.setEdges(eds => eds.filter(e => !edgeIds.has(e.id)));
    }

    undo(): void {
        this.deletedNeurons.forEach((neuron, id) => this.ctx.neuronsRef.current.set(id, neuron));
        this.deletedSynapses.forEach((synapse, id) => this.ctx.synapsesRef.current.set(id, synapse));
        this.ctx.setNodes(nds => {
            let nextNodes = ensureParentOrder([...nds, ...this.deletedNodes]);

            const affectedLayerIds = new Set<string>();
            this.deletedNodes.forEach(n => {
                if (n.parentId) affectedLayerIds.add(n.parentId);
            });

            // Repack affected layers on undo to restore correct spacing
            affectedLayerIds.forEach(layerId => {
                const layerNodeIndex = nextNodes.findIndex(n => n.id === layerId);
                const layerNode = nextNodes[layerNodeIndex];
                if (!layerNode) return;

                const children = nextNodes.filter(n => n.parentId === layerId);
                children.sort((a, b) => a.position.y - b.position.y);

                const startY = 40;
                const gap = 15;
                const dropX = 30;

                let currentY = startY;

                children.forEach((child) => {
                    const childIndex = nextNodes.findIndex(n => n.id === child.id);
                    if (childIndex > -1) {
                        nextNodes[childIndex] = {
                            ...nextNodes[childIndex],
                            position: { x: dropX, y: currentY }
                        };
                        const childHeight = (nextNodes[childIndex].measured?.height) || (nextNodes[childIndex].style?.height as number) || 80;
                        currentY += childHeight + gap;
                    }
                });

                const minLayerHeight = 180;
                const neededHeight = Math.max(minLayerHeight, currentY + 20);

                nextNodes[layerNodeIndex] = {
                    ...layerNode,
                    style: {
                        ...layerNode.style as object,
                        width: 240, // Fixed width
                        height: neededHeight
                    }
                };


            });

            return nextNodes;
        });
        this.ctx.setEdges(eds => [...eds, ...this.deletedEdges]);
    }
}
