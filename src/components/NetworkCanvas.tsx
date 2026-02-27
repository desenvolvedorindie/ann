import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    Controls,
    Background,
    MiniMap,
    MarkerType,
    SelectionMode,
    applyNodeChanges,
    applyEdgeChanges,
} from '@xyflow/react';
import type {
    Connection,
    Edge,
    Node,
    ReactFlowInstance,
    OnSelectionChangeParams,
    NodeChange,
    EdgeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Sidebar } from './Sidebar';
import { NeuronNode } from './NeuronNode';
import type { NeuronNodeData } from './NeuronNode';
import { InputNeuron, BiasNeuron, McCullochPitts, OutputNeuron, PixelMatrix, Synapse, NeuralLayer } from '../models/neural';
import type { NeuronType, INeuron, ISynapse } from '../models/neural';
import { PixelMatrixNode, type PixelMatrixNodeData } from './PixelMatrixNode';
import { LayerNode, type LayerNodeData } from './LayerNode';
import { MultiDropModal } from './MultiDropModal';
import { useCommandHistory } from '../hooks/useCommandHistory';
import type { ICommand } from '../commands';
import { AddNodesCommand, DeleteNodesCommand, AddEdgesCommand, DeleteEdgesCommand, MoveNodesCommand, type CommandContext } from '../commands';

export type NeuralNodeData = NeuronNodeData | PixelMatrixNodeData | LayerNodeData;

const initialNodes: Node<NeuralNodeData>[] = [];
const initialEdges: Edge[] = [];

const nodeTypes = {
    neuron: NeuronNode,
    'pixel-matrix': PixelMatrixNode,
    'layerNode': LayerNode,
};

export type NetworkCanvasRef = {
    alignNodes: (alignment: 'vertical-center' | 'horizontal-center' | 'distribute-vertical' | 'distribute-horizontal', selectedIds: string[]) => void;
    selectNode: (id: string | null) => void;
};

export interface HistoryState {
    commands: ICommand[];
    pointer: number;
    goTo: (index: number) => void;
    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    version: number;
}

interface FlowProps {
    onSelectNode: (neuron: INeuron | null, layerChildIds?: string[]) => void;
    onSelectEdge: (synapse: ISynapse | null) => void;
    onSelectedNodesChange: (nodeIds: string[]) => void;
    onHistoryChange: (history: HistoryState) => void;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    tick: number;
    showRawConnections: boolean;
    showMatrixHandles: boolean;
    toolMode: 'pan' | 'select';
    onSetToolMode: (mode: 'pan' | 'select') => void;
    workspace: 'data' | 'architecture' | 'training' | 'execution';
}

