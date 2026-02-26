import type { NeuronType } from './NeuronType';

export interface ILayer {
    id: string;
    label: string;
    type: NeuronType;
}
