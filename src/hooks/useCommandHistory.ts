import { useRef, useCallback, useEffect, useState } from 'react';
import type { ICommand } from '../commands';

const MAX_HISTORY = 50;

export function useCommandHistory() {
    const commandsRef = useRef<ICommand[]>([]);
    const pointerRef = useRef<number>(-1);
    const [version, setVersion] = useState(0); // triggers re-renders for UI

    const push = useCallback((cmd: ICommand) => {
        // Trim any redo history beyond current pointer
        commandsRef.current = commandsRef.current.slice(0, pointerRef.current + 1);

        // Execute the command
        cmd.execute();

        // Add to stack
        commandsRef.current.push(cmd);

        // Cap history size
        if (commandsRef.current.length > MAX_HISTORY) {
            commandsRef.current = commandsRef.current.slice(commandsRef.current.length - MAX_HISTORY);
        }

        pointerRef.current = commandsRef.current.length - 1;
        setVersion(v => v + 1);
    }, []);

    const undo = useCallback(() => {
        if (pointerRef.current < 0) return;
        commandsRef.current[pointerRef.current].undo();
        pointerRef.current--;
        setVersion(v => v + 1);
    }, []);

    const redo = useCallback(() => {
        if (pointerRef.current >= commandsRef.current.length - 1) return;
        pointerRef.current++;
        commandsRef.current[pointerRef.current].execute();
        setVersion(v => v + 1);
    }, []);

    const goTo = useCallback((targetIndex: number) => {
        if (targetIndex < -1 || targetIndex >= commandsRef.current.length) return;

        // Going backward — undo commands from current down to target+1
        while (pointerRef.current > targetIndex) {
            commandsRef.current[pointerRef.current].undo();
            pointerRef.current--;
        }

        // Going forward — execute commands from current+1 up to target
        while (pointerRef.current < targetIndex) {
            pointerRef.current++;
            commandsRef.current[pointerRef.current].execute();
        }

        setVersion(v => v + 1);
    }, []);

    const canUndo = pointerRef.current >= 0;
    const canRedo = pointerRef.current < commandsRef.current.length - 1;
    const commands = commandsRef.current;
    const pointer = pointerRef.current;

    // Keyboard listener
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const pushWithoutExecute = useCallback((cmd: ICommand) => {
        commandsRef.current = commandsRef.current.slice(0, pointerRef.current + 1);
        commandsRef.current.push(cmd);
        if (commandsRef.current.length > MAX_HISTORY) {
            commandsRef.current = commandsRef.current.slice(commandsRef.current.length - MAX_HISTORY);
        }
        pointerRef.current = commandsRef.current.length - 1;
        setVersion(v => v + 1);
    }, []);

    return { push, pushWithoutExecute, undo, redo, goTo, canUndo, canRedo, commands, pointer, version };
}
