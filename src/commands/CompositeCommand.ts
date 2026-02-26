import type { ICommand } from './types';

// ─── Composite Command (groups multiple commands as one entry) ──────────────
export class CompositeCommand implements ICommand {
    label: string;
    private commands: ICommand[];

    constructor(label: string, commands: ICommand[]) {
        this.label = label;
        this.commands = commands;
    }

    execute(): void {
        this.commands.forEach(cmd => cmd.execute());
    }

    undo(): void {
        // Undo in reverse order
        for (let i = this.commands.length - 1; i >= 0; i--) {
            this.commands[i].undo();
        }
    }
}
