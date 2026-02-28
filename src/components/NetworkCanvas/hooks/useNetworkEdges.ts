import { useCallback } from 'react';
import type { Connection, Edge, Node } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { NeuralNodeData, NetworkCanvasProps } from '../types';
import type { INeuron, ISynapse, Tensor } from '../../../models/neural';
import { Synapse } from '../../../models/neural';
import type { PixelMatrix } from '../../../models/neural';
import { AddEdgesCommand } from '../../../commands';

export function useNetworkEdges(props: {
    workspace: NetworkCanvasProps['workspace'];
    nodes: Node<NeuralNodeData>[];
    edges: Edge[];
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    showMatrixHandles: boolean;
    cmdCtx: any;
    history: any;
    setPendingTensorConn: (conn: { step: 'source' | 'target'; params: Connection; sourceTensor?: Tensor; targetTensor?: Tensor; sourceIndex?: number } | null) => void;
}) {
    const { workspace, nodes, edges, neuronsRef, synapsesRef, showMatrixHandles, cmdCtx, history, setPendingTensorConn } = props;

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

                    validSources.forEach((srcPoint, sIdx) => {
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

                        // Allow bias connections, no longer restricted
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
                            const isMpEdge = tgtNeuron.type === 'mcculloch-pitts';
                            const isBiasEdge = targetHandle === 'bias';
                            const baseColor = isOutputEdge ? '#f97316' : (isBiasEdge ? '#eab308' : (isMpEdge ? '#818cf8' : '#60a5fa'));
                            const color = isOutputEdge ? '#f97316' : baseColor;
                            const showLabel = !isOutputEdge && !isMpEdge;

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
                                style: { stroke: color, strokeWidth: 2, strokeDasharray: (isOutputEdge || isMpEdge) ? '5,5' : undefined },
                                markerEnd: { type: MarkerType.ArrowClosed, color },
                            });
                        }
                    });

                    if (requiresStrictMapping) {
                        outputTargetIndex++;
                    }
                });

                if (newEdges.length > 0) {
                    const cmd = new AddEdgesCommand(cmdCtx, newEdges, newSynapses, `Macro: ${newEdges.length} connections`);
                    history.push(cmd);
                }
                return;
            }

            if (preNeuron && postNeuron) {
                const isSourceTensor = preNeuron.type === 'tensor';
                const isTargetTensor = postNeuron.type === 'tensor';
                const isTargetOp = (postNeuron.type as string).startsWith('tensor-');
                const isSourceOp = (preNeuron.type as string).startsWith('tensor-');

                // Skip modal if connecting Tensor <-> TensorOp
                const skipModal = (isSourceTensor && isTargetOp) || (isTargetTensor && isSourceOp);

                if ((isSourceTensor || isTargetTensor) && !skipModal) {
                    setPendingTensorConn({
                        step: isSourceTensor ? 'source' : 'target',
                        params,
                        sourceTensor: isSourceTensor ? (preNeuron as unknown as Tensor) : undefined,
                        targetTensor: isTargetTensor ? (postNeuron as unknown as Tensor) : undefined,
                    });
                    return;
                }

                createStandardConnection(params);
            }
        },
        [synapsesRef, neuronsRef, edges, nodes, cmdCtx, history, showMatrixHandles, setPendingTensorConn]
    );

    const createStandardConnection = useCallback((params: Connection, sourceIndex?: number, targetIndex?: number) => {
        if (!params.source || !params.target) return;

        const preNeuron = neuronsRef.current.get(params.source);
        const postNeuron = neuronsRef.current.get(params.target);

        if (preNeuron && postNeuron) {
            if (postNeuron.type === 'output') {
                const hasExistingConnection = edges.some(e => e.target === params.target);
                if (hasExistingConnection) return;
            }

            const synapse = new Synapse(preNeuron, postNeuron, 1, params.sourceHandle || undefined, params.targetHandle || 'input', sourceIndex, targetIndex);
            const newSynapses = new Map<string, ISynapse>();
            newSynapses.set(synapse.id, synapse);

            const isOutputEdge = postNeuron.type === 'output' || postNeuron.type === 'pixel-matrix';
            const isMpEdge = postNeuron.type === 'mcculloch-pitts';
            const isBiasEdge = params.targetHandle === 'bias';
            const baseColor = isOutputEdge ? '#f97316' : (isBiasEdge ? '#eab308' : (isMpEdge ? '#818cf8' : '#60a5fa'));
            const color = preNeuron.type === 'tensor' ? '#a855f7' : (isOutputEdge ? '#f97316' : baseColor);

            let labelStr = undefined;
            const isAnyTensorNode = preNeuron.type === 'tensor' || postNeuron.type === 'tensor' || preNeuron.type.startsWith('tensor-') || postNeuron.type.startsWith('tensor-');

            if (isAnyTensorNode) {
                // Tensors only have a label if indexing is involved (e.g Element extraction)
                if (sourceIndex !== undefined && targetIndex !== undefined) {
                    labelStr = `[${sourceIndex}] → [${targetIndex}]`;
                } else if (sourceIndex !== undefined) {
                    labelStr = `[${sourceIndex}]`;
                } else if (targetIndex !== undefined) {
                    labelStr = `→ [${targetIndex}]`;
                }
            } else if (!isOutputEdge && !isMpEdge) {
                // Normal connections show the synapse weight
                labelStr = synapse.weight.toString();
            }

            const newEdge: Edge = {
                id: synapse.id,
                source: params.source,
                sourceHandle: params.sourceHandle,
                target: params.target,
                targetHandle: params.targetHandle,
                label: labelStr,
                labelStyle: labelStr ? { fill: color, fontWeight: 'bold' } : undefined,
                labelBgStyle: labelStr ? { fill: '#1e293b', opacity: 0.8 } : undefined,
                labelBgPadding: labelStr ? [4, 4] : undefined,
                labelBgBorderRadius: labelStr ? 4 : undefined,
                animated: true,
                type: 'straight',
                zIndex: showMatrixHandles ? 100 : -10,
                style: { stroke: color, strokeWidth: 2, strokeDasharray: (isOutputEdge || isMpEdge) ? '5,5' : undefined },
                markerEnd: { type: MarkerType.ArrowClosed, color },
            };

            const cmd = new AddEdgesCommand(cmdCtx, [newEdge], newSynapses, `Conectar sinapse`);
            history.push(cmd);
        }
    }, [synapsesRef, neuronsRef, edges, cmdCtx, history, showMatrixHandles]);

    const isValidConnection = useCallback((connection: Edge | Connection) => {
        if (workspace !== 'build') return false;

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

        const targetType = (targetNode?.data as any)?.neuron?.type;

        // Accept inward connections for Pixel Matrix
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

    return {
        onConnect,
        isValidConnection,
        createStandardConnection
    };
}
