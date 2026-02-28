import { v4 as uuidv4 } from 'uuid';
import type { INeuron, ISynapse, NeuronType } from './types';

export type MatrixOperation = 'dot' | 'matmul' | 'outer';

export class TensorMatrixOp implements INeuron {
    id: string;
    type: NeuronType = 'tensor-matrix-op';
    label: string;
    output: number[] = [];
    shape: number[] = [];

    operationType: MatrixOperation;

    constructor(
        label: string = 'Matrix Op',
        operationType: MatrixOperation = 'matmul'
    ) {
        this.id = uuidv4();
        this.label = label;
        this.operationType = operationType;
    }

    get size(): number {
        return this.output.length || 1;
    }

    // Actual execution is offloaded to the Web Worker. This is a stub for type compliance.
    calculateOutput(_incomingSynapses: ISynapse[] = []): number[] {
        return this.output;
    }
}