const Flow = forwardRef<NetworkCanvasRef, FlowProps>(({ onSelectNode, onSelectEdge, onSelectedNodesChange, onHistoryChange, neuronsRef, synapsesRef, tick, showRawConnections, showMatrixHandles, toolMode, onSetToolMode, workspace }, ref) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node<NeuralNodeData>[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
    const isDraggingNodesRef = useRef(false);

    // Command history
    const history = useCommandHistory();
    const nodesRef = useRef(nodes);
    nodesRef.current = nodes;
    const edgesRef = useRef(edges);
    edgesRef.current = edges;

    const cmdCtx: CommandContext = React.useMemo(() => ({
        setNodes: setNodes as React.Dispatch<React.SetStateAction<Node[]>>,
        setEdges,
        neuronsRef,
        synapsesRef,
        getNodes: () => nodesRef.current as Node[],
        getEdges: () => edgesRef.current,
    }), [neuronsRef, synapsesRef]);

    // Auto-resize layer nodes to fit their children whenever nodes change
    React.useEffect(() => {
        const PADDING = 20;
        const HEADER_EXTRA = 20; // extra top space for the header badge
        const DEFAULT_CHILD_W = 120;
        const DEFAULT_CHILD_H = 60;

        const layerNodes = nodes.filter(n => n.type === 'layerNode');
        if (layerNodes.length === 0 || isDraggingNodesRef.current) return;

        let changed = false;
        const updated = nodes.map(n => {
            if (n.type !== 'layerNode') return n;
            const children = nodes.filter(c => c.parentId === n.id);
            if (children.length === 0) return n;

            const maxRight = children.reduce((acc, c) => {
                const w = c.measured?.width ?? DEFAULT_CHILD_W;
                return Math.max(acc, c.position.x + w);
            }, 0);
            const maxBottom = children.reduce((acc, c) => {
                const h = c.measured?.height ?? DEFAULT_CHILD_H;
                return Math.max(acc, c.position.y + h);
            }, 0);

            const newW = Math.max(240, maxRight + PADDING);
            const newH = Math.max(160, maxBottom + PADDING + HEADER_EXTRA);

            const curW = (n.style as any)?.width ?? n.measured?.width ?? 240;
            const curH = (n.style as any)?.height ?? n.measured?.height ?? 160;

            if (Math.abs(newW - curW) < 1 && Math.abs(newH - curH) < 1) return n;

            changed = true;
            return { ...n, style: { ...(n.style ?? {}), width: newW, height: newH } };
        });

        if (changed) {
            setNodes(updated as Node<NeuralNodeData>[]);
        }
    }, [nodes]);

    // Expose history state to parent
    React.useEffect(() => {
        onHistoryChange({
            commands: history.commands,
            pointer: history.pointer,
            goTo: history.goTo,
            undo: history.undo,
            redo: history.redo,
            canUndo: history.canUndo,
            canRedo: history.canRedo,
            version: history.version,
        });
    }, [history.version, history.pointer, history.commands, history.goTo, history.undo, history.redo, history.canUndo, history.canRedo, onHistoryChange]);

    // Modal state for multi-drop
    const [isMultiDropOpen, setIsMultiDropOpen] = useState(false);
    const [pendingDrop, setPendingDrop] = useState<{ type: NeuronType; position: { x: number, y: number }; clientX: number; clientY: number } | null>(null);

    // Track active panning forced by the user (spacebar or middle mouse button)
    const [isTempPanning, setIsTempPanning] = useState(false);

    // Copy / Paste State
    const copiedNodesRef = useRef<{ node: Node<NeuralNodeData>, type: NeuronType | 'layer' }[]>([]);
    const pasteCountRef = useRef<number>(0);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !e.repeat) setIsTempPanning(true);

            // Handle Copy
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                const selected = nodesRef.current.filter(n => n.selected);
                if (selected.length > 0) {
                    copiedNodesRef.current = selected.map(n => {
                        const isLayer = n.type === 'layerNode';
                        const type = isLayer ? 'layer' : (n.data as any)?.neuron?.type || 'm-pitts';
                        return { node: n, type };
                    });
                    pasteCountRef.current = 0; // Reset offset counter on new copy
                }
            }

            // Handle Paste
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                if (copiedNodesRef.current.length > 0 && workspace === 'architecture') {
                    const newNodesList: Node<NeuralNodeData>[] = [];
                    const newNeuronsMap = new Map<string, INeuron>();

                    pasteCountRef.current += 1;
                    const offsetMultiplier = pasteCountRef.current;

                    copiedNodesRef.current.forEach(copied => {
                        const offset = 40 * offsetMultiplier; // Offset cascata cumulativo
                        const newPos = { x: copied.node.position.x + offset, y: copied.node.position.y + offset };

                        // Recria o neuronio com o mesmo tipo e posição
                        const { node: newNode, neuron: newNeuron } = instantiateNode(copied.type, newPos);

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
                        const cmd = new AddNodesCommand(cmdCtx, newNodesList, newNeuronsMap, `Colar ${newNodesList.length} nó(s)`);
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
    }, []);

    const topologyCacheRef = useRef<{ lastHistoryVersion: number; lastShowRawConnections: boolean; edgesToRemove: Set<string>; virtualEdges: Edge[] }>({
        lastHistoryVersion: -1,
        lastShowRawConnections: false,
        edgesToRemove: new Set(),
        virtualEdges: []
    });

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
                    setNodes((nds) => applyNodeChanges(otherChanges, nds) as Node<NeuralNodeData>[]);
                }
                return;
            }
            setNodes((nds) => applyNodeChanges(changes, nds) as Node<NeuralNodeData>[]);
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

    // Clear selection when navigating away from or to workspaces
    React.useEffect(() => {
        setNodes(nds => nds.map(n => n.selected ? { ...n, selected: false } : n));
        setEdges(eds => eds.map(e => e.selected ? { ...e, selected: false } : e));
        onSelectNode(null);
        onSelectEdge(null);
    }, [workspace, onSelectNode, onSelectEdge]);

    React.useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setNodes((nds) => nds.map(n => {
                const neuron = neuronsRef.current.get(n.id);
                if (neuron) {
                    return { ...n, data: { ...n.data, neuron: { ...neuron }, showHandles: showMatrixHandles } };
                }
                return n;
            }));
            setEdges((eds) => {
                const currentNodes = nodesRef.current;

                if (topologyCacheRef.current.lastHistoryVersion !== history.version || topologyCacheRef.current.lastShowRawConnections !== showRawConnections) {
                    // Group layers and evaluate if they are fully connected
                    const layerNodes = currentNodes.filter(n => n.type === 'layerNode');
                    const edgesToRemove = new Set<string>();
                    const virtualEdges: Edge[] = [];

                    if (!showRawConnections && layerNodes.length > 1) {
                        for (let i = 0; i < layerNodes.length; i++) {
                            for (let j = 0; j < layerNodes.length; j++) {
                                if (i === j) continue;
                                const srcLayer = layerNodes[i];
                                const tgtLayer = layerNodes[j];

                                const srcChildren = currentNodes.filter(n => n.parentId === srcLayer.id)
                                    .sort((a, b) => a.position.y - b.position.y);
                                const tgtChildren = currentNodes.filter(n => n.parentId === tgtLayer.id)
                                    .sort((a, b) => a.position.y - b.position.y);

                                if (srcChildren.length === 0 || tgtChildren.length === 0) continue;

                                let fullyConnected = true;
                                const currentPairEdges: string[] = [];

                                // Flatten for virtual topology check
                                const flattenedSources: { node: Node, handleId: string | undefined, neuron: INeuron }[] = [];
                                srcChildren.forEach(srcNode => {
                                    const srcNeuron = neuronsRef.current.get(srcNode.id);
                                    if (!srcNeuron) return;
                                    if (srcNeuron.type === 'pixel-matrix') {
                                        const matrix = srcNeuron as PixelMatrix;
                                        const totalPixels = matrix.width * matrix.height;
                                        for (let i = 0; i < totalPixels; i++) {
                                            flattenedSources.push({ node: srcNode, handleId: `pixel-${i}`, neuron: srcNeuron });
                                        }
                                    } else {
                                        flattenedSources.push({ node: srcNode, handleId: undefined, neuron: srcNeuron });
                                    }
                                });

                                const flattenedTargets: { node: Node, handleId: string | undefined, neuron: INeuron }[] = [];
                                tgtChildren.forEach(tgtNode => {
                                    const tgtNeuron = neuronsRef.current.get(tgtNode.id);
                                    if (!tgtNeuron) return;
                                    if (tgtNeuron.type === 'pixel-matrix') {
                                        const matrix = tgtNeuron as PixelMatrix;
                                        const totalPixels = matrix.width * matrix.height;
                                        for (let i = 0; i < totalPixels; i++) {
                                            flattenedTargets.push({ node: tgtNode, handleId: `pixel-in-${i}`, neuron: tgtNeuron });
                                        }
                                    } else {
                                        flattenedTargets.push({ node: tgtNode, handleId: undefined, neuron: tgtNeuron });
                                    }
                                });

                                const validSources = flattenedSources;
                                const validTargets = flattenedTargets.filter(t => t.neuron.type !== 'input' && t.neuron.type !== 'bias');

                                // Discover if this pair is fully connected
                                let outputTargetIndex = 0;

                                for (let tIdx = 0; tIdx < validTargets.length; tIdx++) {
                                    const { node: tgtNode, handleId: tgtHandleId, neuron: tgtNeuron } = validTargets[tIdx];
                                    const requiresStrictMapping = tgtNeuron.type === 'output' || tgtNeuron.type === 'pixel-matrix';

                                    for (let sIdx = 0; sIdx < validSources.length; sIdx++) {
                                        const { node: srcNode, handleId: srcHandleId, neuron: srcNeuronActual } = validSources[sIdx];

                                        // 1:1 mapping enforce mirrored from onConnect
                                        if (requiresStrictMapping) {
                                            if (sIdx !== outputTargetIndex) continue;
                                        }

                                        let targetHandle = 'input';
                                        if (tgtNeuron.type === 'pixel-matrix') {
                                            targetHandle = tgtHandleId || 'pixel-in-0';
                                        } else if (srcNeuronActual.type === 'bias') {
                                            targetHandle = 'bias';
                                        }

                                        const matchingEdge = eds.find(e =>
                                            e.source === srcNode.id && e.target === tgtNode.id &&
                                            (e.sourceHandle === srcHandleId || (!e.sourceHandle && !srcHandleId)) &&
                                            (e.targetHandle === targetHandle)
                                        );

                                        if (!matchingEdge) {
                                            fullyConnected = false;
                                            break;
                                        } else {
                                            currentPairEdges.push(matchingEdge.id);
                                        }
                                    }

                                    if (requiresStrictMapping) {
                                        outputTargetIndex++;
                                    }

                                    if (!fullyConnected) break;
                                }

                                if (fullyConnected && currentPairEdges.length > 0) {
                                    currentPairEdges.forEach(id => edgesToRemove.add(id));
                                    virtualEdges.push({
                                        id: `virtual-${srcLayer.id}-${tgtLayer.id}`,
                                        source: srcLayer.id,
                                        sourceHandle: 'layer-out',
                                        target: tgtLayer.id,
                                        targetHandle: 'layer-in',
                                        type: 'straight',
                                        animated: true,
                                        interactionWidth: 0,
                                        focusable: false,
                                        zIndex: 50,
                                        style: { stroke: '#8b5cf6', strokeWidth: 4, opacity: 0.8 },
                                        markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
                                    });
                                }
                            }
                        }
                    }

                    topologyCacheRef.current = {
                        lastHistoryVersion: history.version,
                        lastShowRawConnections: showRawConnections,
                        edgesToRemove,
                        virtualEdges
                    };
                }

                const { edgesToRemove, virtualEdges } = topologyCacheRef.current;

                const physicalEds = eds.filter(e => !e.id.startsWith('virtual-'));

                // Render physical edges
                const physicalEdges = physicalEds.map(e => {
                    if (edgesToRemove.has(e.id)) {
                        return { ...e, hidden: true, style: { ...e.style, opacity: 0, strokeWidth: 0 } };
                    }

                    const synapse = synapsesRef.current.get(e.id);
                    if (synapse) {
                        // Uma edge apenas deve ser laranja e tracejada se estiver efetivamente
                        // conectando para um nó que seja de Output E estiver fora da camada atual,
                        // mas a regra atual "postSynaptic.type === 'output'" já funciona para a semântica,
                        // exceto que dentro da macro da camada, não existe nó output de "destino" intermediário
                        // O problema é que qualquer sinapse que VAI para um output neuron fica tracejada.
                        // Correção: Apenas tracejar se o edge visível está indo para um nó Neuron de Output.
                        const targetNode = currentNodes.find(n => n.id === e.target);
                        const targetType = targetNode?.type === 'neuron' ? (targetNode.data as any).neuron?.type : targetNode?.type;
                        const isOutputEdge = targetType === 'output' || targetType === 'pixel-matrix' || targetNode?.type === 'pixel-matrix';
                        const isBiasEdge = e.targetHandle === 'bias';

                        const isSelected = !!e.selected;
                        const baseColor = isOutputEdge ? '#f97316' : (isBiasEdge ? '#eab308' : '#60a5fa');
                        const color = isSelected ? '#ffffff' : baseColor;
                        const showLabel = !isOutputEdge;
                        return {
                            ...e,
                            hidden: false,
                            type: 'straight',
                            selectable: true,
                            focusable: true,
                            interactionWidth: 12,
                            label: showLabel ? synapse.weight.toString() : undefined,
                            labelStyle: showLabel ? { fill: isSelected ? '#ffffff' : baseColor, fontWeight: 'bold' } : undefined,
                            labelBgStyle: showLabel ? { fill: isSelected ? '#334155' : '#1e293b', opacity: 0.9 } : undefined,
                            labelBgPadding: showLabel ? [4, 4] : undefined,
                            labelBgBorderRadius: showLabel ? 4 : undefined,
                            style: {
                                stroke: color,
                                strokeWidth: isSelected ? 3 : 2,
                                strokeDasharray: isOutputEdge ? '5,5' : undefined,
                                filter: isSelected ? `drop-shadow(0 0 6px ${baseColor})` : undefined,
                            },
                            zIndex: isSelected ? 200 : (showMatrixHandles ? 100 : -10),
                            markerEnd: { type: MarkerType.ArrowClosed, color: color }
                        };
                    }
                    return { ...e, hidden: false };
                });

                return [...physicalEdges, ...virtualEdges] as Edge[];
            });
        });

        return () => cancelAnimationFrame(rafId);
    }, [tick, neuronsRef, synapsesRef, setNodes, setEdges, showMatrixHandles, history.version, showRawConnections]);

    React.useEffect(() => {
        setNodes((nds) => {
            let changed = false;
            const nextNds = nds.map(n => {
                // Ensure n.data has isBiasProvider for NeuronNodeData
                if ('isBiasProvider' in n.data || n.type === 'neuron') {
                    const isBiasProvider = edges.some(e => e.source === n.id && e.targetHandle === 'bias');
                    if ((n.data as NeuronNodeData).isBiasProvider !== isBiasProvider) {
                        changed = true;
                        return { ...n, data: { ...n.data, isBiasProvider } };
                    }
                }
                return n;
            });
            return changed ? nextNds as Node<NeuralNodeData>[] : nds;
        });
    }, [edges, setNodes]);

    React.useEffect(() => {
        if (!reactFlowWrapper.current) return;
        const wrapper = reactFlowWrapper.current;

        const handleMouseDown = (e: MouseEvent) => {
            if (e.button === 1) { // Middle click
                e.preventDefault();
                onSetToolMode('pan');
            }
        };

        wrapper.addEventListener('mousedown', handleMouseDown);
        return () => {
            wrapper.removeEventListener('mousedown', handleMouseDown);
        };
    }, [onSetToolMode]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
                const activeTag = document.activeElement?.tagName.toLowerCase();
                if (activeTag === 'input' || activeTag === 'textarea' || (document.activeElement as HTMLElement)?.isContentEditable) {
                    return;
                }
                e.preventDefault();
                setNodes(nds => nds.map(n => ({ ...n, selected: true })));
                setEdges(eds => eds.map(e => ({ ...e, selected: true })));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) => {
            if (!params.source || !params.target) return;

            const preNeuron = neuronsRef.current.get(params.source);
            const postNeuron = neuronsRef.current.get(params.target);

            // Handle Layer-to-Layer Connection Macro
            if (params.sourceHandle === 'layer-out' && params.targetHandle === 'layer-in') {
                const sourceLayerChildren = nodes.filter(n => n.parentId === params.source)
                    .sort((a, b) => a.position.y - b.position.y);
                const targetLayerChildren = nodes.filter(n => n.parentId === params.target)
                    .sort((a, b) => a.position.y - b.position.y);

                if (sourceLayerChildren.length === 0 || targetLayerChildren.length === 0) return;

                const newEdges: Edge[] = [];
                const newSynapses = new Map<string, ISynapse>();

                // Flatten source neurons so PixelMatrix acts as N independent sources
                const flattenedSources: { node: Node, handleId: string | undefined, neuron: INeuron }[] = [];
                sourceLayerChildren.forEach(srcNode => {
                    const srcNeuron = neuronsRef.current.get(srcNode.id);
                    if (!srcNeuron) return;
                    if (srcNeuron.type === 'pixel-matrix') {
                        const matrix = srcNeuron as PixelMatrix;
                        const totalPixels = matrix.width * matrix.height;
                        for (let i = 0; i < totalPixels; i++) {
                            flattenedSources.push({ node: srcNode, handleId: `pixel-${i}`, neuron: srcNeuron });
                        }
                    } else {
                        flattenedSources.push({ node: srcNode, handleId: undefined, neuron: srcNeuron });
                    }
                });

                // Flatten target neurons so PixelMatrix acts as N independent targets
                const flattenedTargets: { node: Node, handleId: string | undefined, neuron: INeuron }[] = [];
                targetLayerChildren.forEach(tgtNode => {
                    const tgtNeuron = neuronsRef.current.get(tgtNode.id);
                    if (!tgtNeuron) return;
                    if (tgtNeuron.type === 'pixel-matrix') {
                        const matrix = tgtNeuron as PixelMatrix;
                        const totalPixels = matrix.width * matrix.height;
                        for (let i = 0; i < totalPixels; i++) {
                            flattenedTargets.push({ node: tgtNode, handleId: `pixel-in-${i}`, neuron: tgtNeuron });
                        }
                    } else {
                        flattenedTargets.push({ node: tgtNode, handleId: undefined, neuron: tgtNeuron });
                    }
                });

                const validSources = flattenedSources;
                const validTargets = flattenedTargets.filter(t => t.neuron.type !== 'input' && t.neuron.type !== 'bias');

                let outputTargetIndex = 0;

                validTargets.forEach((tgtPoint) => {
                    const { node: tgtNode, handleId: tgtHandleId, neuron: tgtNeuron } = tgtPoint;
                    const requiresStrictMapping = tgtNeuron.type === 'output' || tgtNeuron.type === 'pixel-matrix';

                    let sourceAssignedToThisTarget = 0;

                    validSources.forEach((srcPoint, sIdx) => {
                        // 1. Input/Bias (Source) - validSources already filtered them out.
                        // 2. Output & PixelMatrix (Target) - strict 1:1 mapping by aligned index.
                        if (requiresStrictMapping) {
                            if (sIdx !== outputTargetIndex) return;
                        }

                        const { node: srcNode, handleId: srcHandleId, neuron: srcNeuronActual } = srcPoint;

                        let targetHandle = 'input';
                        if (tgtNeuron.type === 'pixel-matrix') {
                            targetHandle = tgtHandleId || 'pixel-in-0';
                        } else if (srcNeuronActual.type === 'bias') {
                            targetHandle = 'bias';
                        }

                        // Check if connection already exists
                        let connectionExists = false;
                        synapsesRef.current.forEach(sym => {
                            if (sym.preSynaptic.id === srcNeuronActual.id && sym.postSynaptic.id === tgtNeuron.id && sym.sourceHandle === (srcHandleId || undefined) && sym.targetHandle === targetHandle) {
                                connectionExists = true;
                            }
                        });

                        if (!connectionExists) {
                            if (tgtNeuron.type === 'output') {
                                const hasCanvasEdge = newEdges.some(e => e.target === tgtNode.id);
                                if (hasCanvasEdge) return;
                            }

                            const synapse = new Synapse(srcNeuronActual, tgtNeuron, 1, srcHandleId, targetHandle);
                            newSynapses.set(synapse.id, synapse);

                            const isOutputEdge = tgtNeuron.type === 'output' || tgtNeuron.type === 'pixel-matrix';
                            const isBiasEdge = targetHandle === 'bias';
                            const baseColor = isOutputEdge ? '#f97316' : (isBiasEdge ? '#eab308' : '#60a5fa');
                            const color = isOutputEdge ? '#f97316' : baseColor;
                            const showLabel = !isOutputEdge;

                            newEdges.push({
                                id: synapse.id,
                                source: srcNode.id,
                                sourceHandle: srcHandleId || null,
                                target: tgtNode.id,
                                targetHandle: targetHandle,
                                label: showLabel ? '1' : undefined,
                                labelStyle: showLabel ? { fill: color, fontWeight: 'bold' } : undefined,
                                labelBgStyle: showLabel ? { fill: '#1e293b', opacity: 0.8 } : undefined,
                                labelBgPadding: showLabel ? [4, 4] : undefined,
                                labelBgBorderRadius: showLabel ? 4 : undefined,
                                animated: true,
                                type: 'straight',
                                zIndex: -10,
                                style: { stroke: color, strokeWidth: 2, strokeDasharray: isOutputEdge ? '5,5' : undefined },
                                markerEnd: { type: MarkerType.ArrowClosed, color },
                            });
                        }

                        sourceAssignedToThisTarget++;
                    });

                    if (requiresStrictMapping) {
                        outputTargetIndex++;
                    }
                });

                if (newEdges.length > 0) {
                    const cmd = new AddEdgesCommand(cmdCtx, newEdges, newSynapses, `Macro: ${newEdges.length} conexões`);
                    history.push(cmd);
                }
                return;
            }

            if (preNeuron && postNeuron) {
                if (postNeuron.type === 'output') {
                    const hasExistingConnection = edges.some(e => e.target === params.target);
                    if (hasExistingConnection) return;
                }



                const synapse = new Synapse(preNeuron, postNeuron, 1, params.sourceHandle || undefined, params.targetHandle || 'input');
                const newSynapses = new Map<string, ISynapse>();
                newSynapses.set(synapse.id, synapse);

                const isOutputEdge = postNeuron.type === 'output' || postNeuron.type === 'pixel-matrix';
                const isBiasEdge = params.targetHandle === 'bias';
                const baseColor = isOutputEdge ? '#f97316' : (isBiasEdge ? '#eab308' : '#60a5fa');
                const color = isOutputEdge ? '#f97316' : baseColor;
                const showLabel = !isOutputEdge;

                const newEdge: Edge = {
                    id: synapse.id,
                    source: params.source,
                    sourceHandle: params.sourceHandle,
                    target: params.target,
                    targetHandle: params.targetHandle,
                    label: showLabel ? synapse.weight.toString() : undefined,
                    labelStyle: showLabel ? { fill: color, fontWeight: 'bold' } : undefined,
                    labelBgStyle: showLabel ? { fill: '#1e293b', opacity: 0.8 } : undefined,
                    labelBgPadding: showLabel ? [4, 4] : undefined,
                    labelBgBorderRadius: showLabel ? 4 : undefined,
                    animated: true,
                    type: 'straight',
                    zIndex: showMatrixHandles ? 100 : -10,
                    style: { stroke: color, strokeWidth: 2, strokeDasharray: isOutputEdge ? '5,5' : undefined },
                    markerEnd: { type: MarkerType.ArrowClosed, color },
                };

                const cmd = new AddEdgesCommand(cmdCtx, [newEdge], newSynapses, `Conectar sinapse`);
                history.push(cmd);
            }
        },
        [synapsesRef, neuronsRef, edges, nodes, cmdCtx, history, showMatrixHandles]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onPaneClick = useCallback((e: React.MouseEvent) => {
        if (e.button === 1) {
            onSetToolMode('pan');
        }
    }, [onSetToolMode]);

    const isValidConnection = useCallback((connection: Edge | Connection) => {
        if (workspace !== 'architecture') return false;

        const sourceNode = nodes.find(n => n.id === connection.source);
        const targetNode = nodes.find(n => n.id === connection.target);

        const sourceIsLayer = sourceNode?.type === 'layerNode';
        const targetIsLayer = targetNode?.type === 'layerNode';

        // Layer connections are only valid layer-out → layer-in
        if (sourceIsLayer || targetIsLayer) {
            if (sourceIsLayer && targetIsLayer &&
                connection.sourceHandle === 'layer-out' &&
                connection.targetHandle === 'layer-in') {
                return true; // Pass quickly, skip neuron checks
            } else {
                return false;
            }
        }

        const sourceType = (sourceNode?.data as any)?.neuron?.type;

        // The 'bias' handle on M-P neurons only accepts BiasNeuron sources
        if (connection.targetHandle === 'bias') {
            if (sourceType !== 'bias') return false;
        }

        // Bias neurons cannot connect to standard 'input' handles
        if (sourceType === 'bias' && connection.targetHandle === 'input') {
            return false;
        }

        // Accept inward connections for Pixel Matrix
        const targetType = (targetNode?.data as any)?.neuron?.type;
        if (targetType === 'pixel-matrix') {
            if (!connection.targetHandle?.startsWith('pixel-in-')) return false;
        }

        // Output neuron only accepts one connection
        if (targetNode && (targetNode.data as any)?.neuron?.type === 'output') {
            const hasExisting = edges.some(e => e.target === connection.target);
            if (hasExisting) return false;
        }

        if (connection.source === connection.target) return false;
        return true;
    }, [workspace, nodes, edges]);

    const onMultiDropClose = useCallback(() => {
        setIsMultiDropOpen(false);
        setPendingDrop(null);
    }, []);

    const instantiateNode = useCallback((type: NeuronType, position: { x: number, y: number }): { node: Node<NeuralNodeData>, neuron: INeuron } => {
        if (type === 'layer') {
            const newLayer = new NeuralLayer('Camada');

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
            newNeuronObj = new InputNeuron('Input Neuron');
        } else if (type === 'bias') {
            newNeuronObj = new BiasNeuron('Bias');
        } else if (type === 'output') {
            newNeuronObj = new OutputNeuron('Output Neuron');
        } else if (type === 'pixel-matrix') {
            newNeuronObj = new PixelMatrix('Draw Area', 5, 5);
        } else {
            newNeuronObj = new McCullochPitts('M-P Neuron', 0);
        }

        const nodeTypeName = type === 'pixel-matrix' ? 'pixel-matrix' : 'neuron';

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
    // Walks up from elementFromPoint looking for the .react-flow__node wrapper of a layer.
    // Returns the wrapper element (accurate getBoundingClientRect) plus the matching flow node.
    const findLayerAtCursor = useCallback((clientX: number, clientY: number): { node: import('@xyflow/react').Node; el: HTMLElement } | undefined => {
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
    }, []);

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
    }, []);

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

        // Deselect is done atomically in AddNodesCommand.execute when nodes have selected:true

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

        const typeLabels: Record<string, string> = { input: 'Input', output: 'Output', 'mcculloch-pitts': 'M-P', 'pixel-matrix': 'Pixel Matrix', layer: 'Layer' };
        const cmd = new AddNodesCommand(cmdCtx, newNodes as Node[], newNeurons, `Adicionar ${count}x ${typeLabels[type] || type}`);
        history.push(cmd);
        setPendingDrop(null);
    }, [pendingDrop, instantiateNode, findLayerAtCursor, nextPositionInLayer, cmdCtx, history]);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowInstance || !reactFlowWrapper.current) return;

            const type = event.dataTransfer.getData('application/reactflow') as NeuronType;

            if (!type) return;

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            });

            if (event.ctrlKey || event.metaKey) {
                setPendingDrop({ type, position, clientX: event.clientX, clientY: event.clientY });
                setIsMultiDropOpen(true);
            } else {
                const { node, neuron } = instantiateNode(type, position);
                const neurons = new Map<string, INeuron>();
                neurons.set(neuron.id, neuron);

                // Auto-parent into layer if dropped inside one (skip for 'layer' type itself)
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

                const typeLabels: Record<string, string> = { input: 'Input', output: 'Output', 'mcculloch-pitts': 'M-P', 'pixel-matrix': 'Pixel Matrix', layer: 'Layer' };
                const cmd = new AddNodesCommand(cmdCtx, [{ ...finalNode, selected: true }], neurons, `Adicionar ${typeLabels[type] || type}`);
                history.push(cmd);
            }
        },
        [reactFlowInstance, instantiateNode, findLayerAtCursor, nextPositionInLayer, cmdCtx, history]
    );

    const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        const selectedIds = params.nodes.map(n => n.id);
        onSelectedNodesChange(selectedIds);

        if (params.nodes.length > 0) {
            const selectedNode = params.nodes[0];
            // Don't show properties if it's just a layer wrapper
            if (selectedNode.type === 'layerNode') {
                const layerObj = (selectedNode.data as LayerNodeData).layer;
                const childIds = nodesRef.current.filter(n => n.parentId === selectedNode.id).map(n => n.id);
                // Cast to INeuron for the app state, PropertiesPanel will handle the 'layer' type
                onSelectNode(layerObj as unknown as INeuron, childIds);
            } else {
                const neuronObj = neuronsRef.current.get(selectedNode.id) || null;
                onSelectNode(neuronObj);
            }
        } else {
            onSelectNode(null);
        }

        if (params.edges.length > 0) {
            const selectedEdgeId = params.edges[0].id;
            const synapseObj = synapsesRef.current.get(selectedEdgeId) || null;
            onSelectEdge(synapseObj);
        } else {
            onSelectEdge(null);
        }
    }, [neuronsRef, synapsesRef, onSelectNode, onSelectEdge]);

    // Track positions at drag start for undo
    const dragStartPositionsRef = useRef<Map<string, { x: number; y: number; parentId?: string }>>(new Map());

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
    }, []);

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
    }, []);

    // Shared snap logic for both single-node drag and selection-drag
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
                    const layerW = (n.measured?.width ?? (n.style as any)?.width) || 240;
                    const layerH = (n.measured?.height ?? (n.style as any)?.height) || 180;
                    return (
                        absX >= n.position.x - 20 && absX <= n.position.x + layerW + 20 &&
                        absY >= n.position.y - 20 && absY <= n.position.y + layerH + 20
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
                    nextNodes[targetNodeIndex] = nodeToUpdate;
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
                let maxChildWidth = 0;

                children.forEach((child) => {
                    const childIndex = nextNodes.findIndex(n => n.id === child.id);
                    if (childIndex > -1) {
                        nextNodes[childIndex] = {
                            ...nextNodes[childIndex],
                            position: { x: dropX, y: currentY }
                        };
                        const childHeight = (nextNodes[childIndex].measured?.height) || (nextNodes[childIndex].style?.height as number) || 80;
                        const childWidth = (nextNodes[childIndex].measured?.width) || (nextNodes[childIndex].style?.width as number) || 150;
                        currentY += childHeight + gap;

                        if (childWidth > maxChildWidth) {
                            maxChildWidth = childWidth;
                        }
                    }
                });

                // Calculate required layer dimensions and pad
                const minLayerHeight = 180;
                const minLayerWidth = 240;

                const neededHeight = Math.max(minLayerHeight, currentY + 20);
                const neededWidth = Math.max(minLayerWidth, maxChildWidth + 60);

                // Update layer size to fit its children
                nextNodes[layerNodeIndex] = {
                    ...layerNode,
                    style: {
                        ...layerNode.style,
                        width: neededWidth,
                        height: neededHeight
                    }
                };
            });

            // Ensure parent nodes come BEFORE children in array (React Flow requirement)
            const layerNodes = nextNodes.filter(n => n.type === 'layerNode');
            const nonLayerNodes = nextNodes.filter(n => n.type !== 'layerNode');
            return [...layerNodes, ...nonLayerNodes];
        });
    }, [nodes, setNodes]);

    // Create move command after drag stop (covers ALL node types including layers)
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
                const label = hasLayer ? `Mover camada` : `Mover ${draggedIds.length} nó(s)`;
                const moveCmd = new MoveNodesCommand(cmdCtx, oldPos, newPos, label);
                history.pushWithoutExecute(moveCmd);
            }
        }, 0);
    }, [cmdCtx, history]);

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
                    'vertical-center': 'Alinhar vertical',
                    'horizontal-center': 'Alinhar horizontal',
                    'distribute-horizontal': 'Distribuir horizontal',
                    'distribute-vertical': 'Distribuir vertical',
                };
                const cmd = new MoveNodesCommand(cmdCtx, oldPositions, newPositions, alignLabels[alignment]);
                history.pushWithoutExecute(cmd);
            }, 0);
        }
    }));

    return (
        <div className="flex h-full w-full flex-1 bg-slate-900 text-slate-100 overflow-hidden font-sans">
            {workspace === 'architecture' && <Sidebar />}
            <div className={`flex-1 relative react-flow-wrapper`} ref={reactFlowWrapper}>
                {toolMode === 'select' && !isTempPanning && (
                    <style>{`
                        .react-flow-wrapper .react-flow {
                            cursor: default !important;
                        }
                        .react-flow-wrapper .react-flow__pane {
                            cursor: default !important;
                        }
                        .react-flow-wrapper .react-flow__pane.dragging {
                            cursor: default !important;
                        }
                    `}</style>
                )}
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={workspace === 'architecture' ? onNodesChangeHandler : undefined}
                    onEdgesChange={workspace === 'architecture' ? onEdgesChangeHandler : undefined}
                    onConnect={workspace === 'architecture' ? onConnect : undefined}
                    onInit={setReactFlowInstance}
                    onDrop={workspace === 'architecture' ? onDrop : undefined}
                    onDragOver={workspace === 'architecture' ? onDragOver : undefined}
                    onNodeDragStart={workspace === 'architecture' ? onNodeDragStart : undefined}
                    onSelectionDragStart={workspace === 'architecture' ? onSelectionDragStart : undefined}
                    onNodeDragStop={workspace === 'architecture' ? onNodeDragStop : undefined}
                    onSelectionDragStop={workspace === 'architecture' ? onSelectionDragStop : undefined}
                    onSelectionChange={onSelectionChange}
                    isValidConnection={isValidConnection}
                    nodeTypes={nodeTypes as any}
                    defaultEdgeOptions={{
                        type: 'straight', // straight edge instead of bezier curve
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
                        style: { strokeWidth: 2, stroke: '#60a5fa' },
                        animated: true,
                    }}
                    deleteKeyCode={workspace === 'architecture' ? ['Backspace', 'Delete'] : null}
                    multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
                    snapToGrid={true}
                    snapGrid={[20, 20]}
                    fitView
                    nodesDraggable={workspace === 'architecture'}
                    nodesConnectable={workspace === 'architecture'}
                    elementsSelectable={workspace === 'architecture'}
                    panOnDrag={toolMode === 'pan' ? [0, 1, 2] : [1, 2]}
                    selectionOnDrag={toolMode === 'select' && workspace === 'architecture'}
                    panOnScroll={toolMode === 'select'} // Allow panning with wheel when selection is dragging mode
                    selectionMode={SelectionMode.Partial}
                    proOptions={{ hideAttribution: true }}
                    onlyRenderVisibleElements={true}
                    className="bg-slate-900"
                    onPaneClick={onPaneClick}
                >
                    <Background
                        color="#334155"
                        gap={20}
                        size={1}
                    />
                    <MiniMap
                        className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl"
                        nodeColor={(node: Node) => {
                            if (node.type === 'layerNode') return 'transparent';
                            if (node.type === 'pixel-matrix') return '#3b82f6';

                            // Checking properties dynamically to allow flexible data typings
                            const isBiasProvider = (node.data as any)?.isBiasProvider;
                            const neuronType = (node.data as any)?.neuron?.type;

                            if (neuronType === 'input') return '#10b981';
                            if (neuronType === 'output') return '#f97316';
                            if (isBiasProvider) return '#eab308';
                            return '#64748b'; // MP or undefined
                        }}
                        maskColor="rgba(15, 23, 42, 0.7)" // slate-900 with opacity
                        position="bottom-right"
                    />
                    <Controls
                        position="bottom-left"
                    />
                </ReactFlow>
            </div>

            <MultiDropModal
                isOpen={isMultiDropOpen}
                nodeType={pendingDrop?.type || null}
                onClose={onMultiDropClose}
                onConfirm={handleMultiDropConfirm}
            />
        </div>
    );
});

export interface NetworkCanvasProps {
    onSelectNode: (neuron: INeuron | null, layerChildIds?: string[]) => void;
    onSelectEdge: (synapse: ISynapse | null) => void;
    onSelectedNodesChange: (nodeIds: string[]) => void;
    onHistoryChange: (history: HistoryState) => void;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    tick: number;
    showRawConnections: boolean;
    showMatrixHandles: boolean;
    toolMode: 'pan' | 'select';
    onSetToolMode: (mode: 'pan' | 'select') => void;
    workspace: 'data' | 'architecture' | 'training' | 'execution';
}

export const NetworkCanvas = forwardRef<NetworkCanvasRef, NetworkCanvasProps>((props, ref) => {
    return (
        <ReactFlowProvider>
            <Flow {...props} ref={ref} />
        </ReactFlowProvider>
    );
});
