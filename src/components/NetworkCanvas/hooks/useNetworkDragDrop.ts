import { useState, useCallback, useRef } from 'react';
import type { Node, ReactFlowInstance } from '@xyflow/react';
import type { NeuralNodeData } from '../types';
import type { INeuron, NeuronType } from '../../../models/neural';
import { InputNeuron, BiasNeuron, Perceptron, McCullochPitts, OutputNeuron, PixelMatrix, NeuralLayer, Tensor, TensorElementWiseOp, TensorReductionOp, TensorMatrixOp, TensorReshapeOp } from '../../../models/neural';
import { AddNodesCommand, MoveNodesCommand } from '../../../commands';

export function useNetworkDragDrop(props: {
    history: any;
    cmdCtx: any;
    nodesRef: React.MutableRefObject<Node<NeuralNodeData>[]>;
    setNodes: React.Dispatch<React.SetStateAction<Node<NeuralNodeData>[]>>;
    reactFlowInstance: ReactFlowInstance | null;
    reactFlowWrapper: React.RefObject<HTMLDivElement | null>;
}) {
    const { history, cmdCtx, nodesRef, setNodes, reactFlowInstance, reactFlowWrapper } = props;

    // Modal state for multi-drop
    const [isMultiDropOpen, setIsMultiDropOpen] = useState(false);
    const [pendingDrop, setPendingDrop] = useState<{ type: NeuronType; position: { x: number, y: number }; clientX: number; clientY: number } | null>(null);

    const instantiateNode = useCallback((type: NeuronType | 'layer', position: { x: number, y: number }): { node: Node<NeuralNodeData>, neuron: INeuron } => {
        if (type === 'layer') {
            const newLayer = new NeuralLayer('Layer');

            return {
                neuron: newLayer as unknown as INeuron,
                node: {
                    id: newLayer.id,
                    type: 'layerNode',
                    position,
                    data: { layer: newLayer },
                    style: { width: 240, height: 180 },
                    zIndex: -100,
                } as Node<NeuralNodeData>,
            };
        }

        let newNeuronObj: INeuron;
        if (type === 'input') {
            newNeuronObj = new InputNeuron('Input');
        } else if (type === 'bias') {
            newNeuronObj = new BiasNeuron('Bias');
        } else if (type === 'output') {
            newNeuronObj = new OutputNeuron('Output');
        } else if (type === 'pixel-matrix') {
            newNeuronObj = new PixelMatrix('Draw Area', 5, 5);
        } else if (type === 'tensor') {
            newNeuronObj = new Tensor('Tensor', 1, [3]);
        } else if (type === 'tensor-elem-op') {
            newNeuronObj = new TensorElementWiseOp('Element-wise');
        } else if (type === 'tensor-reduce-op') {
            newNeuronObj = new TensorReductionOp('Reduction');
        } else if (type === 'tensor-matrix-op') {
            newNeuronObj = new TensorMatrixOp('Matrix');
        } else if (type === 'tensor-reshape-op') {
            newNeuronObj = new TensorReshapeOp('Reshape');
        } else if (type === 'mcculloch-pitts') {
            newNeuronObj = new McCullochPitts(crypto.randomUUID(), 1);
        } else {
            newNeuronObj = new Perceptron(crypto.randomUUID(), 0);
        }

        let nodeTypeName = `${type}-neuron`;
        if (type === 'pixel-matrix') nodeTypeName = 'pixel-matrix';
        if (type === 'tensor') nodeTypeName = 'tensor-node';
        if (type.startsWith('tensor-') && type !== 'tensor') nodeTypeName = type; // e.g., 'tensor-elem-op'

        return {
            neuron: newNeuronObj,
            node: {
                id: newNeuronObj.id,
                type: nodeTypeName,
                position,
                data: { neuron: newNeuronObj },
            } as Node<NeuralNodeData>,
        };
    }, []);

    // Find layer under cursor using DOM hit-testing.
    const findLayerAtCursor = useCallback((clientX: number, clientY: number): { node: Node; el: HTMLElement } | undefined => {
        let el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
        while (el) {
            if (el.classList.contains('react-flow__node')) {
                const nodeId = el.dataset?.id;
                if (nodeId) {
                    const node = nodesRef.current.find(n => n.id === nodeId && n.type === 'layerNode');
                    if (node) return { node, el };
                }
            }
            el = el.parentElement;
        }
        return undefined;
    }, [nodesRef]);

    // Compute next available position inside a layer matching the processDroppedNodes logic exactly
    const nextPositionInLayer = useCallback((layerId: string, indexOffset = 0) => {
        const dropX = 30;
        const startY = 40;
        const gap = 15;
        const DEFAULT_NODE_HEIGHT = 80;

        const children = nodesRef.current.filter(n => n.parentId === layerId);
        children.sort((a, b) => a.position.y - b.position.y);

        let currentY = startY;
        children.forEach((child) => {
            const childHeight = (child.measured?.height) || (child.style?.height as number) || DEFAULT_NODE_HEIGHT;
            currentY += childHeight + gap;
        });

        // Add index offsets for multi-drop
        currentY += indexOffset * (DEFAULT_NODE_HEIGHT + gap);

        return { x: dropX, y: currentY };
    }, [nodesRef]);

    const handleMultiDropConfirm = useCallback((count: number) => {
        if (!pendingDrop) return;

        const newNodes: Node<NeuralNodeData>[] = [];
        const newNeurons = new Map<string, INeuron>();
        const { type, position } = pendingDrop;

        let xOffset = 0;
        let yOffset = 0;

        if (type === 'layer') {
            xOffset = 300; // Drop layers horizontally
        } else {
            yOffset = type === 'pixel-matrix' ? 160 : 100; // Drop neurons vertically
        }

        // Find if the drop position falls inside an existing layer based on canvas coordinates
        let layerTargetId: string | null = null;
        if (type !== 'layer') {
            const hitLayer = nodesRef.current.find(n => {
                if (n.type !== 'layerNode') return false;
                const layerW = (n.measured?.width ?? (n.style as any)?.width) || 240;
                const layerH = (n.measured?.height ?? (n.style as any)?.height) || 180;
                return (
                    position.x >= n.position.x - 20 && position.x <= n.position.x + layerW + 20 &&
                    position.y >= n.position.y - 20 && position.y <= n.position.y + layerH + 20
                );
            });
            if (hitLayer) layerTargetId = hitLayer.id;
        }

        for (let i = 0; i < count; i++) {
            const pos = { x: position.x + (i * xOffset), y: position.y + (i * yOffset) };
            const { node, neuron } = instantiateNode(type, pos);

            let finalNode = node as Node;
            if (layerTargetId) {
                finalNode = {
                    ...finalNode,
                    parentId: layerTargetId,
                    position: nextPositionInLayer(layerTargetId, i),
                };
            }

            newNodes.push({ ...finalNode, selected: true } as Node<NeuralNodeData>);
            newNeurons.set(neuron.id, neuron);
        }

        const typeLabels: Record<string, string> = { input: 'Input', output: 'Output', 'perceptron': 'Perceptron', 'mcculloch-pitts': 'MCP', 'pixel-matrix': 'Pixel Matrix', tensor: 'Tensor', layer: 'Layer' };
        const cmd = new AddNodesCommand(cmdCtx, newNodes as Node[], newNeurons, `Add ${count}x ${typeLabels[type as string] || type}`);
        history.push(cmd);
        setPendingDrop(null);
        setIsMultiDropOpen(false);
    }, [pendingDrop, instantiateNode, nodesRef, nextPositionInLayer, cmdCtx, history]);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowInstance || !reactFlowWrapper.current) return;

            const type = event.dataTransfer.getData('application/reactflow') as NeuronType | 'layer';

            if (!type) return;

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            if (event.ctrlKey || event.metaKey) {
                setPendingDrop({ type: type as NeuronType, position, clientX: event.clientX, clientY: event.clientY });
                setIsMultiDropOpen(true);
            } else {
                const { node, neuron } = instantiateNode(type, position);
                const neurons = new Map<string, INeuron>();
                neurons.set(neuron.id, neuron);

                let finalNode = node as Node;
                if (type !== 'layer') {
                    const layerHit = findLayerAtCursor(event.clientX, event.clientY);
                    if (layerHit) {
                        const { node: targetLayer } = layerHit;
                        finalNode = {
                            ...finalNode,
                            parentId: targetLayer.id,
                            position: nextPositionInLayer(targetLayer.id),
                        };
                    }
                }

                const typeLabels: Record<string, string> = { input: 'Input', output: 'Output', 'perceptron': 'Perceptron', 'mcculloch-pitts': 'MCP', 'pixel-matrix': 'Pixel Matrix', tensor: 'Tensor', layer: 'Layer' };
                const cmd = new AddNodesCommand(cmdCtx, [{ ...finalNode, selected: true }], neurons, `Add ${typeLabels[type as string] || type}`);
                history.push(cmd);
            }
        },
        [reactFlowInstance, reactFlowWrapper, instantiateNode, findLayerAtCursor, nextPositionInLayer, cmdCtx, history]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onMultiDropClose = useCallback(() => {
        setIsMultiDropOpen(false);
        setPendingDrop(null);
    }, []);

    // Drag tracking for undo/redo on nodes moves
    const dragStartPositionsRef = useRef<Map<string, { x: number; y: number; parentId?: string }>>(new Map());
    const isDraggingNodesRef = useRef(false);

    const onNodeDragStart = useCallback((_event: React.MouseEvent, _node: Node, activeNodes: Node[]) => {
        isDraggingNodesRef.current = true;
        const positions = new Map<string, { x: number; y: number; parentId?: string }>();
        activeNodes.forEach(n => {
            const currentNode = nodesRef.current.find(cn => cn.id === n.id);
            if (currentNode) {
                positions.set(n.id, { x: currentNode.position.x, y: currentNode.position.y, parentId: currentNode.parentId });
            }
        });
        dragStartPositionsRef.current = positions;
    }, [nodesRef]);

    const onSelectionDragStart = useCallback((_event: React.MouseEvent, selectedNodes: Node[]) => {
        isDraggingNodesRef.current = true;
        const positions = new Map<string, { x: number; y: number; parentId?: string }>();
        selectedNodes.forEach(n => {
            const currentNode = nodesRef.current.find(cn => cn.id === n.id);
            if (currentNode) {
                positions.set(n.id, { x: currentNode.position.x, y: currentNode.position.y, parentId: currentNode.parentId });
            }
        });
        dragStartPositionsRef.current = positions;
    }, [nodesRef]);

    const processDroppedNodes = useCallback((draggedNodesList: Node[]) => {
        const filteredNodes = draggedNodesList.filter(n => n.type !== 'layerNode');
        if (filteredNodes.length === 0) return;

        setNodes((currentNodes) => {
            let nextNodes = [...currentNodes];
            const layersToReorganize = new Set<string>();

            // For multi-node drag: find if ANY dragged node is over a layer
            let groupTargetLayer: Node | undefined = undefined;

            for (const targetNode of filteredNodes) {
                let absX = targetNode.position.x;
                let absY = targetNode.position.y;
                if (targetNode.parentId) {
                    const parent = nextNodes.find(n => n.id === targetNode.parentId);
                    if (parent) { absX = parent.position.x + targetNode.position.x; absY = parent.position.y + targetNode.position.y; }
                }

                const foundLayer = nextNodes.find(n => {
                    if (n.type !== 'layerNode') return false;
                    if (n.id === targetNode.id) return false;
                    const layerW = 240; // Fixed width constraint for hit testing
                    const layerH = (n.measured?.height ?? (n.style as any)?.height) || 180;

                    // Only consider it inside the layer if the center of the node is within the layer bounds
                    const nodeCenterW = 75; // Approx half width of a standard node
                    return (
                        absX + nodeCenterW >= n.position.x && absX + nodeCenterW <= n.position.x + layerW &&
                        absY >= n.position.y && absY <= n.position.y + layerH
                    );
                });

                if (foundLayer) {
                    groupTargetLayer = foundLayer;
                    break;
                }
            }

            // Apply the decision to all dragged nodes
            filteredNodes.forEach(targetNode => {
                let absoluteX = targetNode.position.x;
                let absoluteY = targetNode.position.y;
                if (targetNode.parentId) {
                    const parentLayer = nextNodes.find(n => n.id === targetNode.parentId);
                    if (parentLayer) {
                        absoluteX = parentLayer.position.x + targetNode.position.x;
                        absoluteY = parentLayer.position.y + targetNode.position.y;
                    }
                }

                const oldParentId = targetNode.parentId;
                const newParentId = groupTargetLayer ? groupTargetLayer.id : undefined;

                if (oldParentId) layersToReorganize.add(oldParentId);
                if (newParentId) layersToReorganize.add(newParentId);

                const targetNodeIndex = nextNodes.findIndex(n => n.id === targetNode.id);
                if (targetNodeIndex > -1) {
                    const nodeToUpdate = { ...nextNodes[targetNodeIndex] };
                    if (newParentId && groupTargetLayer) {
                        nodeToUpdate.parentId = newParentId;
                        nodeToUpdate.position = {
                            x: absoluteX - groupTargetLayer.position.x,
                            y: absoluteY - groupTargetLayer.position.y,
                        };
                    } else {
                        nodeToUpdate.parentId = undefined;
                        nodeToUpdate.position = { x: absoluteX, y: absoluteY };
                    }
                    nextNodes[targetNodeIndex] = nodeToUpdate as Node<NeuralNodeData>;
                }
            });

            // Reorganize all affected layers and recalculate their size
            layersToReorganize.forEach(layerId => {
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

                // Calculate required layer dimensions (height only is auto)
                const minLayerHeight = 180;
                const neededHeight = Math.max(minLayerHeight, currentY + 20);

                // Update layer size to fit its children vertically
                nextNodes[layerNodeIndex] = {
                    ...layerNode,
                    style: {
                        ...layerNode.style as object,
                        width: 240, // Fixed width
                        height: neededHeight
                    }
                };
            });

            // Ensure parent nodes come BEFORE children in array (React Flow requirement)
            const layerNodes = nextNodes.filter(n => n.type === 'layerNode');
            const nonLayerNodes = nextNodes.filter(n => n.type !== 'layerNode');
            return [...layerNodes, ...nonLayerNodes];
        });
    }, [setNodes]);

    const pushMoveCommand = useCallback((allDraggedNodes: Node[]) => {
        const oldPos = new Map(dragStartPositionsRef.current);
        const draggedIds = allDraggedNodes.map(n => n.id);

        setTimeout(() => {
            const newPos = new Map<string, { x: number; y: number; parentId?: string }>();
            nodesRef.current.forEach(n => {
                if (oldPos.has(n.id) || draggedIds.includes(n.id)) {
                    newPos.set(n.id, { x: n.position.x, y: n.position.y, parentId: n.parentId });
                }
            });

            let changed = false;
            newPos.forEach((newP, id) => {
                const oldP = oldPos.get(id);
                if (!oldP || oldP.x !== newP.x || oldP.y !== newP.y || oldP.parentId !== newP.parentId) {
                    changed = true;
                }
            });

            if (changed) {
                const hasLayer = allDraggedNodes.some(n => n.type === 'layerNode');
                const label = hasLayer ? `Move layer` : `Move ${draggedIds.length} node(s)`;
                const moveCmd = new MoveNodesCommand(cmdCtx, oldPos, newPos, label);
                history.pushWithoutExecute(moveCmd);
            }
        }, 0);
    }, [cmdCtx, history, nodesRef]);

    const onNodeDrag = useCallback((_event: React.MouseEvent, node: Node, _activeNodes: Node[]) => {
        // If a single node is dragged out of its layer, instantly detach it to prevent native auto-expand.
        if (node.parentId && node.type !== 'layerNode') {
            const parentLayer = nodesRef.current.find(n => n.id === node.parentId);
            if (parentLayer) {
                const layerW = 240; // Strict width check so native expand doesn't fool us
                const layerH = (parentLayer.measured?.height ?? (parentLayer.style as any)?.height) || 180;
                const nodeCenterW = 75;

                // Calculate absolute X and Y of the dragging node using explicit node param
                const absX = parentLayer.position.x + node.position.x;
                const absY = parentLayer.position.y + node.position.y;

                const isInside = (
                    absX + nodeCenterW >= parentLayer.position.x && absX + nodeCenterW <= parentLayer.position.x + layerW &&
                    absY >= parentLayer.position.y && absY <= parentLayer.position.y + layerH
                );

                if (!isInside) {
                    setNodes(currentNodes => {
                        let nextNodes = [...currentNodes];

                        // Detach node
                        const nodeIndex = nextNodes.findIndex(n => n.id === node.id);
                        if (nodeIndex > -1) {
                            nextNodes[nodeIndex] = {
                                ...nextNodes[nodeIndex],
                                parentId: undefined,
                                position: { x: absX, y: absY }
                            };
                        }

                        // Repack old parent layer immediately
                        const layerNodeIndex = nextNodes.findIndex(n => n.id === parentLayer.id);
                        if (layerNodeIndex > -1) {
                            const children = nextNodes.filter(n => n.parentId === parentLayer.id);
                            children.sort((a, b) => a.position.y - b.position.y);

                            let currentY = 40; // startY
                            const gap = 15;
                            const dropX = 30;

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
                                ...nextNodes[layerNodeIndex],
                                style: {
                                    ...nextNodes[layerNodeIndex].style as object,
                                    width: 240,
                                    height: neededHeight
                                }
                            };
                        }

                        return nextNodes;
                    });
                }
            }
        }
    }, [nodesRef, setNodes]);

    const onNodeDragStop = useCallback((_event: React.MouseEvent, _node: Node, activeNodes: Node[]) => {
        isDraggingNodesRef.current = false;
        processDroppedNodes(activeNodes);
        pushMoveCommand(activeNodes);
    }, [processDroppedNodes, pushMoveCommand]);

    const onSelectionDragStop = useCallback((_event: React.MouseEvent, selectedNodes: Node[]) => {
        isDraggingNodesRef.current = false;
        processDroppedNodes(selectedNodes);
        pushMoveCommand(selectedNodes);
    }, [processDroppedNodes, pushMoveCommand]);

    return {
        instantiateNode,
        isMultiDropOpen,
        pendingDrop,
        onDrop,
        onDragOver,
        onMultiDropClose,
        handleMultiDropConfirm,
        onNodeDragStart,
        onNodeDrag,
        onSelectionDragStart,
        onNodeDragStop,
        onSelectionDragStop,
        isDraggingNodesRef
    };
}
