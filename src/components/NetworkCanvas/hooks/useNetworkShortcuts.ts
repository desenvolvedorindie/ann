import { useEffect, useRef, useState } from 'react';
import type { Node } from '@xyflow/react';
import { AddNodesCommand } from '../../../commands';
import type { INeuron, NeuronType } from '../../../models/neural';
import type { NeuralNodeData, NetworkCanvasProps, CopiedNode } from '../types';

export function useNetworkShortcuts(props: {
    workspace: NetworkCanvasProps['workspace'];
    nodesRef: React.MutableRefObject<Node<NeuralNodeData>[]>;
    reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
    cmdCtx: any;
    history: any;
    instantiateNode: (type: NeuronType | 'layer', position: { x: number, y: number }) => { node: Node<NeuralNodeData>, neuron: INeuron };
}) {
    const { workspace, nodesRef, reactFlowWrapper, cmdCtx, history, instantiateNode } = props;
    const [isTempPanning, setIsTempPanning] = useState(false);

    // Copy / Paste State
    const copiedNodesRef = useRef<CopiedNode[]>([]);
    const pasteCountRef = useRef<number>(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) setIsTempPanning(true);

            // Handle Copy
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                const selected = nodesRef.current.filter(n => n.selected);
                if (selected.length > 0) {
                    copiedNodesRef.current = selected.map(n => {
                        const isLayer = n.type === 'layerNode';
                        const type = isLayer ? 'layer' : ((n.data as any)?.neuron?.type || 'm-pitts');
                        return { node: n, type };
                    });
                    pasteCountRef.current = 0; // Reset offset counter on new copy
                }
            }

            // Handle Paste
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                if (copiedNodesRef.current.length > 0 && workspace === 'build') {
                    const newNodesList: Node<NeuralNodeData>[] = [];
                    const newNeuronsMap = new Map<string, INeuron>();

                    pasteCountRef.current += 1;
                    const offsetMultiplier = pasteCountRef.current;

                    copiedNodesRef.current.forEach(copied => {
                        const offset = 40 * offsetMultiplier; // Offset cascata cumulativo
                        const newPos = { x: copied.node.position.x + offset, y: copied.node.position.y + offset };

                        // Recreates the neuron with the same type and position
                        const { node: newNode, neuron: newNeuron } = instantiateNode(copied.type as NeuronType | 'layer', newPos);

                        // Preserve some visual styling if it was a layer
                        if (newNode.type === 'layerNode') {
                            newNode.style = { ...copied.node.style };
                        }

                        // Select the new node automatically
                        newNode.selected = true;

                        newNodesList.push(newNode);
                        newNeuronsMap.set(newNode.id, newNeuron);
                    });

                    if (newNodesList.length > 0) {
                        const cmd = new AddNodesCommand(cmdCtx, newNodesList, newNeuronsMap, `Paste ${newNodesList.length} node(s)`);
                        history.push(cmd);

                        // Force focus back to canvas so the selection is visually rendered by React Flow
                        setTimeout(() => reactFlowWrapper.current?.focus(), 50);
                    }
                }
            }
        };
        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code === 'Space') setIsTempPanning(false);
        };
        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 1) setIsTempPanning(true); // Middle click
        };
        const handleMouseUp = (e: MouseEvent) => {
            if (e.button === 1) setIsTempPanning(false);
        };

        window.addEventListener('keydown', handleKeyDown, { capture: true });
        window.addEventListener('keyup', handleKeyUp, { capture: true });
        window.addEventListener('mousedown', handleMouseDown, { capture: true });
        window.addEventListener('mouseup', handleMouseUp, { capture: true });

        return () => {
            window.removeEventListener('keydown', handleKeyDown, { capture: true });
            window.removeEventListener('keyup', handleKeyUp, { capture: true });
            window.removeEventListener('mousedown', handleMouseDown, { capture: true });
            window.removeEventListener('mouseup', handleMouseUp, { capture: true });
        };
    }, [workspace, instantiateNode, cmdCtx, history, nodesRef, reactFlowWrapper]);

    return { isTempPanning, setIsTempPanning };
}
