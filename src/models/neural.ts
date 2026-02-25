import { v4 as uuidv4 } from 'uuid';

export type NeuronType = 'input' | 'mcculloch-pitts' | 'output' | 'pixel-matrix';

export interface INeuron {
    id: string;
    type: NeuronType;
    label: string;
    bias: number;
    output: number | number[];
    netInput?: number;
    calculateOutput(incomingSynapses: ISynapse[]): number | number[];
}

export type NeuronPartialUpdate = Partial<INeuron> & { width?: number; height?: number; };

export interface ISynapse {
    id: string;
    preSynaptic: INeuron;
    postSynaptic: INeuron;
    weight: number;
    sourceHandle?: string;
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

export class OutputNeuron implements INeuron {
    id: string;
    type: NeuronType = 'output';
    label: string;
    bias: number = 0;
    output: number = 0;

    constructor(label: string = 'Output Neuron') {
        this.id = uuidv4();
        this.label = label;
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

export class PixelMatrix implements INeuron {
    id: string;
    type: NeuronType = 'pixel-matrix';
    label: string;
    bias: number = 0;
    output: number[] = [];

    width: number;
    height: number;

    constructor(label: string = 'Pixel Matrix', width: number = 30, height: number = 30) {
        this.id = uuidv4();
        this.label = label;
        this.width = width;
        this.height = height;
        this.output = new Array(width * height).fill(0);
    }

    calculateOutput(_incomingSynapses: ISynapse[] = []): number[] {
        return this.output;
    }
}

export class Synapse implements ISynapse {
    id: string;
    preSynaptic: INeuron;
    postSynaptic: INeuron;
    weight: number;
    sourceHandle?: string;
    targetHandle?: string;

    constructor(preSynaptic: INeuron, postSynaptic: INeuron, weight: number = 1, sourceHandle?: string, targetHandle?: string) {
        this.id = uuidv4();
        this.preSynaptic = preSynaptic;
        this.postSynaptic = postSynaptic;
        this.weight = weight;
        this.sourceHandle = sourceHandle;
        this.targetHandle = targetHandle;
    }
}
