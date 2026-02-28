import { useEffect, useRef } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import type { NeuralNodeData } from '../types';
import type { INeuron, ISynapse, PixelMatrix } from '../../../models/neural';
import type { NeuronNodeData } from '../types';

export function useNetworkTopology(props: {
    nodesRef: React.MutableRefObject<Node<NeuralNodeData>[]>;
    edgesRef: React.MutableRefObject<Edge[]>;
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    setNodes: React.Dispatch<React.SetStateAction<Node<NeuralNodeData>[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    historyVersion: number;
    showRawConnections: boolean;
    showMatrixHandles: boolean;
    tick: number;
    edges: Edge[];
    selectedEdgeId: string | null;
}) {
    const { nodesRef, edgesRef, neuronsRef, synapsesRef, setNodes, setEdges, historyVersion, showRawConnections, showMatrixHandles, tick, edges, selectedEdgeId } = props;

    const topologyCacheRef = useRef<{ lastHistoryVersion: number; lastShowRawConnections: boolean; edgesToRemove: Set<string>; virtualEdges: Edge[] }>({
        lastHistoryVersion: -1,
        lastShowRawConnections: false,
        edgesToRemove: new Set(),
        virtualEdges: []
    });

    useEffect(() => {
        const rafId = requestAnimationFrame(() => {
            setNodes((nds) => nds.map(n => {
                const neuron = neuronsRef.current.get(n.id);
                if (neuron) {
                    return { ...n, data: { ...n.data, neuron: { ...neuron }, showHandles: showMatrixHandles, tick } };
                }
                return n;
            }));
            setEdges((eds) => {
                const currentNodes = nodesRef.current;

                if (topologyCacheRef.current.lastHistoryVersion !== historyVersion || topologyCacheRef.current.lastShowRawConnections !== showRawConnections) {
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
                                        for (let p = 0; p < totalPixels; p++) {
                                            flattenedSources.push({ node: srcNode, handleId: `pixel-${p}`, neuron: srcNeuron });
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
                                        for (let p = 0; p < totalPixels; p++) {
                                            flattenedTargets.push({ node: tgtNode, handleId: `pixel-in-${p}`, neuron: tgtNeuron });
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

                                        if (requiresStrictMapping) {
                                            if (sIdx !== outputTargetIndex) continue;
                                        }

                                        let targetHandle = 'input';
                                        if (tgtNeuron.type === 'pixel-matrix') {
                                            targetHandle = tgtHandleId || 'pixel-in-0';
                                        } else if (srcNeuronActual.type === 'bias') {
                                            targetHandle = 'bias';
                                        }

                                        // Skip connection check for Bias -> McCulloch-Pitts as these are explicitly disallowed
                                        if (srcNeuronActual.type === 'bias' && tgtNeuron.type === 'mcculloch-pitts') {
                                            continue;
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
                                            // Do not hide the edge if it is currently selected
                                            if (!matchingEdge.selected) {
                                                currentPairEdges.push(matchingEdge.id);
                                            }
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
                                        id: `virtual-${srcLayer.id}__${tgtLayer.id}`,
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
                        lastHistoryVersion: historyVersion,
                        lastShowRawConnections: showRawConnections,
                        edgesToRemove,
                        virtualEdges
                    };
                }

                const { edgesToRemove, virtualEdges } = topologyCacheRef.current;

                const physicalEds = eds.filter(e => !e.id.startsWith('virtual-'));

                // Render physical edges
                const physicalEdges = physicalEds.map(e => {
                    const isSelected = e.id === selectedEdgeId || !!e.selected;
                    if (edgesToRemove.has(e.id) && !isSelected) {
                        return { ...e, hidden: true, style: { ...e.style, opacity: 0, strokeWidth: 0 } };
                    }

                    const synapse = synapsesRef.current.get(e.id);
                    if (synapse) {
                        const targetNode = currentNodes.find(n => n.id === e.target);
                        const targetType = targetNode?.type === 'neuron' ? (targetNode.data as any).neuron?.type : targetNode?.type;
                        const targetNeuronType = targetNode?.type === 'mcculloch-pitts-neuron' ? 'mcculloch-pitts' : (targetNode?.data as any)?.neuron?.type;

                        /* Note: targetNode?.type has the "-neuron" suffix sometimes, but targetNeuronType matches the internal type */
                        const isMpEdge = targetNeuronType === 'mcculloch-pitts';
                        const isOutputEdge = targetType === 'output' || targetType === 'pixel-matrix' || targetNode?.type === 'pixel-matrix';
                        const isBiasEdge = e.targetHandle === 'bias';

                        const isSelected = !!e.selected;
                        const isAnyTensorNode = synapse.preSynaptic.type === 'tensor' || synapse.postSynaptic.type === 'tensor' ||
                            synapse.preSynaptic.type.startsWith('tensor-') || synapse.postSynaptic.type.startsWith('tensor-');

                        let baseColor = isOutputEdge ? '#f97316' : (isBiasEdge ? '#eab308' : (isMpEdge ? '#818cf8' : '#60a5fa'));
                        if (synapse.preSynaptic.type === 'tensor' && !isOutputEdge && !isBiasEdge && !isMpEdge) {
                            baseColor = '#a855f7';
                        }
                        const color = isSelected ? '#ffffff' : baseColor;

                        let labelStr: string | undefined = undefined;
                        if (isAnyTensorNode) {
                            if (synapse.sourceIndex !== undefined && synapse.targetIndex !== undefined) {
                                labelStr = `[${synapse.sourceIndex}] → [${synapse.targetIndex}]`;
                            } else if (synapse.sourceIndex !== undefined) {
                                labelStr = `[${synapse.sourceIndex}]`;
                            } else if (synapse.targetIndex !== undefined) {
                                labelStr = `→ [${synapse.targetIndex}]`;
                            }
                        } else if (!isOutputEdge && !isMpEdge) {
                            labelStr = synapse.weight.toString();
                        }

                        const showLabel = !!labelStr;

                        return {
                            ...e,
                            hidden: false,
                            type: 'straight',
                            selectable: true,
                            focusable: true,
                            interactionWidth: 12,
                            label: labelStr,
                            labelStyle: showLabel ? { fill: isSelected ? '#ffffff' : baseColor, fontWeight: 'bold' } : undefined,
                            labelBgStyle: showLabel ? { fill: isSelected ? '#334155' : '#1e293b', opacity: 0.9 } : undefined,
                            labelBgPadding: showLabel ? [4, 4] : undefined,
                            labelBgBorderRadius: showLabel ? 4 : undefined,
                            style: {
                                stroke: color,
                                strokeWidth: isSelected ? 3 : 2,
                                strokeDasharray: (isOutputEdge || isMpEdge) ? '5,5' : undefined,
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
    }, [tick, neuronsRef, synapsesRef, setNodes, setEdges, showMatrixHandles, historyVersion, showRawConnections, nodesRef, selectedEdgeId]);

    useEffect(() => {
        setNodes((nds) => {
            let changed = false;
            const nextNds = nds.map(n => {
                if ('isBiasProvider' in n.data || n.type === 'neuron') {
                    const isBiasProvider = edgesRef.current.some(e => e.source === n.id && e.targetHandle === 'bias');
                    if ((n.data as NeuronNodeData).isBiasProvider !== isBiasProvider) {
                        changed = true;
                        return { ...n, data: { ...n.data, isBiasProvider } };
                    }
                }
                return n;
            });
            return changed ? nextNds as Node<NeuralNodeData>[] : nds;
        });
    }, [edges, setNodes]); // Reacting to actual edges change, keeping the edges dependency
}
