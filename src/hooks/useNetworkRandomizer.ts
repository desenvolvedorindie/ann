import { useCallback } from 'react';
import type { RandomizeOptions } from '../components/RandomizePanel';
import type { INeuron, ISynapse } from '../models/neural';

export function useNetworkRandomizer(props: {
    neuronsRef: React.MutableRefObject<Map<string, INeuron>>;
    synapsesRef: React.MutableRefObject<Map<string, ISynapse>>;
    setTick: React.Dispatch<React.SetStateAction<number>>;
}) {
    const { neuronsRef, synapsesRef, setTick } = props;

    const handleRandomize = useCallback((options: RandomizeOptions) => {
        let tickTriggered = false;

        if (options.weight || options.biasWeight) {
            const edges = Array.from(synapsesRef.current.values());
            edges.forEach(e => {
                const isBias = e.preSynaptic.type === 'bias';
                if (options.biasWeight && isBias) {
                    e.weight = Number(((Math.random() * 2) - 1).toFixed(4));
                    tickTriggered = true;
                } else if (options.weight && !isBias) {
                    e.weight = Number(((Math.random() * 2) - 1).toFixed(4));
                    tickTriggered = true;
                }
            });
        }

        if (options.input || options.tensor || options.pixelMatrix) {
            const nodes = Array.from(neuronsRef.current.values());
            nodes.forEach(n => {
                if (options.input && n.type === 'input') {
                    n.output = Number(((Math.random() * 2) - 1).toFixed(4));
                    tickTriggered = true;
                }

                if (options.tensor && n.type === 'tensor') {
                    const tensor = n as any;
                    if (Array.isArray(tensor.output)) {
                        tensor.output = tensor.output.map(() => Number(((Math.random() * 2) - 1).toFixed(4)));
                        tickTriggered = true;
                    }
                }

                if (options.pixelMatrix && n.type === 'pixel-matrix') {
                    const matrix = n as any;
                    if (Array.isArray(matrix.output)) {
                        matrix.output = matrix.output.map(() => Number(((Math.random() * 2) - 1).toFixed(4)));
                        tickTriggered = true;
                    }
                }
            });
        }

        if (tickTriggered) setTick(t => t + 1);
    }, [neuronsRef, synapsesRef, setTick]);

    return { handleRandomize };
}
