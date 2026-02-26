import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export class OutputNeuron implements INeuron {
    id: string;
    type: NeuronType = 'output';
    label: string;
    output: number = 0;

    constructor(label: string = 'Output Neuron') {
        this.id = uuidv4();
        this.label = label;
    }

    get size(): number {
        return 1;
    }

    calculateOutput(incomingSynapses: ISynapse[]): number {
        if (incomingSynapses.length > 0) {
            const synapse = incomingSynapses[0];
            const preOut = synapse.preSynaptic.output;

            if (Array.isArray(preOut)) {
                if (synapse.sourceHandle && synapse.sourceHandle.startsWith('pixel-')) {
                    const pixelIndex = parseInt(synapse.sourceHandle.replace('pixel-', ''), 10);
                    if (!isNaN(pixelIndex) && pixelIndex >= 0 && pixelIndex < preOut.length) {
                        this.output = preOut[pixelIndex];
                    } else {
                        this.output = 0;
                    }
                } else {
                    this.output = 0;
                }
            } else {
                this.output = typeof preOut === 'number' ? preOut : 0;
            }
        } else {
            this.output = 0;
        }
        return this.output as number;
    }
}
