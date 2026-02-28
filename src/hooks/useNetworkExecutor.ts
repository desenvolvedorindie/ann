import { useEffect, useRef, useCallback } from 'react';
import type { INeuron, ISynapse } from '../models/neural';

export function useNetworkExecutor(props: {
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    setTick: React.Dispatch<React.SetStateAction<number>>;
}) {
    const { neuronsRef, synapsesRef, setTick } = props;
    const networkWorkerRef = useRef<Worker | null>(null);

    useEffect(() => {
        networkWorkerRef.current = new Worker(new URL('../workers/networkWorker.ts', import.meta.url), { type: 'module' });

        networkWorkerRef.current.onmessage = (e) => {
            if (e.data.type === 'EXECUTE_RESULT') {
                const { outputs, shapes } = e.data;
                let needsRender = false;

                neuronsRef.current.forEach(neuron => {
                    if (outputs[neuron.id]) {
                        neuron.output = outputs[neuron.id];
                        if ((neuron.type === 'tensor' || neuron.type.startsWith('tensor-')) && shapes[neuron.id]) {
                            (neuron as any).shape = shapes[neuron.id];
                        }
                        needsRender = true;
                    }
                });

                if (needsRender) {
                    setTick(t => t + 1);
                }
            }
        };

        return () => {
            networkWorkerRef.current?.terminate();
        };
    }, [neuronsRef, setTick]);

    const executeNetwork = useCallback(() => {
        if (!networkWorkerRef.current) return;

        const edges = Array.from(synapsesRef.current.values()).map(e => ({
            id: e.id,
            source: e.preSynaptic.id,
            target: e.postSynaptic.id,
            weight: e.weight,
            sourceIndex: e.sourceIndex,
            targetIndex: e.targetIndex,
            targetHandle: e.targetHandle
        }));

        const nodes = Array.from(neuronsRef.current.values()).map(n => {
            const base = {
                id: n.id,
                type: n.type,
                output: n.output || [],
            };
            if (n.type === 'tensor' || n.type.startsWith('tensor-')) {
                (base as any).shape = (n as any).shape;
                (base as any).order = (n as any).order;
                (base as any).operationType = (n as any).operationType;
            } else if (n.type === 'pixel-matrix') {
                (base as any).width = (n as any).width;
                (base as any).height = (n as any).height;
            } else if (n.type === 'perceptron') {
                (base as any).bias = (n as any).bias;
                (base as any).activationFn = (n as any).activationFn;
            }
            return base;
        });

        networkWorkerRef.current.postMessage({
            type: 'EXECUTE',
            nodes,
            edges
        });
    }, [neuronsRef, synapsesRef]);

    return { executeNetwork };
}
