import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export type ReshapeOperation = 'reshape' | 'transpose' | 'squeeze' | 'unsqueeze' | 'concat' | 'stack';

export class TensorReshapeOp implements INeuron {
    id: string;
    type: NeuronType = 'tensor-reshape-op';
    label: string;
    output: number[] = [];
    shape: number[] = [];

    operationType: ReshapeOperation;
    targetShape?: number[]; // Used for reshape operations
    axis?: number; // Used for concat/stack/squeeze/unsqueeze

    constructor(
        label: string = 'Reshape Op',
        operationType: ReshapeOperation = 'reshape'
    ) {
        this.id = uuidv4();
        this.label = label;
        this.operationType = operationType;
    }

    get size(): number {
        return this.output.length || 1;
    }

    // Execution offloaded to Web Worker
    calculateOutput(_incomingSynapses: ISynapse[] = []): number[] {
        return this.output;
    }
}
