import { useImperativeHandle } from 'react';
import type { Node } from '@xyflow/react';
import { MoveNodesCommand } from '../../../commands';
import type { NeuralNodeData, NetworkCanvasRef } from '../types';

export function useNetworkAlignment(props: {
    ref: React.ForwardedRef<NetworkCanvasRef>;
    setNodes: React.Dispatch<React.SetStateAction<Node<NeuralNodeData>[]>>;
    setEdges: React.Dispatch<React.SetStateAction<any[]>>;
    nodesRef: React.MutableRefObject<Node<NeuralNodeData>[]>;
    reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
    cmdCtx: any;
    history: any;
}) {
    const { ref, setNodes, setEdges, nodesRef, reactFlowWrapper, cmdCtx, history } = props;

    useImperativeHandle(ref, () => ({
        selectNode: (id: string | null) => {
            if (!id) {
                setNodes(nds => nds.map(n => ({ ...n, selected: false })));
                setEdges(eds => eds.map(e => ({ ...e, selected: false })));
            } else {
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === id })));
                setEdges(eds => eds.map(e => ({ ...e, selected: false })));

                // Keep the canvas focused so that keyboard shortcuts keep working immediately
                setTimeout(() => reactFlowWrapper.current?.focus(), 50);
            }
        },
        selectEdge: (id: string | null) => {
            if (!id) {
                setEdges(eds => eds.map(e => ({ ...e, selected: false })));
            } else {
                setEdges(eds => eds.map(e => ({ ...e, selected: e.id === id })));
                setNodes(nds => nds.map(n => ({ ...n, selected: false })));

                setTimeout(() => reactFlowWrapper.current?.focus(), 50);
            }
        },
        selectAll: () => {
            setNodes(nds => nds.map(n => ({ ...n, selected: true })));
            setEdges(eds => eds.map(e => ({ ...e, selected: true })));
        },
        invertSelection: () => {
            setNodes(nds => nds.map(n => ({ ...n, selected: !n.selected })));
            setEdges(eds => eds.map(e => ({ ...e, selected: !e.selected })));
        },
        alignNodes: (alignment: 'vertical-center' | 'horizontal-center' | 'distribute-vertical' | 'distribute-horizontal', selectedIds: string[]) => {
            if (selectedIds.length < 2) return;

            // Capture old positions before alignment
            const oldPositions = new Map<string, { x: number; y: number; parentId?: string }>();
            nodesRef.current.forEach(n => {
                if (selectedIds.includes(n.id)) {
                    oldPositions.set(n.id, { x: n.position.x, y: n.position.y, parentId: n.parentId });
                }
            });

            setNodes((currentNodes) => {
                const selectedNodes = currentNodes.filter(n => selectedIds.includes(n.id));
                if (selectedNodes.length < 2) return currentNodes;

                const getCenterX = (n: Node) => n.position.x + ((n.measured?.width || 100) / 2);
                const getCenterY = (n: Node) => n.position.y + ((n.measured?.height || 80) / 2);

                const centerXs = selectedNodes.map(getCenterX);
                const centerYs = selectedNodes.map(getCenterY);

                const avgCenterX = (Math.min(...centerXs) + Math.max(...centerXs)) / 2;
                const avgCenterY = (Math.min(...centerYs) + Math.max(...centerYs)) / 2;

                const sortedByX = [...selectedNodes].sort((a, b) => getCenterX(a) - getCenterX(b));
                const sortedByY = [...selectedNodes].sort((a, b) => getCenterY(a) - getCenterY(b));

                const minCX = Math.min(...centerXs);
                const maxCX = Math.max(...centerXs);
                const minCY = Math.min(...centerYs);
                const maxCY = Math.max(...centerYs);

                return currentNodes.map(node => {
                    if (!selectedIds.includes(node.id)) return node;

                    const nodeW = node.measured?.width || 100;
                    const nodeH = node.measured?.height || 80;
                    let newPos = { ...node.position };

                    switch (alignment) {
                        case 'vertical-center':
                            newPos.x = avgCenterX - (nodeW / 2);
                            break;
                        case 'horizontal-center':
                            newPos.y = avgCenterY - (nodeH / 2);
                            break;
                        case 'distribute-horizontal': {
                            const spanX = maxCX - minCX;
                            const spacingX = spanX / (selectedNodes.length - 1);
                            const index = sortedByX.findIndex(n => n.id === node.id);
                            newPos.x = (minCX + (index * spacingX)) - (nodeW / 2);
                            break;
                        }
                        case 'distribute-vertical': {
                            const spanY = maxCY - minCY;
                            const spacingY = spanY / (selectedNodes.length - 1);
                            const index = sortedByY.findIndex(n => n.id === node.id);
                            newPos.y = (minCY + (index * spacingY)) - (nodeH / 2);
                            break;
                        }
                    }

                    return { ...node, position: newPos };
                });
            });

            // Push alignment command after a microtask
            setTimeout(() => {
                const newPositions = new Map<string, { x: number; y: number; parentId?: string }>();
                nodesRef.current.forEach(n => {
                    if (selectedIds.includes(n.id)) {
                        newPositions.set(n.id, { x: n.position.x, y: n.position.y, parentId: n.parentId });
                    }
                });

                const alignLabels: Record<string, string> = {
                    'vertical-center': 'Align vertical',
                    'horizontal-center': 'Align horizontal',
                    'distribute-horizontal': 'Distribute horizontal',
                    'distribute-vertical': 'Distribute vertical',
                };
                const cmd = new MoveNodesCommand(cmdCtx, oldPositions, newPositions, alignLabels[alignment]);
                history.pushWithoutExecute(cmd);
            }, 0);
        }
    }));
}
