import type { CommandContext, ICommand } from './types';

// ─── Resize Layer (for undo after reparent) ─────────────────────────────────
export class ResizeLayersCommand implements ICommand {
    label: string;
    private ctx: CommandContext;
    private oldStyles: Map<string, Record<string, unknown>>;
    private newStyles: Map<string, Record<string, unknown>>;

    constructor(
        ctx: CommandContext,
        oldStyles: Map<string, Record<string, unknown>>,
        newStyles: Map<string, Record<string, unknown>>,
    ) {
        this.ctx = ctx;
        this.oldStyles = new Map(oldStyles);
        this.newStyles = new Map(newStyles);
        this.label = 'Redimensionar layer(s)';
    }

    execute(): void {
        this.ctx.setNodes(nds => nds.map(n => {
            const style = this.newStyles.get(n.id);
            if (style) return { ...n, style: { ...n.style, ...style } };
            return n;
        }));
    }

    undo(): void {
        this.ctx.setNodes(nds => nds.map(n => {
            const style = this.oldStyles.get(n.id);
            if (style) return { ...n, style: { ...n.style, ...style } };
            return n;
        }));
    }
}
