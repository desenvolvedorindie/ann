import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export class McCullochPitts implements INeuron {
    id: string;
    type: NeuronType = 'mcculloch-pitts';
    label: string;
    bias: number; // For M-P, this can act as the threshold
    output: number = 0;
    netInput: number = 0;

    constructor(label: string = 'M-P Neuron', threshold: number = 0) {
        this.id = uuidv4();
        this.label = label;
        this.bias = threshold;
    }

    // M-P neurons use a step function based on the threshold (bias)
    calculateOutput(incomingSynapses: ISynapse[]): number {
        // Find synapse connected to the bias handle
        const biasSynapse = incomingSynapses.find(s => s.targetHandle === 'bias');

        // Threshold is determined by the bias connection, defaults to 0 if not connected
        // Bias connections act directly passing the output value, disregarding weight
        const biasOut = biasSynapse ? biasSynapse.preSynaptic.output : 0;
        this.bias = typeof biasOut === 'number' ? biasOut : 0; // Bias must be a number for now, matrix not supported as bias directly

        // Sum comes from regular input connections (not bias)
        const inputSynapses = incomingSynapses.filter(s => s.targetHandle !== 'bias');
        const sum = inputSynapses.reduce((acc, synapse) => {
            const preOut = synapse.preSynaptic.output;
            let val = 0;

            if (Array.isArray(preOut)) {
                // If it's a matrix, check the specific pixel connection via sourceHandle (e.g., 'pixel-5')
                if (synapse.sourceHandle && synapse.sourceHandle.startsWith('pixel-')) {
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
        this.output = sum >= this.bias ? 1 : 0;
        return this.output;
    }
}
