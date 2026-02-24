import React, { useState, useRef, useCallback } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    Controls,
    Background,
    MarkerType,
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
import { InputNeuron, MccullochPitts, Synapse } from '../models/neural';
import type { NeuronType, INeuron, ISynapse } from '../models/neural';

const initialNodes: Node<NeuronNodeData>[] = [];
const initialEdges: Edge[] = [];

const nodeTypes = {
    neuron: NeuronNode,
};

interface FlowProps {
    onSelectNode: (neuron: INeuron | null) => void;
    onSelectEdge: (synapse: ISynapse | null) => void;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    tick: number;
}

const Flow: React.FC<FlowProps> = ({ onSelectNode, onSelectEdge, neuronsRef, synapsesRef, tick }) => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<Node<NeuronNodeData>[]>(initialNodes);
    const [edges, setEdges] = useState<Edge[]>(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

    const onNodesChangeHandler = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds) as Node<NeuronNodeData>[]),
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
                return { ...n, data: { ...n.data, neuron: { ...neuron } } };
            }
            return n;
        }));
        setEdges((eds) => eds.map(e => {
            const synapse = synapsesRef.current.get(e.id);
            if (synapse) {
                const isBias = e.targetHandle === 'bias';
                const color = isBias ? '#eab308' : '#60a5fa';
                return {
                    ...e,
                    label: isBias ? undefined : synapse.weight.toString(),
                    labelStyle: isBias ? undefined : { fill: color, fontWeight: 'bold' },
                    labelBgStyle: isBias ? undefined : { fill: '#1e293b', opacity: 0.8 },
                    labelBgPadding: isBias ? undefined : [4, 4],
                    labelBgBorderRadius: isBias ? undefined : 4,
                    style: { stroke: color, strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: color,
                    }
                };
            }
            return e;
        }));
    }, [tick, neuronsRef, synapsesRef, setNodes, setEdges]);

    React.useEffect(() => {
        setNodes((nds) => {
            let changed = false;
            const nextNds = nds.map(n => {
                const isBiasProvider = edges.some(e => e.source === n.id && e.targetHandle === 'bias');
                if (n.data.isBiasProvider !== isBiasProvider) {
                    changed = true;
                    return { ...n, data: { ...n.data, isBiasProvider } };
                }
                return n;
            });
            return changed ? nextNds : nds;
        });
    }, [edges, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => {
            if (!params.source || !params.target) return;

            const preNeuron = neuronsRef.current.get(params.source);
            const postNeuron = neuronsRef.current.get(params.target);

            if (preNeuron && postNeuron) {
                // Create OOP instance of Synapse
                const synapse = new Synapse(preNeuron, postNeuron, 1, params.targetHandle || 'input');
                synapsesRef.current.set(synapse.id, synapse);

                // Map to React Flow Edge
                const isBias = params.targetHandle === 'bias';
                const color = isBias ? '#eab308' : '#60a5fa';
                const newEdge: Edge = {
                    id: synapse.id,
                    source: params.source,
                    target: params.target,
                    targetHandle: params.targetHandle,
                    label: isBias ? undefined : synapse.weight.toString(),
                    labelStyle: isBias ? undefined : { fill: color, fontWeight: 'bold' },
                    labelBgStyle: isBias ? undefined : { fill: '#1e293b', opacity: 0.8 },
                    labelBgPadding: isBias ? undefined : [4, 4],
                    labelBgBorderRadius: isBias ? undefined : 4,
                    animated: true,
                    style: { stroke: color, strokeWidth: 2 },
                    markerEnd: {
                        type: MarkerType.ArrowClosed,
                        color: color,
                    }
                };
                setEdges((eds) => addEdge(newEdge, eds));
            }
        },
        [synapsesRef, neuronsRef]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

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

            // OOP Instantiation
            let newNeuronObj: INeuron;
            if (type === 'input') {
                newNeuronObj = new InputNeuron('Input Neuron');
            } else {
                newNeuronObj = new MccullochPitts('M-P Neuron', 0);
            }

            neuronsRef.current.set(newNeuronObj.id, newNeuronObj);

            const newNode: Node<NeuronNodeData> = {
                id: newNeuronObj.id,
                type: 'neuron',
                position,
                data: { neuron: newNeuronObj },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, neuronsRef]
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
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    nodeTypes={nodeTypes as any}
                    defaultEdgeOptions={{
                        type: 'default', // standard edge
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
                        style: { strokeWidth: 2, stroke: '#60a5fa' },
                        animated: true,
                    }}
                    deleteKeyCode={['Backspace', 'Delete']}
                    fitView
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
        </div>
    );
};

export interface NetworkCanvasProps {
    onSelectNode: (neuron: INeuron | null) => void;
    onSelectEdge: (synapse: ISynapse | null) => void;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    tick: number;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = (props) => {
    return (
        <ReactFlowProvider>
            <Flow {...props} />
        </ReactFlowProvider>
    );
};
