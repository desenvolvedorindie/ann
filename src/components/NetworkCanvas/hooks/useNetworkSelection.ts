import { useCallback, useEffect } from 'react';
import type { OnSelectionChangeParams, Node, Edge } from '@xyflow/react';
import type { NeuralNodeData, NetworkCanvasProps } from '../types';

export function useNetworkSelection(props: {
    nodesRef: React.MutableRefObject<Node<NeuralNodeData>[]>;
    synapsesRef: React.MutableRefObject<Map<string, any>>;
    neuronsRef: React.MutableRefObject<Map<string, any>>;
    workspace: NetworkCanvasProps['workspace'];
    onSelectedNodesChange: NetworkCanvasProps['onSelectedNodesChange'];
    onSelectNode: NetworkCanvasProps['onSelectNode'];
    onSelectEdge: NetworkCanvasProps['onSelectEdge'];
    setNodes: React.Dispatch<React.SetStateAction<Node<NeuralNodeData>[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
}) {
    const { nodesRef, synapsesRef, neuronsRef, workspace, onSelectedNodesChange, onSelectNode, onSelectEdge, setNodes, setEdges } = props;

    const onSelectionChange = useCallback((params: OnSelectionChangeParams) => {
        const selectedNIds = params.nodes.map(n => n.id);
        onSelectedNodesChange(selectedNIds);

        if (params.nodes.length > 0) {
            const selectedNode = params.nodes[0];
            if (selectedNode.type === 'layerNode') {
                const layerObj = (selectedNode.data as any).layer;
                const childIds = nodesRef.current.filter(n => n.parentId === selectedNode.id).map(n => n.id);
                onSelectNode(layerObj, childIds);
            } else {
                const neuronObj = neuronsRef.current.get(selectedNode.id) || null;
                onSelectNode(neuronObj, undefined, selectedNode.parentId);
            }
            // If we selected a Node, clear Edge selection view
            onSelectEdge(null);
        } else if (params.edges.length > 0) {
            const selectedEdgeId = params.edges[0].id;
            const synapseObj = synapsesRef.current.get(selectedEdgeId) || null;
            onSelectNode(null); // Clear node selection view
            onSelectEdge(synapseObj);
        } else {
            // Nothing is selected
            onSelectNode(null);
            onSelectEdge(null);
        }
    }, [neuronsRef, synapsesRef, onSelectNode, onSelectEdge, nodesRef, onSelectedNodesChange]);

    // Clear selection when navigating away from or to workspaces
    useEffect(() => {
        setNodes(nds => nds.map(n => n.selected ? { ...n, selected: false } : n));
        setEdges(eds => eds.map(e => e.selected ? { ...e, selected: false } : e));
        onSelectNode(null);
        onSelectEdge(null);
    }, [workspace, onSelectNode, onSelectEdge, setNodes, setEdges]);

    return { onSelectionChange };
}
