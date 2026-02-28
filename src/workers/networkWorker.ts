import * as tf from '@tensorflow/tfjs';
import type { NeuronType } from '../models/NeuronType';

export interface WorkerNodeData {
    id: string;
    type: NeuronType;
    output: number[];
    shape?: number[];
    order?: number;
    width?: number;
    height?: number;
    operationType?: string;
    bias?: number;
    activationFn?: string;
}

export interface WorkerEdgeData {
    id: string;
    source: string;
    target: string;
    weight: number;
    sourceIndex?: number;
    targetIndex?: number;
    targetHandle?: string;
}

self.onmessage = async (e) => {
    if (e.data.type === 'EXECUTE') {
        const { nodes, edges } = e.data as { nodes: WorkerNodeData[], edges: WorkerEdgeData[] };

        // 1. Build adjacency list for topological sort
        const inDegree = new Map<string, number>();
        const adjList = new Map<string, WorkerEdgeData[]>();
        const nodeMap = new Map<string, WorkerNodeData>();

        nodes.forEach(n => {
            inDegree.set(n.id, 0);
            adjList.set(n.id, []);
            nodeMap.set(n.id, n);
            // Initialize flat outputs if needed
            if (!n.output) n.output = [];
        });

        edges.forEach(edge => {
            adjList.get(edge.source)?.push(edge);
            inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
        });

        // 2. Queue zero incoming degree nodes
        const queue: string[] = [];
        nodes.forEach(n => {
            if (inDegree.get(n.id) === 0) {
                queue.push(n.id);
            }
        });

        const sorted: string[] = [];
        while (queue.length > 0) {
            const current = queue.shift()!;
            sorted.push(current);
            adjList.get(current)?.forEach(edge => {
                const tgt = edge.target;
                const currentDegree = inDegree.get(tgt) || 0;
                inDegree.set(tgt, currentDegree - 1);
                if (inDegree.get(tgt) === 0) {
                    queue.push(tgt);
                }
            });
        }

        // 3. Execution using TensorFlow.js for tensor ops, JS for classic ops
        const outputs: Record<string, number[]> = {};
        const shapes: Record<string, number[]> = {};

        // Helper to retrieve preSynaptic output safely
        const getSourceOutput = (edge: WorkerEdgeData) => {
            return outputs[edge.source] || nodeMap.get(edge.source)?.output || [];
        };

        const getSourceShape = (edge: WorkerEdgeData) => {
            return shapes[edge.source] || nodeMap.get(edge.source)?.shape || [getSourceOutput(edge).length];
        };

        tf.tidy(() => {
            sorted.forEach(nodeId => {
                const node = nodeMap.get(nodeId)!;
                const incomingEdges = edges.filter(e => e.target === nodeId);

                let currentOutput = node.output ? [...node.output] : [];
                let currentShape = node.shape || [currentOutput.length];

                if (incomingEdges.length > 0) {
                    if (node.type === 'tensor') {
                        // Tensor maps inputs via targetIndex
                        incomingEdges.forEach(edge => {
                            let inVal = 0;
                            const srcOut = getSourceOutput(edge);
                            if (edge.sourceIndex !== undefined && edge.sourceIndex >= 0 && edge.sourceIndex < srcOut.length) {
                                inVal = srcOut[edge.sourceIndex];
                            } else if (srcOut.length > 0) {
                                inVal = srcOut[0];
                            }

                            if (edge.targetIndex !== undefined && edge.targetIndex >= 0 && edge.targetIndex < currentOutput.length) {
                                currentOutput[edge.targetIndex] = inVal; // Ignoring weight for Tensor passthrough
                            }
                        });
                    } else if (node.type === 'pixel-matrix') {
                        currentOutput.fill(0);
                        incomingEdges.forEach(edge => {
                            let inVal = 0;
                            const srcOut = getSourceOutput(edge);
                            if (edge.sourceIndex !== undefined && edge.sourceIndex >= 0 && edge.sourceIndex < srcOut.length) {
                                inVal = srcOut[edge.sourceIndex];
                            } else if (srcOut.length > 0) {
                                inVal = typeof srcOut[0] === 'number' ? srcOut[0] : 0;
                            }

                            if (edge.targetHandle?.startsWith('pixel-in-')) {
                                const idx = parseInt(edge.targetHandle.replace('pixel-in-', ''), 10);
                                if (!isNaN(idx) && idx >= 0 && idx < currentOutput.length) {
                                    currentOutput[idx] = inVal;
                                }
                            }
                        });
                    } else if (node.type === 'tensor-elem-op' || node.type === 'tensor-reduce-op' || node.type === 'tensor-matrix-op' || node.type === 'tensor-reshape-op') {
                        // TensorFlow.js Operations
                        try {
                            const inputTensors = incomingEdges.map(edge => {
                                const arr = getSourceOutput(edge);
                                const shape = getSourceShape(edge);
                                return tf.tensor(arr, shape);
                            });

                            if (inputTensors.length > 0) {
                                let res: tf.Tensor;

                                if (node.type === 'tensor-elem-op') {
                                    res = inputTensors[0];
                                    switch (node.operationType) {
                                        case 'add':
                                            for (let i = 1; i < inputTensors.length; i++) res = tf.add(res, inputTensors[i]);
                                            break;
                                        case 'sub':
                                            for (let i = 1; i < inputTensors.length; i++) res = tf.sub(res, inputTensors[i]);
                                            break;
                                        case 'mul':
                                            for (let i = 1; i < inputTensors.length; i++) res = tf.mul(res, inputTensors[i]);
                                            break;
                                        case 'div':
                                            for (let i = 1; i < inputTensors.length; i++) res = tf.div(res, inputTensors[i]);
                                            break;
                                        case 'relu':
                                            if (inputTensors.length > 1) {
                                                for (let i = 1; i < inputTensors.length; i++) res = tf.add(res, inputTensors[i]);
                                            }
                                            res = tf.relu(res);
                                            break;
                                        case 'sigmoid':
                                            if (inputTensors.length > 1) {
                                                for (let i = 1; i < inputTensors.length; i++) res = tf.add(res, inputTensors[i]);
                                            }
                                            res = tf.sigmoid(res);
                                            break;
                                    }
                                } else if (node.type === 'tensor-reduce-op') {
                                    // reduce op
                                    const stack = inputTensors.length > 1 ? tf.concat(inputTensors) : inputTensors[0];
                                    switch (node.operationType) {
                                        case 'sum': res = tf.sum(stack); break;
                                        case 'mean': res = tf.mean(stack); break;
                                        case 'max': res = tf.max(stack); break;
                                        case 'min': res = tf.min(stack); break;
                                        case 'argmax': res = tf.argMax(stack); break;
                                        default: res = tf.sum(stack); break;
                                    }
                                } else if (node.type === 'tensor-reshape-op') {
                                    // reshape op
                                    const input = inputTensors[0];
                                    try {
                                        switch (node.operationType) {
                                            case 'reshape':
                                                if ((node as any).targetShape) {
                                                    res = tf.reshape(input, (node as any).targetShape);
                                                } else { res = input; }
                                                break;
                                            case 'transpose':
                                                res = tf.transpose(input);
                                                break;
                                            case 'squeeze':
                                                res = tf.squeeze(input, (node as any).axis !== undefined ? [(node as any).axis] : undefined);
                                                break;
                                            case 'unsqueeze':
                                                res = tf.expandDims(input, (node as any).axis !== undefined ? (node as any).axis : 0);
                                                break;
                                            case 'concat':
                                                if (inputTensors.length > 1) {
                                                    res = tf.concat(inputTensors, (node as any).axis !== undefined ? (node as any).axis : 0);
                                                } else { res = input; }
                                                break;
                                            case 'stack':
                                                if (inputTensors.length > 1) {
                                                    res = tf.stack(inputTensors, (node as any).axis !== undefined ? (node as any).axis : 0);
                                                } else { res = input; }
                                                break;
                                            default: res = input; break;
                                        }
                                    } catch (e) {
                                        console.error('TFJS Reshape error', e);
                                        res = input; // fallback
                                    }
                                } else {
                                    // matrix op (will infer type === 'tensor-matrix-op')
                                    if (inputTensors.length >= 2) {
                                        switch (node.operationType) {
                                            case 'matmul':
                                                res = tf.matMul(inputTensors[0], inputTensors[1]);
                                                break;
                                            case 'dot':
                                                res = tf.dot(inputTensors[0], inputTensors[1]);
                                                break;
                                            case 'outer':
                                                res = tf.outerProduct(
                                                    (inputTensors[0].shape.length > 1 ? inputTensors[0].flatten() : inputTensors[0]) as tf.Tensor1D,
                                                    (inputTensors[1].shape.length > 1 ? inputTensors[1].flatten() : inputTensors[1]) as tf.Tensor1D
                                                );
                                                break;
                                            default:
                                                res = tf.matMul(inputTensors[0], inputTensors[1]);
                                                break;
                                        }
                                    } else {
                                        res = inputTensors[0]; // fallback if only 1 input
                                    }
                                }

                                currentShape = res!.shape;
                                currentOutput = Array.from(res!.dataSync());
                            }
                        } catch (e) {
                            console.error(`TFJS Operation Failed for node ${nodeId}`, e);
                        }
                    } else if (node.type === 'perceptron' || node.type === 'output' || node.type === 'mcculloch-pitts') {
                        // Standard MLP logic
                        let sum = node.bias || 0;
                        incomingEdges.forEach(edge => {
                            const srcOut = getSourceOutput(edge);
                            let inVal = 0;
                            if (srcOut.length > 0) {
                                if (edge.sourceIndex !== undefined && edge.sourceIndex >= 0 && edge.sourceIndex < srcOut.length) {
                                    inVal = srcOut[edge.sourceIndex];
                                } else {
                                    inVal = srcOut[0];
                                }
                            }
                            sum += inVal * edge.weight;
                        });

                        if (node.type === 'mcculloch-pitts') {
                            // Threshold activation at 0
                            currentOutput = [(sum > 0) ? 1 : 0];
                        } else {
                            // Default perceptron/output behavior, could include relu/sigmoid if stored
                            if (node.activationFn === 'relu') {
                                currentOutput = [Math.max(0, sum)];
                            } else if (node.activationFn === 'sigmoid') {
                                currentOutput = [1 / (1 + Math.exp(-sum))];
                            } else if (node.activationFn === 'tanh') {
                                currentOutput = [Math.tanh(sum)];
                            } else {
                                // Default pass-through (linear) if not specified or output node
                                currentOutput = [sum];
                            }
                        }
                    }
                }

                outputs[nodeId] = currentOutput;
                shapes[nodeId] = currentShape;
            });
        });

        self.postMessage({ type: 'EXECUTE_RESULT', outputs, shapes });
    }
};
