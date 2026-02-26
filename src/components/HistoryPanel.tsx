import React from 'react';
import { History, Undo2, Redo2 } from 'lucide-react';
import type { ICommand } from '../commands';

interface HistoryPanelProps {
    commands: ICommand[];
    pointer: number;
    onGoTo: (index: number) => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
    commands,
    pointer,
    onGoTo,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
}) => {
    const listRef = React.useRef<HTMLDivElement>(null);

    // Auto-scroll to current command
    React.useEffect(() => {
        if (listRef.current) {
            const activeItem = listRef.current.querySelector('[data-active="true"]');
            if (activeItem) {
                activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [pointer]);

    return (
        <div className="flex flex-col bg-slate-900 border-b border-slate-700">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Histórico</span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className={`p-1 rounded transition-all ${canUndo ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 cursor-not-allowed'}`}
                        title="Desfazer (Ctrl+Z)"
                    >
                        <Undo2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className={`p-1 rounded transition-all ${canRedo ? 'text-slate-300 hover:bg-slate-700 hover:text-white' : 'text-slate-600 cursor-not-allowed'}`}
                        title="Refazer (Ctrl+Y)"
                    >
                        <Redo2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Command List */}
            <div ref={listRef} className="overflow-y-auto max-h-40">
                {/* Initial state entry */}
                <button
                    onClick={() => onGoTo(-1)}
                    data-active={pointer === -1 ? 'true' : 'false'}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 border-b border-slate-800 transition-all ${pointer === -1
                        ? 'bg-blue-600/20 text-blue-300 font-semibold'
                        : 'text-slate-500 hover:bg-slate-800'
                        }`}
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                    Estado Inicial
                </button>

                {commands.map((cmd, index) => {
                    const isActive = index === pointer;
                    const isAbovePointer = index <= pointer;

                    return (
                        <button
                            key={index}
                            onClick={() => onGoTo(index)}
                            data-active={isActive ? 'true' : 'false'}
                            className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 border-b border-slate-800 transition-all ${isActive
                                ? 'bg-blue-600/20 text-blue-300 font-semibold'
                                : isAbovePointer
                                    ? 'text-slate-300 hover:bg-slate-800'
                                    : 'text-slate-600 hover:bg-slate-800/50'
                                }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isActive ? 'bg-blue-400' : isAbovePointer ? 'bg-slate-500' : 'bg-slate-700'
                                }`} />
                            <span className="truncate">{cmd.label}</span>
                        </button>
                    );
                })}

                {commands.length === 0 && (
                    <div className="px-3 py-4 text-xs text-slate-600 text-center italic">
                        Nenhuma ação ainda
                    </div>
                )}
            </div>
        </div>
    );
};
