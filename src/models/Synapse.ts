import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse } from './types';

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
