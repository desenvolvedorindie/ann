import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export class InputNeuron implements INeuron {
    id: string;
    type: NeuronType = 'input';
    label: string;
    output: number = 0; // The external value provided to this input

    constructor(label: string = 'Input') {
        this.id = uuidv4();
        this.label = label;
    }

    get size(): number {
        return 1;
    }

    // Input neurons don't calculate output from incoming synapses; their output is set externally.
    // The interface requires this method, but it won't use the incomingSynapses parameter.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calculateOutput(_incomingSynapses: ISynapse[] = []): number {
        return this.output;
    }
}
