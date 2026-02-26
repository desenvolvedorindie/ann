import type { NeuronType } from './NeuronType';
import type { ISynapse } from './ISynapse';

export interface INeuron {
    id: string;
    type: NeuronType;
    label: string;
    output: number | number[];
    get size(): number;
    calculateOutput(incomingSynapses: ISynapse[]): number | number[];
}

export type NeuronPartialUpdate = Partial<INeuron> & { width?: number; height?: number; };
