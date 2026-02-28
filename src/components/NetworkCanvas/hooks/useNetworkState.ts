import { useState, useRef, useMemo, useCallback } from 'react';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Node, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import { useCommandHistory } from '../../../hooks/useCommandHistory';
import { DeleteNodesCommand, DeleteEdgesCommand } from '../../../commands';
import type { CommandContext } from '../../../commands';
import type { NeuralNodeData, NetworkCanvasProps } from '../types';

export function useNetworkState(props: Pick<NetworkCanvasProps, 'neuronsRef' | 'synapsesRef'>) {
    const { neuronsRef, synapsesRef } = props;

    const [nodes, setNodes] = useState<Node<NeuralNodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);

    const isDraggingNodesRef = useRef(false);

    // Command history
    const history = useCommandHistory();
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;
    const edgesRef = useRef(edges);
    edgesRef.current = edges;

    const cmdCtx: CommandContext = useMemo(() => ({
        setNodes: setNodes as React.Dispatch<React.SetStateAction<Node[]>>,
        setEdges,
        neuronsRef,
        synapsesRef,
        getNodes: () => nodesRef.current as Node[],
        getEdges: () => edgesRef.current,
    }), [neuronsRef, synapsesRef]);

    const ndsRef = nodesRef;

    const onNodesChangeHandler = useCallback(
        (changes: NodeChange[]) => {
            const removeChanges = changes.filter(c => c.type === 'remove');
            if (removeChanges.length > 0) {
                const nodeIds = removeChanges.map(c => (c as any).id as string);
                const cmd = new DeleteNodesCommand(cmdCtx, nodeIds);
                history.push(cmd);
                // Also apply non-remove changes
                const otherChanges = changes.filter(c => c.type !== 'remove');
                if (otherChanges.length > 0) {
                    const filteredOtherChanges = otherChanges.map(change => {
                        if (change.type === 'dimensions' && change.dimensions) {
                            const targetNode = ndsRef.current.find(n => n.id === change.id);
                            if (targetNode && targetNode.type === 'layerNode') {
                                return { ...change, dimensions: { ...change.dimensions, width: 240 } };
                            }
                        }
                        return change;
                    });
                    setNodes((nds) => applyNodeChanges(filteredOtherChanges, nds) as Node<NeuralNodeData>[]);
                }
                return;
            }
            // Prevent React Flow from automatically expanding layer width when dragging children
            const filteredChanges = changes.map(change => {
                if (change.type === 'dimensions' && change.dimensions) {
                    const targetNode = ndsRef.current.find(n => n.id === change.id);
                    if (targetNode && targetNode.type === 'layerNode') {
                        // Force width to remain 240, don't allow React Flow to naturally widen it
                        return {
                            ...change,
                            dimensions: {
                                ...change.dimensions,
                                width: 240
                            }
                        };
                    }
                }
                return change;
            });

            setNodes((nds) => applyNodeChanges(filteredChanges, nds) as Node<NeuralNodeData>[]);
        },
        [cmdCtx, history]
    );

    const onEdgesChangeHandler = useCallback(
        (changes: EdgeChange[]) => {
            const removeChanges = changes.filter(c => c.type === 'remove');
            if (removeChanges.length > 0) {
                const edgeIds = removeChanges.map(c => (c as any).id as string);
                const cmd = new DeleteEdgesCommand(cmdCtx, edgeIds);
                history.push(cmd);
                const otherChanges = changes.filter(c => c.type !== 'remove');
                if (otherChanges.length > 0) {
                    setEdges((eds) => applyEdgeChanges(otherChanges, eds) as Edge[]);
                }
                return;
            }
            setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]);
        },
        [cmdCtx, history]
    );

    return {
        nodes,
        setNodes,
        nodesRef,
        edges,
        setEdges,
        edgesRef,
        history,
        cmdCtx,
        isDraggingNodesRef,
        onNodesChangeHandler,
        onEdgesChangeHandler
    };
}
