import React, { useState, useRef, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    Controls,
    Background,
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
import { InputNeuron, MccullochPitts, OutputNeuron, PixelMatrix, Synapse } from '../models/neural';
import type { NeuronType, INeuron, ISynapse } from '../models/neural';
import { PixelMatrixNode, type PixelMatrixNodeData } from './PixelMatrixNode';
import { MultiDropModal } from './MultiDropModal';

export type NeuralNodeData = NeuronNodeData | PixelMatrixNodeData;

const initialNodes: Node<NeuralNodeData>[] = [];
const initialEdges: Edge[] = [];

const nodeTypes = {
    neuron: NeuronNode,
    'pixel-matrix': PixelMatrixNode,
};

interface FlowProps {
    onSelectNode: (neuron: INeuron | null) => void;
    onSelectEdge: (synapse: ISynapse | null) => void;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    tick: number;
    showMatrixHandles: boolean;
    toolMode: 'pan' | 'select';
}

const Flow: React.FC<FlowProps> = ({ onSelectNode, onSelectEdge, neuronsRef, synapsesRef, tick, showMatrixHandles, toolMode }) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node<NeuralNodeData>[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    // Modal state for multi-drop
    const [isMultiDropOpen, setIsMultiDropOpen] = useState(false);
    const [pendingDrop, setPendingDrop] = useState<{ type: NeuronType; position: { x: number, y: number } } | null>(null);

    const onNodesChangeHandler = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<NeuralNodeData>[]),
        []
    );

    const onEdgesChangeHandler = useCallback(
        (changes: EdgeChange[]) => {
            changes.forEach(change => {
                if (change.type === 'remove') {
                    synapsesRef.current.delete(change.id);
                }
            });
            setEdges((eds) => applyEdgeChanges(changes, eds) as Edge[]);
        },
        [synapsesRef]
    );

    React.useEffect(() => {
        setNodes((nds) => nds.map(n => {
            const neuron = neuronsRef.current.get(n.id);
            if (neuron) {
                return { ...n, data: { ...n.data, neuron: { ...neuron }, showHandles: showMatrixHandles } };
            }
            return n;
        }));
        setEdges((eds) => eds.map(e => {
            const synapse = synapsesRef.current.get(e.id);
            if (synapse) {
                const isBias = e.targetHandle === 'bias';
                const isOutputEdge = synapse.postSynaptic.type === 'output';
                const color = isBias ? '#eab308' : (isOutputEdge ? '#f97316' : '#60a5fa');
                const showLabel = !isBias && !isOutputEdge;
                return {
                    ...e,
                    label: showLabel ? synapse.weight.toString() : undefined,
                    labelStyle: showLabel ? { fill: color, fontWeight: 'bold' } : undefined,
                    labelBgStyle: showLabel ? { fill: '#1e293b', opacity: 0.8 } : undefined,
                    labelBgPadding: showLabel ? [4, 4] : undefined,
                    labelBgBorderRadius: showLabel ? 4 : undefined,
                    style: { stroke: color, strokeWidth: 2, strokeDasharray: isOutputEdge ? '5,5' : undefined },
                    zIndex: showMatrixHandles ? 100 : -10, // Drop behind matrix naturally when not routing
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: color,
                    }
                };
            }
            return e;
        }));
    }, [tick, neuronsRef, synapsesRef, setNodes, setEdges, showMatrixHandles]);

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

    const onConnect = useCallback(
        (params: Connection) => {
            if (!params.source || !params.target) return;

            const preNeuron = neuronsRef.current.get(params.source);
            const postNeuron = neuronsRef.current.get(params.target);

            if (preNeuron && postNeuron) {
                if (postNeuron.type === 'output') {
                    const hasExistingConnection = edges.some(e => e.target === params.target);
                    if (hasExistingConnection) {
                        return; // Output neuron accepts only 1 connection
                    }
                }

                // Create OOP instance of Synapse, logging source handle if available
                const synapse = new Synapse(preNeuron, postNeuron, 1, params.sourceHandle || undefined, params.targetHandle || 'input');
                synapsesRef.current.set(synapse.id, synapse);

                // Map to React Flow Edge
                const isBias = params.targetHandle === 'bias';
                const isOutputEdge = postNeuron.type === 'output';
                const color = isBias ? '#eab308' : (isOutputEdge ? '#f97316' : '#60a5fa');
                const showLabel = !isBias && !isOutputEdge;

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
                    zIndex: showMatrixHandles ? 100 : -10, // Edge drops behind drawing surface
                    style: { stroke: color, strokeWidth: 2, strokeDasharray: isOutputEdge ? '5,5' : undefined },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: color,
                    }
                };
                setEdges((eds) => addEdge(newEdge, eds));
            }
        },
        [synapsesRef, neuronsRef, edges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const instantiateNode = useCallback((type: NeuronType, position: { x: number, y: number }) => {
        let newNeuronObj: INeuron;
        if (type === 'input') {
            newNeuronObj = new InputNeuron('Input Neuron');
        } else if (type === 'output') {
            newNeuronObj = new OutputNeuron('Output Neuron');
        } else if (type === 'pixel-matrix') {
            newNeuronObj = new PixelMatrix('Draw Area', 5, 5);
        } else {
            newNeuronObj = new MccullochPitts('M-P Neuron', 0);
        }

        neuronsRef.current.set(newNeuronObj.id, newNeuronObj);

        const nodeTypeName = type === 'pixel-matrix' ? 'pixel-matrix' : 'neuron';

        return {
            id: newNeuronObj.id,
            type: nodeTypeName,
            position,
            data: { neuron: newNeuronObj },
        } as Node<NeuralNodeData>;
    }, [neuronsRef]);

    const handleMultiDropConfirm = useCallback((count: number) => {
        if (!pendingDrop) return;

        const newNodes: Node<NeuralNodeData>[] = [];
        const { type, position } = pendingDrop;

        // Vertical spacing offset
        const yOffset = type === 'pixel-matrix' ? 160 : 100;

        for (let i = 0; i < count; i++) {
            const pos = { x: position.x, y: position.y + (i * yOffset) };
            newNodes.push(instantiateNode(type, pos));
        }

        setNodes((nds) => nds.concat(newNodes));
        setPendingDrop(null);
    }, [pendingDrop, instantiateNode]);

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
                // Open modal for multiple instantiation
                setPendingDrop({ type, position });
                setIsMultiDropOpen(true);
            } else {
                // Single instantiation
                const newNode = instantiateNode(type, position);
                setNodes((nds) => nds.concat(newNode));
            }
        },
        [reactFlowInstance, instantiateNode]
    );

    const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        if (params.nodes.length > 0) {
            const selectedNodeId = params.nodes[0].id;
            const neuronObj = neuronsRef.current.get(selectedNodeId) || null;
            onSelectNode(neuronObj);
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

    return (
        <div className="flex h-screen w-full bg-slate-900 text-slate-100 overflow-hidden font-sans">
            <Sidebar />
            <div className="flex-1 relative" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChangeHandler}
                    onEdgesChange={onEdgesChangeHandler}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onSelectionChange={onSelectionChange}
                    isValidConnection={(connection) => {
                        console.log('Validating connection payload:', connection);
                        // Output neuron only accepts 1 connection
                        const targetNode = nodes.find(n => n.id === connection.target);
                        if (targetNode && targetNode.data.neuron.type === 'output') {
                            const hasExisting = edges.some(e => e.target === connection.target);
                            if (hasExisting) {
                                console.log('Rejected: Output neuron already has connection');
                                return false;
                            }
                        }

                        // Check if pixel matrix tries to connect to itself (invalid)
                        if (connection.source === connection.target) {
                            console.log('Rejected: Connect to self');
                            return false;
                        }

                        console.log('Connection accepted');
                        return true;
                    }}
                    nodeTypes={nodeTypes as any}
                    defaultEdgeOptions={{
                        type: 'straight', // straight edge instead of bezier curve
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
                        style: { strokeWidth: 2, stroke: '#60a5fa' },
                        animated: true,
                    }}
                    deleteKeyCode={['Backspace', 'Delete']}
                    fitView
                    panOnDrag={toolMode === 'pan'}
                    selectionOnDrag={toolMode === 'select'}
                    panOnScroll={toolMode === 'select'} // Allow panning with wheel when selection is dragging mode
                    selectionMode={SelectionMode.Partial} // Partial selection
                    proOptions={{ hideAttribution: true }}
                    className="bg-slate-900"
                >
                    <Background
                        color="#334155"
                        gap={20}
                        size={1}
                    />
                    <Controls
                        className="bg-slate-800 border-slate-700 fill-slate-300"
                    />
                </ReactFlow>
            </div>

            <MultiDropModal
                isOpen={isMultiDropOpen}
                nodeType={pendingDrop?.type || null}
                onClose={() => {
                    setIsMultiDropOpen(false);
                    setPendingDrop(null);
                }}
                onConfirm={handleMultiDropConfirm}
            />
        </div>
    );
};

export interface NetworkCanvasProps {
    onSelectNode: (neuron: INeuron | null) => void;
    onSelectEdge: (synapse: ISynapse | null) => void;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    tick: number;
    showMatrixHandles: boolean;
    toolMode: 'pan' | 'select';
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = (props) => {
    return (
        <ReactFlowProvider>
            <Flow {...props} />
        </ReactFlowProvider>
    );
};
