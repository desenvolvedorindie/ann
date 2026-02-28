import React, { useRef, useEffect, forwardRef, useState } from 'react';
import { ReactFlow, Controls, Background, MiniMap, MarkerType, SelectionMode, type Connection } from '@xyflow/react';
import type { ReactFlowInstance, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Sidebar } from '../Sidebar';
import { InputNode } from '../nodes/InputNode';
import { OutputNode } from '../nodes/OutputNode';
import { PerceptronNode } from '../nodes/PerceptronNode';
import { PixelMatrixNode } from '../nodes/PixelMatrixNode';
import { LayerNode } from '../nodes/LayerNode';
import { TensorNode } from '../nodes/TensorNode';
import { TensorElementNode } from '../nodes/TensorElementNode';
import { TensorReductionNode } from '../nodes/TensorReductionNode';
import { TensorMatrixNode } from '../nodes/TensorMatrixNode';
import { TensorReshapeNode } from '../nodes/TensorReshapeNode';
import { BiasNode } from '../nodes/BiasNode';
import { MultiDropModal } from '../MultiDropModal';
import { TensorConnectionModal } from '../TensorConnectionModal';
import type { Tensor } from '../../models/neural';

import { useNetworkState } from './hooks/useNetworkState';
import { useNetworkShortcuts } from './hooks/useNetworkShortcuts';
import { useNetworkDragDrop } from './hooks/useNetworkDragDrop';
import { useNetworkEdges } from './hooks/useNetworkEdges';
import { useNetworkSelection } from './hooks/useNetworkSelection';
import { useNetworkTopology } from './hooks/useNetworkTopology';
import { useNetworkAlignment } from './hooks/useNetworkAlignment';

import type { NetworkCanvasProps, NetworkCanvasRef } from './types';

const nodeTypes = {
    // Legacy names (for backward compatibility with old saves)
    perceptron: PerceptronNode,
    'mcculloch-pitts': PerceptronNode,
    'pixel-matrix': PixelMatrixNode,
    input: InputNode,
    output: OutputNode,
    bias: BiasNode,
    tensor: TensorNode,
    'tensor-elem-op': TensorElementNode,
    'tensor-reduce-op': TensorReductionNode,
    'tensor-matrix-op': TensorMatrixNode,
    'tensor-reshape-op': TensorReshapeNode,
    layer: LayerNode,

    // New names used by useNetworkDragDrop
    'input-neuron': InputNode,
    'output-neuron': OutputNode,
    'bias-neuron': BiasNode,
    'perceptron-neuron': PerceptronNode,
    'mcculloch-pitts-neuron': PerceptronNode,
    'tensor-node': TensorNode,
    layerNode: LayerNode,

    // Bug state compatibility
    'tensor-elem-op-neuron': TensorElementNode,
    'tensor-reduce-op-neuron': TensorReductionNode,
    'tensor-matrix-op-neuron': TensorMatrixNode,
    'tensor-reshape-op-neuron': TensorReshapeNode,
};

