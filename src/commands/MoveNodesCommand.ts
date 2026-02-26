import { ensureParentOrder, type CommandContext, type ICommand } from './types';

// ─── Move Nodes ────────────────────────────────────────────────────────────
export class MoveNodesCommand implements ICommand {
    label: string;
    private ctx: CommandContext;
    private oldPositions: Map<string, { x: number; y: number; parentId?: string }>;
    private newPositions: Map<string, { x: number; y: number; parentId?: string }>;

    constructor(
        ctx: CommandContext,
        oldPositions: Map<string, { x: number; y: number; parentId?: string }>,
        newPositions: Map<string, { x: number; y: number; parentId?: string }>,
        label?: string,
    ) {
        this.ctx = ctx;
        this.oldPositions = new Map(oldPositions);
        this.newPositions = new Map(newPositions);
        this.label = label || `Mover ${oldPositions.size} nó(s)`;
    }

    execute(): void {
        this.ctx.setNodes(nds => ensureParentOrder(nds.map(n => {
            const pos = this.newPositions.get(n.id);
            if (pos) return { ...n, position: { x: pos.x, y: pos.y }, parentId: pos.parentId };
            return n;
        })));
    }

    undo(): void {
        this.ctx.setNodes(nds => ensureParentOrder(nds.map(n => {
            const pos = this.oldPositions.get(n.id);
            if (pos) return { ...n, position: { x: pos.x, y: pos.y }, parentId: pos.parentId };
            return n;
        })));
    }
}
