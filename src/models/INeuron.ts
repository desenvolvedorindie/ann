import type { NeuronType } from './NeuronType';
import type { ISynapse } from './ISynapse';

export interface INeuron {
    id: string;
    type: NeuronType;
    label: string;
    output: number | number[];
    calculateOutput(incomingSynapses: ISynapse[]): number | number[];
}

export type NeuronPartialUpdate = Partial<INeuron> & { width?: number; height?: number; };
