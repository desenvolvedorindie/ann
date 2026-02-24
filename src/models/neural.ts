import { v4 as uuidv4 } from 'uuid';

export type NeuronType = 'input' | 'mcculloch-pitts';

export interface INeuron {
    id: string;
    type: NeuronType;
    label: string;
    bias: number;
    output: number;
    netInput?: number;
    calculateOutput(incomingSynapses: ISynapse[]): number;
}

export interface ISynapse {
    id: string;
    preSynaptic: INeuron;
    postSynaptic: INeuron;
    weight: number;
    targetHandle?: string;
}

export class InputNeuron implements INeuron {
    id: string;
    type: NeuronType = 'input';
    label: string;
    bias: number = 0; // Not strictly used for input, but part of interface
    output: number = 0; // The external value provided to this input

    constructor(label: string = 'Input') {
        this.id = uuidv4();
        this.label = label;
    }

    // Input neurons don't calculate output from incoming synapses; their output is set externally.
    // The interface requires this method, but it won't use the incomingSynapses parameter.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calculateOutput(_incomingSynapses: ISynapse[] = []): number {
        return this.output;
    }
}

export class MccullochPitts implements INeuron {
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
        this.bias = biasSynapse ? biasSynapse.preSynaptic.output : 0;

        // Sum comes from regular input connections (not bias)
        const inputSynapses = incomingSynapses.filter(s => s.targetHandle !== 'bias');
        const sum = inputSynapses.reduce((acc, synapse) => acc + (synapse.preSynaptic.output * synapse.weight), 0);

        this.netInput = sum;
        this.output = sum >= this.bias ? 1 : 0;
        return this.output;
    }
}

export class Synapse implements ISynapse {
    id: string;
    preSynaptic: INeuron;
    postSynaptic: INeuron;
    weight: number;
    targetHandle?: string;

    constructor(preSynaptic: INeuron, postSynaptic: INeuron, weight: number = 1, targetHandle?: string) {
        this.id = uuidv4();
        this.preSynaptic = preSynaptic;
        this.postSynaptic = postSynaptic;
        this.weight = weight;
        this.targetHandle = targetHandle;
    }
}
