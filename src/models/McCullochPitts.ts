import type { INeuron, ISynapse, NeuronType } from './types';

export class McCullochPitts implements INeuron {
    id: string;
    type: NeuronType = 'mcculloch-pitts';
    label: string;
    bias: number; // Threshold configured by user
    output: number = 0;
    netInput: number = 0;
    threshold: number;

    constructor(id: string, threshold: number = 1) {
        this.id = id;
        this.label = 'MCP'; // Default label
        this.bias = threshold; // Limiar
        this.threshold = threshold;
    }

    get size(): number {
        return 1;
    }

    calculateOutput(incomingSynapses: ISynapse[]): number {
        this.threshold = this.bias; // Always use local bias property as threshold

        // Sum regular inputs (ignore edge weights!)
        const sum = incomingSynapses.reduce((acc, synapse) => {
            const preOut = synapse.preSynaptic.output;
            let val = 0;

            if (Array.isArray(preOut)) {
                if (synapse.sourceIndex !== undefined) {
                    if (synapse.sourceIndex >= 0 && synapse.sourceIndex < preOut.length) {
                        val = preOut[synapse.sourceIndex];
                    }
                } else if (synapse.sourceHandle && synapse.sourceHandle.startsWith('pixel-')) {
                    const pixelIndex = parseInt(synapse.sourceHandle.replace('pixel-', ''), 10);
                    if (!isNaN(pixelIndex) && pixelIndex >= 0 && pixelIndex < preOut.length) {
                        val = preOut[pixelIndex];
                    }
                }
            } else {
                val = typeof preOut === 'number' ? preOut : 0;
            }

            // M-P neuron doesn't use synapse weight, just val
            return acc + val;
        }, 0);

        this.netInput = sum;
        this.output = sum >= this.threshold ? 1 : 0;
        return this.output;
    }
}
