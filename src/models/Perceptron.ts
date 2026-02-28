import type { INeuron, ISynapse, NeuronType } from './types';

export class Perceptron implements INeuron {
    id: string;
    type: NeuronType = 'perceptron';
    label: string;
    bias: number; // Active threshold — updated at runtime from bias synapse weight
    output: number = 0;
    netInput: number = 0;
    threshold: number;

    constructor(id: string, threshold: number = 0) {
        this.id = id;
        this.label = 'Perceptron'; // Default label if not provided
        this.bias = threshold;
        this.threshold = threshold;
    }

    get size(): number {
        return 1;
    }

    // M-P step function: output = 1 if netInput >= threshold, else 0
    //
    // Threshold resolution order:
    //   1. If there is a synapse on the 'bias' targetHandle, its WEIGHT is the threshold.
    //      (BiasNeuron always outputs 1, so weight × 1 = weight = threshold)
    //   2. Otherwise, the fixed `this.bias` property is used (editable in Properties Panel).
    //
    // Regular input synapses (targetHandle !== 'bias') contribute weight × output to netInput.
    calculateOutput(incomingSynapses: ISynapse[]): number {
        // Determine threshold from bias synapse weight (if connected)
        const biasSynapse = incomingSynapses.find(s => s.targetHandle === 'bias');
        const threshold = biasSynapse ? biasSynapse.weight : this.bias;
        this.bias = threshold; // keep in sync for display

        // Sum regular inputs
        const inputSynapses = incomingSynapses.filter(s => s.targetHandle !== 'bias');
        const sum = inputSynapses.reduce((acc, synapse) => {
            const preOut = synapse.preSynaptic.output;
            let val = 0;

            if (Array.isArray(preOut)) {
                // Determine which element of the array to read
                if (synapse.sourceIndex !== undefined) {
                    // It's a connection from a Tensor
                    if (synapse.sourceIndex >= 0 && synapse.sourceIndex < preOut.length) {
                        val = preOut[synapse.sourceIndex];
                    }
                } else if (synapse.sourceHandle && synapse.sourceHandle.startsWith('pixel-')) {
                    // It's a connection from a PixelMatrix (legacy sourceHandle format)
                    const pixelIndex = parseInt(synapse.sourceHandle.replace('pixel-', ''), 10);
                    if (!isNaN(pixelIndex) && pixelIndex >= 0 && pixelIndex < preOut.length) {
                        val = preOut[pixelIndex];
                    }
                }
            } else {
                val = typeof preOut === 'number' ? preOut : 0;
            }

            return acc + (val * synapse.weight);
        }, 0);

        this.netInput = sum;
        this.output = sum >= threshold ? 1 : 0;
        return this.output;
    }
}
