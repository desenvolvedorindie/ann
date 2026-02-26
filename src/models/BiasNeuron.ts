import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

/**
 * BiasNeuron always outputs 1.
 * When connected to a McCulloch-Pitts neuron via the 'input' handle,
 * the synapse weight becomes the effective bias contribution:
 *   net_input += weight * 1 = weight
 * This allows a single BiasNeuron to be reused across multiple M-P neurons,
 * with each synapse independently holding its own bias value (weight).
 */
export class BiasNeuron implements INeuron {
    id: string;
    type: NeuronType = 'bias';
    label: string;
    output: number = 1; // Bias neurons always output 1

    constructor(label: string = 'Bias') {
        this.id = uuidv4();
        this.label = label;
    }

    get size(): number {
        return 1;
    }

    // Bias neurons have a fixed output of 1 — no computation needed
    calculateOutput(_incomingSynapses: ISynapse[]): number {
        this.output = 1;
        return 1;
    }
}
