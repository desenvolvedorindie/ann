import type { INeuron } from './INeuron';

export interface ISynapse {
    id: string;
    preSynaptic: INeuron;
    postSynaptic: INeuron;
    weight: number;
    sourceHandle?: string;
    targetHandle?: string;
    sourceIndex?: number;
    targetIndex?: number;
}