export const Flow = forwardRef<NetworkCanvasRef, NetworkCanvasProps>((props, ref) => {
    const {
        workspace, neuronsRef, synapsesRef,
        onHistoryChange, onSelectNode, onSelectEdge, onSelectedNodesChange,
        tick, showRawConnections, showMatrixHandles, toolMode, onSetToolMode, selectedEdgeId
    } = props;

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);

    // 1. State hook
    const {
        nodes, setNodes, nodesRef,
        edges, setEdges, edgesRef,
        history, cmdCtx,
        isDraggingNodesRef,
        onNodesChangeHandler, onEdgesChangeHandler
    } = useNetworkState({ neuronsRef, synapsesRef });

    // Pending connection state for Tensor output specific index selection
    const [pendingTensorConn, setPendingTensorConn] = useState<{ step: 'source' | 'target'; params: Connection; sourceTensor?: Tensor; targetTensor?: Tensor; sourceIndex?: number } | null>(null);

    // 2. Expose History State
    useEffect(() => {
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

    // 3. Auto-resize layers manually (from NetworkCanvas.tsx)
    useEffect(() => {
        const PADDING = 20;
        const HEADER_EXTRA = 20;
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
            setNodes(updated as typeof nodes);
        }
    }, [nodes, setNodes, isDraggingNodesRef]);

    // 4. Keyboard Shortcuts
    const { instantiateNode, ...dragDropHooks } = useNetworkDragDrop({
        history, cmdCtx, nodesRef, setNodes, reactFlowInstance, reactFlowWrapper
    });

    const { isTempPanning } = useNetworkShortcuts({
        workspace, nodesRef, reactFlowWrapper, cmdCtx, history, instantiateNode
    });

    // 5. Drag & Drop events inside dragDropHooks

    // 6. Selection
    const { onSelectionChange } = useNetworkSelection({
        nodesRef, synapsesRef, neuronsRef, workspace, onSelectedNodesChange, onSelectNode, onSelectEdge, setNodes, setEdges
    });

    // 7. Edges (Connection and Validation)
    const { onConnect, isValidConnection, createStandardConnection } = useNetworkEdges({
        workspace, nodes, edges, neuronsRef, synapsesRef, showMatrixHandles, cmdCtx, history, setPendingTensorConn
    });

    // 8. Topology (requestAnimationFrame loop)
    useNetworkTopology({
        nodesRef, edgesRef, neuronsRef, synapsesRef, setNodes, setEdges,
        historyVersion: history.version, showRawConnections, showMatrixHandles, tick, edges, selectedEdgeId
    });

    // 9. Alignment / API (Expose ref)
    useNetworkAlignment({
        ref, setNodes, setEdges, nodesRef, reactFlowWrapper, cmdCtx, history
    });

    // 10. Mouse Events for Panning
    useEffect(() => {
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

    // Select all shortcut
    useEffect(() => {
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

    const onPaneClick = React.useCallback((e: React.MouseEvent) => {
        if (e.button === 1) {
            onSetToolMode('pan');
        }
    }, [onSetToolMode]);

    return (
        <div className="flex h-full w-full flex-1 bg-slate-900 text-slate-100 overflow-hidden font-sans">
            {workspace === 'build' && <Sidebar />}
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
                    onNodesChange={workspace === 'build' ? onNodesChangeHandler : undefined}
                    onEdgesChange={workspace === 'build' ? onEdgesChangeHandler : undefined}
                    onConnect={workspace === 'build' ? onConnect : undefined}
                    onInit={setReactFlowInstance}
                    onDrop={workspace === 'build' ? dragDropHooks.onDrop : undefined}
                    onDragOver={workspace === 'build' ? dragDropHooks.onDragOver : undefined}
                    onNodeDragStart={workspace === 'build' ? dragDropHooks.onNodeDragStart : undefined}
                    onNodeDrag={workspace === 'build' ? dragDropHooks.onNodeDrag : undefined}
                    onSelectionDragStart={workspace === 'build' ? dragDropHooks.onSelectionDragStart : undefined}
                    onNodeDragStop={workspace === 'build' ? dragDropHooks.onNodeDragStop : undefined}
                    onSelectionDragStop={workspace === 'build' ? dragDropHooks.onSelectionDragStop : undefined}
                    onSelectionChange={onSelectionChange}
                    isValidConnection={isValidConnection}
                    nodeTypes={nodeTypes as any}
                    defaultEdgeOptions={{
                        type: 'straight',
                        markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa' },
                        style: { strokeWidth: 2, stroke: '#60a5fa' },
                        animated: true,
                    }}
                    deleteKeyCode={workspace === 'build' ? ['Backspace', 'Delete'] : null}
                    multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
                    snapToGrid={true}
                    snapGrid={[20, 20]}
                    fitView
                    nodesDraggable={workspace === 'build'}
                    nodesConnectable={workspace === 'build'}
                    elementsSelectable={workspace === 'build'}
                    panOnDrag={toolMode === 'pan' ? [0, 1, 2] : [1, 2]}
                    selectionOnDrag={toolMode === 'select' && workspace === 'build'}
                    panOnScroll={toolMode === 'select'}
                    selectionMode={SelectionMode.Partial}
                    proOptions={{ hideAttribution: true }}
                    onlyRenderVisibleElements={true}
                    className="bg-slate-900"
                    onPaneClick={onPaneClick}
                >
                    <Background color="#334155" gap={20} size={1} />
                    <MiniMap
                        className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl"
                        nodeColor={(node: Node) => {
                            if (node.type === 'layerNode') return 'transparent';
                            if (node.type === 'pixel-matrix') return '#f472b6'; // pink-400
                            if (node.type === 'tensor-node' || (typeof node.type === 'string' && node.type.startsWith('tensor-'))) return '#a855f7'; // purple-500
                            if (node.type === 'input-neuron') return '#10b981';
                            if (node.type === 'output-neuron') return '#f97316';
                            if (node.type === 'bias-neuron') return '#eab308';
                            if (node.type === 'perceptron-neuron') return '#3b82f6';
                            if (node.type === 'mcculloch-pitts-neuron') return '#818cf8';
                            return '#64748b';
                        }}
                        maskColor="rgba(15, 23, 42, 0.7)"
                        position="bottom-right"
                    />
                    <Controls position="bottom-left" />
                </ReactFlow>
            </div>

            <MultiDropModal
                isOpen={dragDropHooks.isMultiDropOpen}
                nodeType={dragDropHooks.pendingDrop?.type || null}
                onClose={dragDropHooks.onMultiDropClose}
                onConfirm={dragDropHooks.handleMultiDropConfirm}
            />

            <TensorConnectionModal
                isOpen={!!pendingTensorConn}
                mode={pendingTensorConn?.step}
                tensor={pendingTensorConn?.step === 'source' ? pendingTensorConn.sourceTensor || null : pendingTensorConn?.targetTensor || null}
                onClose={() => setPendingTensorConn(null)}
                onConfirm={(index) => {
                    if (!pendingTensorConn) return;

                    if (pendingTensorConn.step === 'source') {
                        // Source confirmed
                        if (pendingTensorConn.targetTensor) {
                            // Target is also a tensor, now ask for target index
                            setPendingTensorConn({
                                ...pendingTensorConn,
                                step: 'target',
                                sourceIndex: index
                            });
                        } else {
                            // Target is not a tensor, create standard connection
                            createStandardConnection(pendingTensorConn.params, index);
                            setPendingTensorConn(null);
                        }
                    } else {
                        // Target confirmed
                        createStandardConnection(pendingTensorConn.params, pendingTensorConn.sourceIndex, index);
                        setPendingTensorConn(null);
                    }
                }}
            />
        </div>
    );
});
